#!/usr/bin/env bash
# Deterministic OpenClaw session reset (gateway RPC). Safe backup when chat is stuck.
# Install: copy to ~/.local/bin/oc-reset-session and chmod +x
set -euo pipefail

REASON="reset"
KEY=""
LIST=0
DM=0

usage() {
  cat <<'HELP'
oc-reset-session — reset OpenClaw sessions via gateway RPC
  oc-reset-session              # reset agent:main:main
  oc-reset-session --dm         # same
  oc-reset-session --list       # list recent slack/main keys
  oc-reset-session --key KEY    # reset exact key
  oc-reset-session --reason new # or reset (default)
HELP
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --list|-l) LIST=1; shift ;;
    --dm) DM=1; shift ;;
    --key) KEY="${2:-}"; shift 2 ;;
    --reason) REASON="${2:-reset}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

if [[ "$LIST" -eq 1 ]]; then
  openclaw sessions --active 10080 --limit 40 --json 2>/dev/null | python3 -c '
import sys, json
data=json.load(sys.stdin)
rows=data if isinstance(data, list) else data.get("sessions") or data.get("items") or []
for r in rows:
    key=r.get("key") or r.get("sessionKey") or ""
    if not key: continue
    if "slack" in key or ":main" in key:
        print(key)
' || openclaw sessions --active 10080 --limit 40
  exit 0
fi

if [[ "$DM" -eq 1 || -z "$KEY" ]]; then
  KEY="agent:main:main"
fi

if [[ "$REASON" != "new" && "$REASON" != "reset" ]]; then
  echo "reason must be new or reset" >&2
  exit 2
fi

PARAMS=$(python3 -c "import json; print(json.dumps({\"key\": \"$KEY\", \"reason\": \"$REASON\"}))")
echo "Resetting session key=$KEY reason=$REASON ..."
openclaw gateway call sessions.reset --params "$PARAMS"
echo "Done."
