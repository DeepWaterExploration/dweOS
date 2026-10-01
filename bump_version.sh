#!/bin/bash
# Prepare a release: branch off main, bump the frontend version, prepend the
# changelog, commit, push, and open a PR. Merging the PR into main triggers
# .github/workflows/tag-release.yml, which tags the merge commit and builds
# the draft release.

set -euo pipefail

# Keep in sync with .github/workflows/tag-release.yml and cliff.toml
VERSION_REGEX='^v[0-9]+\.[0-9]+\.[0-9]+(-(alpha|beta|rc)(\.?[0-9]+)?)?$'
REMOTE=origin
BASE_BRANCH=main

usage() {
    cat <<EOF
Usage: $0 [-y] [--no-push] <version>

  <version>   X.Y.Z or vX.Y.Z (optionally with an -alpha/-beta/-rc suffix)
  -y, --yes   Push and open the PR without asking for confirmation
  --no-push   Stop after creating the local release commit
EOF
    exit 1
}

die() {
    echo "Error: $*" >&2
    exit 1
}

ASSUME_YES=false
PUSH=true
VERSION=""

while [ $# -gt 0 ]; do
    case "$1" in
    -y | --yes) ASSUME_YES=true ;;
    --no-push) PUSH=false ;;
    -h | --help) usage ;;
    -*) die "Unknown option: $1" ;;
    *)
        [ -z "$VERSION" ] || die "Only one version may be given"
        VERSION="$1"
        ;;
    esac
    shift
done

[ -n "$VERSION" ] || usage

# Tags and package.json use the v prefix
VERSION="v${VERSION#v}"
[[ "$VERSION" =~ $VERSION_REGEX ]] || die "Invalid version '$VERSION' (expected vX.Y.Z)"

BRANCH="release/$VERSION"

cd "$(dirname "$0")"

for cmd in git git-cliff npm; do
    command -v "$cmd" >/dev/null || die "$cmd is required but not installed"
done
if $PUSH; then
    command -v gh >/dev/null || die "gh is required to open the PR (or pass --no-push)"
fi

[ -z "$(git status --porcelain)" ] || die "Working tree is not clean"

echo "Fetching $REMOTE"
git fetch --tags "$REMOTE" "$BASE_BRANCH"

git rev-parse -q --verify "refs/tags/$VERSION" >/dev/null && die "Tag $VERSION already exists"
git rev-parse -q --verify "refs/heads/$BRANCH" >/dev/null && die "Branch $BRANCH already exists locally"
git ls-remote --exit-code --heads "$REMOTE" "$BRANCH" >/dev/null && die "Branch $BRANCH already exists on $REMOTE"

CURRENT_VERSION="$(git show "$REMOTE/$BASE_BRANCH:frontend/package.json" |
    sed -n 's/^ *"version": *"\(.*\)",*$/\1/p' | head -n1)"
if [ -n "$CURRENT_VERSION" ]; then
    NEWEST="$(printf '%s\n%s\n' "$CURRENT_VERSION" "$VERSION" | sort -V | tail -n1)"
    if [ "$NEWEST" != "$VERSION" ] || [ "$CURRENT_VERSION" = "$VERSION" ]; then
        die "$VERSION is not newer than the current version $CURRENT_VERSION"
    fi
fi

# If anything fails before the release commit, put the repo back how it was
ORIG_REF="$(git symbolic-ref -q --short HEAD || git rev-parse HEAD)"
COMMITTED=false
rollback() {
    local status=$?
    if [ $status -ne 0 ] && ! $COMMITTED; then
        echo "Rolling back $BRANCH" >&2
        git reset -q --hard
        git switch -q "$ORIG_REF" 2>/dev/null || git switch -q --detach "$ORIG_REF"
        git branch -q -D "$BRANCH"
    fi
}

# Step 1: branch off the latest main
echo "Creating $BRANCH from $REMOTE/$BASE_BRANCH"
git switch -q --no-track -c "$BRANCH" "$REMOTE/$BASE_BRANCH"
trap rollback EXIT

NOTES="$(git-cliff --unreleased --tag "$VERSION" --strip all)"
grep -q '^- ' <<<"$NOTES" || die "No conventional commits since the last release; nothing to release"

# Step 2: bump the version and prepend the changelog
echo "Bumping frontend version $CURRENT_VERSION -> $VERSION"
(
    cd frontend
    npm pkg set version="$VERSION"
    npm install --package-lock-only --ignore-scripts --no-audit --no-fund >/dev/null
)

echo "Prepending CHANGELOG.md"
git-cliff --unreleased --tag "$VERSION" --prepend CHANGELOG.md

git add frontend/package.json frontend/package-lock.json CHANGELOG.md
git commit -q -m "chore(release): $VERSION"
COMMITTED=true

echo
echo "Release notes for $VERSION:"
echo "----------------------------------------"
echo "$NOTES"
echo "----------------------------------------"

if ! $PUSH; then
    echo
    echo "Created the release commit on $BRANCH. To finish:"
    echo "  git push -u $REMOTE $BRANCH"
    echo "  gh pr create --base $BASE_BRANCH --head $BRANCH --title \"chore(release): $VERSION\""
    exit 0
fi

if ! $ASSUME_YES; then
    read -r -p "Push $BRANCH and open a PR into $BASE_BRANCH? [y/N] " reply
    if [[ ! "$reply" =~ ^[Yy]$ ]]; then
        echo "Not pushed. The release commit is on local branch $BRANCH."
        exit 0
    fi
fi

# Step 3: push and open the PR; Backend / Frontend CI run on it
git push -u "$REMOTE" "$BRANCH"
gh pr create \
    --base "$BASE_BRANCH" \
    --head "$BRANCH" \
    --title "chore(release): $VERSION" \
    --body "Release $VERSION. Merging this PR tags the merge commit as \`$VERSION\` and starts the release build.

$NOTES"
