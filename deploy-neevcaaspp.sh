#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VPS="root@31.97.211.40"

BUMP="minor"
[[ "$1" == "--major" ]] && BUMP="major"

echo "🔢 Bumping $BUMP version..."
(cd "$SCRIPT_DIR" && npm version "$BUMP" --no-git-tag-version)
VERSION=$(node -p "require('$SCRIPT_DIR/package.json').version")
git -C "$SCRIPT_DIR" add package.json
git -C "$SCRIPT_DIR" commit -m "v$VERSION"

echo "⬆️  Pushing latest code to GitHub..."
git -C "$SCRIPT_DIR" push

echo "🚀 Running deploy on VPS..."
ssh "$VPS" "bash /opt/NeevCAASPP/deploy.sh"

echo "✅ All done! Deployed v$VERSION"
