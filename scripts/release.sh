#!/usr/bin/env bash
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: $0 <version>"
  echo "Example: $0 1.0.0"
  exit 1
fi

VERSION="$1"
TAG="v${VERSION}"

# Validate version format
if ! echo "$VERSION" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+$'; then
  echo "Error: version must be in semver format (e.g., 1.0.0)"
  exit 1
fi

# Ensure we're on master
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "master" ]; then
  echo "Error: must be on master branch (currently on '$BRANCH')"
  exit 1
fi

# Ensure working tree is clean
if [ -n "$(git status --porcelain)" ]; then
  echo "Error: working tree is not clean. Commit or stash changes first."
  exit 1
fi

echo ">>> Pulling latest master..."
git pull origin master

echo ">>> Creating tag $TAG..."
git tag -a "$TAG" -m "Release $TAG"

echo ">>> Pushing tag..."
git push origin "$TAG"

echo ""
echo "=========================================="
echo "  Tag $TAG created and pushed!"
echo "=========================================="
echo ""
echo "GitHub Actions is now building Docker images:"
echo "  - ghcr.io/laikedou/blog-backend:$VERSION"
echo "  - ghcr.io/laikedou/blog-frontend:$VERSION"
echo ""
echo "Monitor: https://github.com/laikedou/blog/actions"
echo ""
