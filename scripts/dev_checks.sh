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
            # Cloudflare _redirects targets (resolved post-deploy, not local files)
            /pitch.pdf|/luthien-deck.pdf) continue ;;
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
done < <(find "$SITE_DIR" -name "*.html" -type f)
[ "$link_errors" -eq 0 ] && pass "All internal links resolve ($( find "$SITE_DIR" -name '*.html' -type f | wc -l | tr -d ' ') HTML files checked)"

# ─────────────────────────────────────────────────────────
bold ""
bold "== 2. Blog post consistency =="
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
bold "== 3. Nav link consistency =="
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
bold "== 4. CSS/font references =="
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
done < <(find "$SITE_DIR" -name "*.html" -type f)
[ "$css_errors" -eq 0 ] && pass "All local CSS references resolve"

# ─────────────────────────────────────────────────────────
bold ""
bold "== 5. HTML structure basics =="
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
done < <(find "$SITE_DIR" -name "*.html" -type f)
[ "$struct_errors" -eq 0 ] && pass "All $struct_count HTML files have title, charset, viewport, and closing tags"

# ─────────────────────────────────────────────────────────
bold ""
bold "== 6. Untracked assets in site/ =="
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
bold "== 7. Deck tagline sync (/deck matches /pitch title slide) =="
# ─────────────────────────────────────────────────────────
# The /deck email-gate page has its own <title> and visible tagline,
# separate from /pitch. They drift every time we re-theme the deck
# (e.g. "AI's power is nothing without control" lingered on /deck
# after the pitch slide changed to "Safety = Trust = Power"). This
# check pins /deck to whatever headline is on the pitch title slide.
PITCH="$SITE_DIR/pitch/index.html"
DECK="$SITE_DIR/deck/index.html"
tagline_errors=0
if [ -f "$PITCH" ] && [ -f "$DECK" ]; then
    # Canonical tagline = first H1 after the title slide marker.
    # Grabs the next 20 lines so we catch the H1 regardless of nested divs.
    canonical=$(grep -A 20 'data-slide-name="title"' "$PITCH" \
        | grep -oE '<h1[^>]*>[^<]+</h1>' \
        | sed -E 's|<h1[^>]*>||; s|</h1>||' \
        | head -1)
    if [ -z "$canonical" ]; then
        fail "Could not extract canonical tagline from pitch title slide H1"
        tagline_errors=$((tagline_errors + 1))
    else
        if ! grep -qF "<title>Luthien: ${canonical}</title>" "$DECK"; then
            fail "deck/index.html <title> does not match: expected 'Luthien: ${canonical}'"
            tagline_errors=$((tagline_errors + 1))
        fi
        if ! grep -qF "<p class=\"tagline\">${canonical}</p>" "$DECK"; then
            fail "deck/index.html .tagline does not match: expected '${canonical}'"
            tagline_errors=$((tagline_errors + 1))
        fi
    fi
    [ "$tagline_errors" -eq 0 ] && pass "/deck title + tagline match pitch title slide ('${canonical}')"
fi

# ─────────────────────────────────────────────────────────
bold ""
bold "== 8. Seattle AI Safety Slack page =="
# ─────────────────────────────────────────────────────────
slack_errors=0
SLACK_DIR="$SITE_DIR/slack"
if [ ! -f "$SLACK_DIR/index.html" ]; then
    fail "slack/index.html missing"
    slack_errors=$((slack_errors + 1))
fi
if [ ! -f "$SLACK_DIR/invite.json" ]; then
    fail "slack/invite.json missing"
    slack_errors=$((slack_errors + 1))
elif ! node -e 'const c=require(process.argv[1]); if (!c.url || !c.expiresAt || !Number.isFinite(Date.parse(c.expiresAt))) process.exit(1)' "$SLACK_DIR/invite.json"; then
    fail "slack/invite.json is invalid"
    slack_errors=$((slack_errors + 1))
fi
if [ ! -f "$SLACK_DIR/slack.js" ]; then
    fail "slack/slack.js missing"
    slack_errors=$((slack_errors + 1))
elif ! node --check "$SLACK_DIR/slack.js" >/dev/null; then
    fail "slack/slack.js has invalid JavaScript"
    slack_errors=$((slack_errors + 1))
fi
if ! node "$REPO_ROOT/scripts/test-slack-page.mjs" >/dev/null; then
    fail "Slack page redirect or failure-path test failed"
    slack_errors=$((slack_errors + 1))
fi
if [ "$slack_errors" -eq 0 ]; then
    pass "Slack page, invite configuration, and redirect script are valid"
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
