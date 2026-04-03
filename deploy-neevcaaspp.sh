#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VPS="root@31.97.211.40"
DB_LOCAL="$SCRIPT_DIR/server/data/neev.db"
DB_REMOTE="/opt/NeevCAASPP/server/data/neev.db"

BUMP="minor"
[[ "$1" == "--major" ]] && BUMP="major"

echo "🔢 Bumping $BUMP version..."
(cd "$SCRIPT_DIR" && npm version "$BUMP" --no-git-tag-version)
VERSION=$(node -p "require('$SCRIPT_DIR/package.json').version")
git -C "$SCRIPT_DIR" add package.json
git -C "$SCRIPT_DIR" commit -m "v$VERSION"

echo "⬆️  Pushing latest code to GitHub..."
git -C "$SCRIPT_DIR" push

echo "📤 Copying database to VPS..."
scp "$DB_LOCAL" "$VPS:$DB_REMOTE"

echo "🚀 Running deploy on VPS..."
ssh "$VPS" "bash /opt/NeevCAASPP/deploy.sh"

echo "✅ All done! Deployed v$VERSION"
