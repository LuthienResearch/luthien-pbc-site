#!/usr/bin/env bash
set -euo pipefail

echo "== Checking for broken internal links =="
# Find all HTML files and check that local href/src targets exist
cd "$(dirname "$0")/../site"
errors=0
for html_file in $(find . -name "*.html" -type f); do
    dir=$(dirname "$html_file")
    # Extract local href/src values (skip http/https/mailto/# links)
    grep -oP '(?:href|src)="(?!https?://|mailto:|#|//)[^"]*"' "$html_file" 2>/dev/null | \
    sed 's/.*="\(.*\)"/\1/' | \
    while read -r link; do
        target="$dir/$link"
        if [ ! -f "$target" ] && [ ! -d "$target" ]; then
            echo "  BROKEN: $html_file -> $link"
            errors=$((errors + 1))
        fi
    done
done
cd ..

if [ "$errors" -gt 0 ]; then
    echo "Found $errors broken links!"
    exit 1
else
    echo "  All internal links OK"
fi

echo ""
echo "== Checking for large files (>1MB) =="
large_files=$(find site -type f -size +1M 2>/dev/null || true)
if [ -n "$large_files" ]; then
    echo "  WARNING: Large files found:"
    echo "$large_files" | while read -r f; do
        size=$(du -h "$f" | cut -f1)
        echo "    $f ($size)"
    done
else
    echo "  No large files"
fi

echo ""
echo "All checks completed."
