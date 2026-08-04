#!/bin/sh
# Build the site and publish dist/ to the `pages` repo, which Codeberg Pages
# serves at https://ethebee3.codeberg.page/.
#
# This is the manual equivalent of .woodpecker.yml. Once Woodpecker CI is
# enabled for this repo, pushing to main deploys automatically and you only
# need this for out-of-band deploys.
#
# Usage:  ./deploy.sh
# Git will prompt for a password on push — paste a Codeberg access token
# with write access to the `pages` repo.

set -eu

USER=${CODEBERG_USER:-ethebee3}
PAGES_REPO=${CODEBERG_PAGES_REPO:-pages}
REMOTE="https://$USER@codeberg.org/$USER/$PAGES_REPO.git"

cd "$(dirname "$0")"

if [ -n "$(git status --porcelain)" ]; then
  echo "Warning: you have uncommitted changes. Deploying them anyway."
  echo "         (Remember to commit and push the source to portfolio too.)"
  echo
fi

SHA=$(git rev-parse --short HEAD)

echo "==> Building"
npm run build

echo "==> Publishing dist/ to $USER/$PAGES_REPO"
cd dist
rm -rf .git
git init -q -b main
git add -A
git -c user.email=deploy@localhost -c user.name="deploy.sh" \
    commit -q -m "Deploy $SHA"
git push --force --quiet "$REMOTE" main:main

echo "==> Done. Live in a minute or so at https://$USER.codeberg.page/"
