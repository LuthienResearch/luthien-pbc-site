#!/usr/bin/env bash
# Site validation checks. Run before every version publish.
# Exit 1 on any error. Warnings don't block.
set -euo pipefail

SITE_DIR="$(cd "$(dirname "$0")/../site" && pwd)"
ERRORS=0
WARNINGS=0

red()    { printf '\033[0;31m%s\033[0m\n' "$*"; }
green()  { printf '\033[0;32m%s\033[0m\n' "$*"; }
yellow() { printf '\033[0;33m%s\033[0m\n' "$*"; }
bold()   { printf '\033[1m%s\033[0m\n' "$*"; }

fail() { red "  FAIL: $*"; ERRORS=$((ERRORS + 1)); }
warn() { yellow "  WARN: $*"; WARNINGS=$((WARNINGS + 1)); }
pass() { green "  OK: $*"; }

# Helper: extract local href/src values from an HTML file (skip http, mailto, #, data:, javascript:)
extract_local_refs() {
    local file="$1"
    # Pull all href="..." and src="..." values
    sed -n 's/.*\(href\|src\)="\([^"]*\)".*/\2/p' "$file" 2>/dev/null | while IFS= read -r ref; do
        case "$ref" in
            https://*|http://*|mailto:*|data:*|javascript:*|//*|\#*) continue ;;
            *) echo "$ref" ;;
        esac
    done
}

# Helper: extract ALL href/src values (handles multiple per line)
extract_all_refs() {
    local file="$1"
    # Use grep to find all href="..." and src="..." then extract the URL
    grep -oE '(href|src)="[^"]*"' "$file" 2>/dev/null | sed 's/.*="\(.*\)"/\1/' | while IFS= read -r ref; do
        case "$ref" in
            https://*|http://*|mailto:*|data:*|javascript:*|//*) continue ;;
            \#*) continue ;;
            *) echo "$ref" ;;
        esac
    done
}

# ─────────────────────────────────────────────────────────
bold "== 1. Broken internal links =="
# ─────────────────────────────────────────────────────────
link_errors=0
while IFS= read -r html_file; do
    dir=$(dirname "$html_file")
    relfile="${html_file#$SITE_DIR/}"
    while IFS= read -r link; do
        [ -z "$link" ] && continue
        # Strip query string and fragment
        clean="${link%%\?*}"
        clean="${clean%%#*}"
        [ -z "$clean" ] && continue
        target="$dir/$clean"
        if [ -f "$target" ]; then
            continue
        elif [ -d "$target" ] && [ -f "$target/index.html" ]; then
            continue
        else
            fail "$relfile -> $link (target not found)"
            link_errors=$((link_errors + 1))
        fi
    done < <(extract_all_refs "$html_file")
# Skip legacy versions (v8, v9) which have known pre-existing asset issues
done < <(find "$SITE_DIR" -name "*.html" -type f -not -path "*/v8/*" -not -path "*/v9/*")
[ "$link_errors" -eq 0 ] && pass "All internal links resolve ($( find "$SITE_DIR" -name '*.html' -type f -not -path '*/v8/*' -not -path '*/v9/*' | wc -l | tr -d ' ') HTML files checked)"

# ─────────────────────────────────────────────────────────
bold ""
bold "== 2. Version directory completeness =="
# ─────────────────────────────────────────────────────────
# COE: v10.9.1 shipped with broken images because only index.html was copied.
# This check ensures every local src= in a version dir points to an actual file.
version_errors=0
vcount=0
while IFS= read -r vdir; do
    vname=$(basename "$vdir")
    vcount=$((vcount + 1))
    if [ ! -f "$vdir/index.html" ]; then
        fail "$vname/ missing index.html"
        version_errors=$((version_errors + 1))
        continue
    fi
    # Check local src= references (images, svgs, css)
    while IFS= read -r src; do
        [ -z "$src" ] && continue
        case "$src" in https://*|http://*|data:*|//*|../*) continue;; esac
        if [ ! -f "$vdir/$src" ]; then
            fail "$vname/index.html references '$src' but file missing from $vname/"
            version_errors=$((version_errors + 1))
        fi
    done < <(grep -oE 'src="[^"]*"' "$vdir/index.html" 2>/dev/null | sed 's/src="\(.*\)"/\1/' || true)
