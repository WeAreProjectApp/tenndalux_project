#!/bin/bash
# Build Next.js static export and deploy to Django backend
# Usage: bash build_to_django.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR"
BACKEND_DIR="$SCRIPT_DIR/../backend"
OUT_DIR="$FRONTEND_DIR/out"

echo "==> Building Next.js static export..."
cd "$FRONTEND_DIR"
npx next build

echo "==> Cleaning previous deployment..."
rm -rf "$BACKEND_DIR/static/_next"
rm -rf "$BACKEND_DIR/templates/frontend"

echo "==> Copying static assets to backend/static/..."
mkdir -p "$BACKEND_DIR/static"

# Copy _next (JS/CSS chunks)
cp -r "$OUT_DIR/_next" "$BACKEND_DIR/static/_next"

# Copy public folder assets (images, videos, svgs)
for item in "$OUT_DIR"/*/; do
    dirname=$(basename "$item")
    # Skip directories that are HTML pages (they have index.html inside)
    if [ "$dirname" = "_next" ] || [ "$dirname" = "_not-found" ] || [ "$dirname" = "404" ]; then
        continue
    fi
    # If the directory contains index.html, it's an HTML page, not a static asset
    if [ -f "$item/index.html" ]; then
        continue
    fi
    # Wipe the previous copy first. `cp -r src/ dest` puts the contents in
    # dest only while dest does NOT exist; once it does, it nests them into
    # dest/src instead, so newly added files land on a path nobody serves and
    # the stale copy keeps answering. Every public/ directory is cleaned here
    # rather than in a hand-maintained list above, which is what let
    # public/products/ and public/legal/ drift.
    rm -rf "$BACKEND_DIR/static/$dirname"
    cp -r "$item" "$BACKEND_DIR/static/$dirname"
done

# Copy root-level static files (svgs, ico, etc.)
for file in "$OUT_DIR"/*.svg "$OUT_DIR"/*.ico "$OUT_DIR"/*.png "$OUT_DIR"/*.webp "$OUT_DIR"/*.txt; do
    [ -f "$file" ] && cp "$file" "$BACKEND_DIR/static/"
done

# App Router emits route-scoped RSC payloads such as
# servicios/__next._tree.txt and portafolio/index.txt. Preserve their relative
# paths so nginx can serve client navigations without falling through to Django.
bash "$FRONTEND_DIR/scripts/copy-static-export-payloads.sh" \
    "$OUT_DIR" "$BACKEND_DIR/static"

echo "==> Copying HTML templates to backend/templates/frontend/..."
mkdir -p "$BACKEND_DIR/templates/frontend"

# Copy all HTML files preserving directory structure
find "$OUT_DIR" -name "index.html" | while read -r htmlfile; do
    # Get relative path from out dir
    relpath="${htmlfile#$OUT_DIR/}"
    reldir=$(dirname "$relpath")

    if [ "$reldir" = "." ]; then
        # Root index.html
        cp "$htmlfile" "$BACKEND_DIR/templates/frontend/index.html"
    else
        mkdir -p "$BACKEND_DIR/templates/frontend/$reldir"
        cp "$htmlfile" "$BACKEND_DIR/templates/frontend/$reldir/index.html"
    fi
done

# Also copy 404.html
if [ -f "$OUT_DIR/404.html" ]; then
    cp "$OUT_DIR/404.html" "$BACKEND_DIR/templates/frontend/404.html"
fi

echo "==> Done! Deployment structure:"
echo "    Templates: $BACKEND_DIR/templates/frontend/"
echo "    Static:    $BACKEND_DIR/static/"
find "$BACKEND_DIR/templates/frontend" -name "*.html" | sort | sed 's/^/    /'
