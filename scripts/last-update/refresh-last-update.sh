#!/usr/bin/env bash
#
# Regenerate scripts/last-update/data.json locally (macOS + Linux).
#
# Recomputes each built document's last-update time from this repo's full git
# history, then shows what changed. Commit the result and open a PR (the same
# file the "Refresh Docs Last-Update Map" GitHub workflow produces).
#
# Requirements: git, Node.js, and a full (non-shallow) clone. No `yarn install`
# needed — the generator uses only Node built-ins.
#
# Usage:
#   ./scripts/last-update/refresh-last-update.sh
#   # or: yarn last-update:refresh

set -eu

# Resolve the repo root from this script's location (scripts/last-update/..),
# so it works no matter where it's invoked from.
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

command -v git >/dev/null 2>&1 || { echo "error: git not found in PATH" >&2; exit 1; }
command -v node >/dev/null 2>&1 || { echo "error: node not found in PATH" >&2; exit 1; }

# A shallow clone would collapse every file to the latest commit. Detect it via
# the modern flag, falling back to the shallow marker file for older git.
is_shallow() {
  if git rev-parse --is-shallow-repository >/dev/null 2>&1; then
    [ "$(git rev-parse --is-shallow-repository)" = "true" ]
  else
    [ -f "$(git rev-parse --git-path shallow 2>/dev/null)" ]
  fi
}
if is_shallow; then
  echo "error: shallow clone detected — the generated dates would be wrong." >&2
  echo "       run this once, then retry:  git fetch --unshallow" >&2
  exit 1
fi

echo "Regenerating docs last-update map from git history..."
node scripts/last-update/generate.js

if git diff --quiet -- scripts/last-update/data.json; then
  echo "No changes — scripts/last-update/data.json is already up to date."
else
  echo
  echo "Updated scripts/last-update/data.json:"
  git --no-pager diff --stat -- scripts/last-update/data.json
  echo
  echo "Next steps:"
  echo "  git add scripts/last-update/data.json"
  echo "  git commit -m 'chore(docs): refresh last-update map'"
  echo "  # then push a branch and open a PR"
fi