# Skip legacy versions (v8, v9) with known pre-existing issues
done < <(find "$SITE_DIR" -maxdepth 1 -type d -name "v*" -not -name "v8" -not -name "v9" | sort)
[ "$version_errors" -eq 0 ] && pass "All $vcount version directories have required assets"

# ─────────────────────────────────────────────────────────
bold ""
bold "== 3. Blog post consistency =="
# ─────────────────────────────────────────────────────────
blog_errors=0
BLOG_DIR="$SITE_DIR/blog"
if [ -d "$BLOG_DIR" ]; then
    post_count=0
    # Every blog post directory must have index.html
    while IFS= read -r post_dir; do
        post_name=$(basename "$post_dir")
        post_count=$((post_count + 1))
        if [ ! -f "$post_dir/index.html" ]; then
            fail "blog/$post_name/ missing index.html"
            blog_errors=$((blog_errors + 1))
        fi
    done < <(find "$BLOG_DIR" -mindepth 1 -maxdepth 1 -type d)

    # Every blog post must be listed in blog/index.html
    if [ -f "$BLOG_DIR/index.html" ]; then
        while IFS= read -r post_dir; do
            post_name=$(basename "$post_dir")
            if ! grep -q "$post_name" "$BLOG_DIR/index.html" 2>/dev/null; then
                fail "blog/$post_name/ exists but not listed in blog/index.html"
                blog_errors=$((blog_errors + 1))
            fi
        done < <(find "$BLOG_DIR" -mindepth 1 -maxdepth 1 -type d)
    else
        fail "blog/index.html missing"
        blog_errors=$((blog_errors + 1))
    fi

    # Every blog post linked from blog/index.html must exist as a directory
    if [ -f "$BLOG_DIR/index.html" ]; then
        while IFS= read -r href; do
            [ -z "$href" ] && continue
            case "$href" in https://*|http://*|../*|\#*) continue;; esac
            target="$BLOG_DIR/$href"
            if [ ! -d "$target" ] && [ ! -f "${target}index.html" ] && [ ! -f "$target" ]; then
                fail "blog/index.html links to '$href' but target doesn't exist"
                blog_errors=$((blog_errors + 1))
            fi
        done < <(grep -oE 'href="[^"]*/"' "$BLOG_DIR/index.html" 2>/dev/null | sed 's/href="\(.*\)"/\1/' || true)
    fi
    [ "$blog_errors" -eq 0 ] && pass "All $post_count blog posts have index.html, are indexed, and cross-referenced"
else
    warn "No blog/ directory found"
fi

# ─────────────────────────────────────────────────────────
bold ""
bold "== 4. Nav link consistency =="
# ─────────────────────────────────────────────────────────
nav_errors=0
MAIN_HTML="$SITE_DIR/index.html"
if [ -f "$MAIN_HTML" ]; then
    # Extract anchor-only nav links (href="#something")
    while IFS= read -r anchor; do
        [ -z "$anchor" ] && continue
        if ! grep -q "id=\"$anchor\"" "$MAIN_HTML" 2>/dev/null; then
            fail "index.html links to #$anchor but no id=\"$anchor\" found"
            nav_errors=$((nav_errors + 1))
        fi
    done < <(grep -oE 'href="#[a-zA-Z][a-zA-Z0-9_-]*"' "$MAIN_HTML" 2>/dev/null | sed 's/href="#\(.*\)"/\1/' | sort -u || true)
fi
[ "$nav_errors" -eq 0 ] && pass "All nav links resolve"

# ─────────────────────────────────────────────────────────
bold ""
bold "== 5. No stale version references in blog/subpages =="
# ─────────────────────────────────────────────────────────
# Blog posts and subpages hardcode version paths (../../v10.9.1/).
# When we publish a new version, those should be updated.
stale_errors=0
while IFS= read -r html_file; do
    relfile="${html_file#$SITE_DIR/}"
    # Skip files inside version dirs (they reference themselves)
    case "$relfile" in v*) continue;; esac
    while IFS= read -r href; do
        [ -z "$href" ] && continue
        vdir_name=$(echo "$href" | grep -oE 'v[0-9]+\.[0-9.]+' | head -1 || true)
        [ -z "$vdir_name" ] && continue
        if [ ! -d "$SITE_DIR/$vdir_name" ]; then
            warn "$relfile references $vdir_name/ which doesn't exist"
        fi
    done < <(grep -oE 'href="[^"]*"' "$html_file" 2>/dev/null | sed 's/href="\(.*\)"/\1/' || true)
