#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UPSTREAM_DIR="${ROOT_DIR}/upstream"

"$ROOT_DIR/scripts/bootstrap.sh"

export OPENCLAW_CONFIG_DIR="${OPENCLAW_CONFIG_DIR:-$ROOT_DIR/data/config}"
export OPENCLAW_WORKSPACE_DIR="${OPENCLAW_WORKSPACE_DIR:-$ROOT_DIR/data/workspace}"

mkdir -p "$OPENCLAW_CONFIG_DIR" "$OPENCLAW_WORKSPACE_DIR"

echo "Using OPENCLAW_CONFIG_DIR=$OPENCLAW_CONFIG_DIR"
echo "Using OPENCLAW_WORKSPACE_DIR=$OPENCLAW_WORKSPACE_DIR"
echo ""

cd "$UPSTREAM_DIR"
exec ./docker-setup.sh "$@"
