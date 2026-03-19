#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UPSTREAM_DIR="${ROOT_DIR}/upstream"
UPSTREAM_URL="${OPENCLAW_UPSTREAM_URL:-https://github.com/openclaw/openclaw.git}"
UPSTREAM_REF="${OPENCLAW_UPSTREAM_REF:-main}"

if [[ -d "$UPSTREAM_DIR/.git" ]]; then
 echo "Upstream already present: $UPSTREAM_DIR"
 git -C "$UPSTREAM_DIR" pull --ff-only origin "$UPSTREAM_REF" 2>/dev/null || \
  echo "Note: could not fast-forward upstream (offline or shallow clone); continuing with existing tree."
 exit 0
fi

echo "Cloning OpenClaw into $UPSTREAM_DIR ..."
git clone --depth 1 --branch "$UPSTREAM_REF" "$UPSTREAM_URL" "$UPSTREAM_DIR"
echo "Done. Run from repo root: ./scripts/docker-setup.sh"