done < <(find "$SITE_DIR" -name "*.html" -type f)
pass "Stale version reference check complete (warnings above if any)"

# ─────────────────────────────────────────────────────────
bold ""
bold "== 6. CSS/font references =="
# ─────────────────────────────────────────────────────────
# Check that referenced CSS files exist
css_errors=0
while IFS= read -r html_file; do
    dir=$(dirname "$html_file")
    relfile="${html_file#$SITE_DIR/}"
    while IFS= read -r css; do
        [ -z "$css" ] && continue
        case "$css" in https://*|http://*) continue;; esac
        if [ ! -f "$dir/$css" ]; then
            fail "$relfile references CSS '$css' but file not found"
            css_errors=$((css_errors + 1))
        fi
    done < <(grep -oE 'href="[^"]*\.css"' "$html_file" 2>/dev/null | sed 's/href="\(.*\)"/\1/' || true)
done < <(find "$SITE_DIR" -name "*.html" -type f -not -path "*/v8/*" -not -path "*/v9/*")
[ "$css_errors" -eq 0 ] && pass "All local CSS references resolve"

# ─────────────────────────────────────────────────────────
bold ""
bold "== 7. HTML structure basics =="
# ─────────────────────────────────────────────────────────
struct_errors=0
struct_count=0
while IFS= read -r html_file; do
    relpath="${html_file#$SITE_DIR/}"
    struct_count=$((struct_count + 1))
    if ! grep -q '<title>' "$html_file" 2>/dev/null; then
        fail "$relpath missing <title> tag"
        struct_errors=$((struct_errors + 1))
    fi
    if ! grep -qi 'charset' "$html_file" 2>/dev/null; then
        fail "$relpath missing charset declaration"
        struct_errors=$((struct_errors + 1))
    fi
    if ! grep -q 'viewport' "$html_file" 2>/dev/null; then
        fail "$relpath missing viewport meta tag"
        struct_errors=$((struct_errors + 1))
    fi
    # Check for unclosed HTML (basic: count opening vs closing tags)
    if ! grep -q '</html>' "$html_file" 2>/dev/null; then
        fail "$relpath missing closing </html> tag"
        struct_errors=$((struct_errors + 1))
    fi
done < <(find "$SITE_DIR" -name "*.html" -type f -not -path "*/v8/*" -not -path "*/v9/*")
[ "$struct_errors" -eq 0 ] && pass "All $struct_count HTML files have title, charset, viewport, and closing tags"

# ─────────────────────────────────────────────────────────
bold ""
bold "== 8. Duplicate content between index.html and latest version =="
# ─────────────────────────────────────────────────────────
# The main site/index.html should match the latest version directory
latest_version=$(find "$SITE_DIR" -maxdepth 1 -type d -name "v*" | sort -V | tail -1)
if [ -n "$latest_version" ] && [ -f "$latest_version/index.html" ] && [ -f "$SITE_DIR/index.html" ]; then
    lvname=$(basename "$latest_version")
    if diff -q "$SITE_DIR/index.html" "$latest_version/index.html" >/dev/null 2>&1; then
        pass "index.html matches $lvname/index.html"
    else
        warn "index.html differs from $lvname/index.html - are they out of sync?"
    fi
fi

# ─────────────────────────────────────────────────────────
bold ""
bold "== 9. Untracked assets in site/ =="
# ─────────────────────────────────────────────────────────
# COE: PR #75 shipped with a broken <img src="sff-white.svg"> because the
# SVG existed only in the local working tree — never git-added. Check #1
# passed locally (filesystem test -f succeeds) but the file was missing
# from the deployed repo, so GitHub Pages served a broken image.
# This check catches that class of bug before push.
untracked_errors=0
REPO_ROOT="$(cd "$SITE_DIR/.." && pwd)"
while IFS= read -r f; do
    [ -z "$f" ] && continue
    case "$f" in
        site/*.svg|site/*.png|site/*.jpg|site/*.jpeg|site/*.gif|site/*.webp|site/*.ico|site/*.css|site/*.js|site/*.woff|site/*.woff2|site/*.html|site/*.pdf)
            fail "Untracked asset: $f (exists locally but not in git — will 404 on deploy if referenced)"
            untracked_errors=$((untracked_errors + 1))
            ;;
    esac
done < <(cd "$REPO_ROOT" 2>/dev/null && git ls-files --others --exclude-standard -- site/ 2>/dev/null || true)
[ "$untracked_errors" -eq 0 ] && pass "No untracked asset files in site/"

# ─────────────────────────────────────────────────────────
bold ""
bold "== 10. Spanish pitch deck sync =="
# ─────────────────────────────────────────────────────────
# The Spanish deck (site/pitch/es/index.html) must stay structurally
# in sync with the English deck (site/pitch/index.html). This check
# compares CSS rules, image references, grid layouts, and slide count
# so drift gets caught before deploy.
EN="$SITE_DIR/pitch/index.html"
ES="$SITE_DIR/pitch/es/index.html"
sync_errors=0
if [ -f "$EN" ] && [ -f "$ES" ]; then
    # 10a. Image/logo references: every src= image in EN should appear in ES
    en_imgs=$(grep -oE 'src="[^"]*\.(png|svg|jpeg|jpg|webp)"' "$EN" | sed 's|src="\.\.\/|src="|' | sort -u)
    es_imgs=$(grep -oE 'src="[^"]*\.(png|svg|jpeg|jpg|webp)"' "$ES" | sed 's|src="\.\.\/\.\.\/|src="|; s|src="\.\.\/|src="|' | sort -u)
    while IFS= read -r img; do
        [ -z "$img" ] && continue
        if ! echo "$es_imgs" | grep -qF "$img"; then
            imgname=$(echo "$img" | sed 's/src="//' | sed 's/"//')
            fail "Spanish deck missing image: $imgname"
            sync_errors=$((sync_errors + 1))
        fi
    done <<< "$en_imgs"

    # 10b. CSS class parity: key layout classes must match
    for pattern in "grid-template-columns: repeat(" ".compare-logo" ".compare-logo-2x" "font-size: 1.6em"; do
        en_count=$(grep -c "$pattern" "$EN" 2>/dev/null || echo 0)
        es_count=$(grep -c "$pattern" "$ES" 2>/dev/null || echo 0)
        if [ "$en_count" -gt 0 ] && [ "$es_count" -eq 0 ]; then
            fail "Spanish deck missing CSS pattern: $pattern (EN has $en_count, ES has 0)"
            sync_errors=$((sync_errors + 1))
        fi
    done

    # 10c. Slide count: both decks should have the same number of slides
    en_slides=$(grep -c 'data-slide=' "$EN" 2>/dev/null || echo 0)
    es_slides=$(grep -c 'data-slide=' "$ES" 2>/dev/null || echo 0)
    if [ "$en_slides" -ne "$es_slides" ]; then
        fail "Slide count mismatch: EN has $en_slides, ES has $es_slides"
        sync_errors=$((sync_errors + 1))
    fi

    # 10d. Angel investor count: both should list the same number
    en_angels=$(grep -c 'ask-f3-face"' "$EN" 2>/dev/null || echo 0)
    es_angels=$(grep -c 'ask-f3-face"' "$ES" 2>/dev/null || echo 0)
    if [ "$en_angels" -ne "$es_angels" ]; then
        fail "Angel count mismatch: EN has $en_angels, ES has $es_angels"
        sync_errors=$((sync_errors + 1))
    fi

    [ "$sync_errors" -eq 0 ] && pass "Spanish deck is structurally in sync with English"
else
    if [ ! -f "$ES" ]; then
        warn "No Spanish deck found at pitch/es/index.html"
    fi
fi

# ─────────────────────────────────────────────────────────
bold ""
bold "=========================================="
if [ "$ERRORS" -gt 0 ]; then
    red "FAILED: $ERRORS error(s), $WARNINGS warning(s)"
    exit 1
elif [ "$WARNINGS" -gt 0 ]; then
    yellow "PASSED with $WARNINGS warning(s)"
    exit 0
else
    green "ALL CHECKS PASSED"
    exit 0
fi
