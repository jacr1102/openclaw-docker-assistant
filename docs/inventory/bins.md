# Installed binaries / wrappers

Host: `chucky` — paths under `~/.local/bin`

## oc-* wrappers and agent links

```
lrwxrwxrwx 1 chucky chucky   79 Aug 15 16:11 /home/chucky/.local/bin/agent -> /home/chucky/.local/share/cursor-agent/versions/2026.08.11-e8db854/cursor-agent
lrwxrwxrwx 1 chucky chucky   79 Aug 15 16:11 /home/chucky/.local/bin/cursor-agent -> /home/chucky/.local/share/cursor-agent/versions/2026.08.11-e8db854/cursor-agent
-rwxr-xr-x 1 chucky chucky  489 Aug 17 00:16 /home/chucky/.local/bin/oc-agent
-rwxr-xr-x 1 chucky chucky  489 Aug  7 01:11 /home/chucky/.local/bin/oc-agent.bak-20260817
-rwxr-xr-x 1 chucky chucky  785 Aug  7 15:05 /home/chucky/.local/bin/oc-gmail
-rwxr-xr-x 1 chucky chucky  728 Aug  7 01:11 /home/chucky/.local/bin/oc-gmail-agent
-rwxr-xr-x 1 chucky chucky  902 Aug  7 15:05 /home/chucky/.local/bin/oc-gmail-search
-rwxr-xr-x 1 chucky chucky 1639 Aug 17 13:20 /home/chucky/.local/bin/oc-reset-session
-rwxr-xr-x 1 chucky chucky  737 Aug  7 17:00 /home/chucky/.local/bin/oc-web
/home/chucky/.nvm/versions/node/v24.19.0/bin/openclaw
```

## Versions

```
OpenClaw 2026.7.1-2 (0790d9f)
openclaw is /home/chucky/.nvm/versions/node/v24.19.0/bin/openclaw
lrwxrwxrwx 1 chucky chucky 41 Aug  6 20:12 /home/chucky/.nvm/versions/node/v24.19.0/bin/openclaw -> ../lib/node_modules/openclaw/openclaw.mjs
---
cursor-agent / agent (symlink target):
/home/chucky/.local/share/cursor-agent/versions/2026.08.11-e8db854/cursor-agent
--- oc-agent head ---
#!/usr/bin/env bash
set -euo pipefail
# OpenClaw-safe Cursor agent wrapper (coding). Prefer oc-gmail for Gmail.
export HOME=/home/chucky
export PATH="/home/chucky/.local/bin:/home/chucky/.nvm/versions/node/v24.19.0/bin:/usr/local/bin:/usr/bin:/bin:${PATH:-}"
AGENT="${OC_AGENT_BIN:-/home/chucky/.local/share/cursor-agent/versions/2026.08.11-e8db854/cursor-agent}"
TIMEOUT_SECS="${OC_AGENT_TIMEOUT:-600}"
exec /usr/bin/timeout --signal=TERM --kill-after=20 "${TIMEOUT_SECS}s" "$AGENT" "$@"
---
2026.08.11-e8db854
```

## Wrapper purposes (from comments / first lines)

### oc-agent
```
#!/usr/bin/env bash
set -euo pipefail
# OpenClaw-safe Cursor agent wrapper (coding). Prefer oc-gmail for Gmail.
export HOME=/home/chucky
export PATH="/home/chucky/.local/bin:/home/chucky/.nvm/versions/node/v24.19.0/bin:/usr/local/bin:/usr/bin:/bin:${PATH:-}"
AGENT="${OC_AGENT_BIN:-/home/chucky/.local/share/cursor-agent/versions/2026.08.11-e8db854/cursor-agent}"
TIMEOUT_SECS="${OC_AGENT_TIMEOUT:-600}"
exec /usr/bin/timeout --signal=TERM --kill-after=20 "${TIMEOUT_SECS}s" "$AGENT" "$@"
```

### oc-agent.bak-20260817
```
#!/usr/bin/env bash
set -euo pipefail
# OpenClaw-safe Cursor agent wrapper (coding). Prefer oc-gmail for Gmail.
export HOME=/home/chucky
export PATH="/home/chucky/.local/bin:/home/chucky/.nvm/versions/node/v24.19.0/bin:/usr/local/bin:/usr/bin:/bin:${PATH:-}"
AGENT="${OC_AGENT_BIN:-/home/chucky/.local/share/cursor-agent/versions/2026.08.04-aaa8809/cursor-agent}"
TIMEOUT_SECS="${OC_AGENT_TIMEOUT:-600}"
exec /usr/bin/timeout --signal=TERM --kill-after=20 "${TIMEOUT_SECS}s" "$AGENT" "$@"
```

### oc-gmail
```
#!/usr/bin/env bash
# Fast Gmail for OpenClaw — Gmail REST via Node (no Cursor agent loop).
# Usage:
#   oc-gmail labels --limit 5
#   oc-gmail search "newer_than:2d is:unread" --limit 5
#   oc-gmail search --multi entreverde tocancipa --newer-than 90d
#   oc-gmail payment-check [--property Entreverde]
#   oc-gmail drafts --limit 5
set -euo pipefail
export HOME=/home/chucky
export PATH="/home/chucky/.local/bin:/home/chucky/.nvm/versions/node/v24.19.0/bin:/usr/local/bin:/usr/bin:/bin:${PATH:-}"
NODE_BIN="${OC_GMAIL_NODE:-/home/chucky/.nvm/versions/node/v24.19.0/bin/node}"
SCRIPT="${OC_GMAIL_SCRIPT:-/home/chucky/.cursor/oc-gmail.mjs}"
TIMEOUT_SECS="${OC_GMAIL_TIMEOUT:-120}"
exec /usr/bin/timeout --signal=TERM --kill-after=10 "${TIMEOUT_SECS}s" \
  "$NODE_BIN" "$SCRIPT" "$@"
```

### oc-gmail-agent
```
#!/usr/bin/env bash
# Fallback: Cursor agent + Gmail MCP (slow / can hang). Prefer oc-gmail for Slack.
# Usage: oc-gmail-agent "Using gmail MCP list_labels pageSize 3; report names only"
set -euo pipefail
export HOME=/home/chucky
export PATH="/home/chucky/.local/bin:/home/chucky/.nvm/versions/node/v24.19.0/bin:/usr/local/bin:/usr/bin:/bin:${PATH:-}"
AGENT="${OC_AGENT_BIN:-/home/chucky/.local/share/cursor-agent/versions/2026.08.04-aaa8809/cursor-agent}"
TIMEOUT_SECS="${OC_GMAIL_AGENT_TIMEOUT:-120}"
if [[ $# -lt 1 ]]; then
  echo 'Usage: oc-gmail-agent "prompt for gmail MCP"' >&2
  exit 2
fi
exec /usr/bin/timeout --signal=TERM --kill-after=15 "${TIMEOUT_SECS}s" \
  "$AGENT" -p --print --approve-mcps --trust --force "$@"
```

### oc-gmail-search
```
#!/usr/bin/env bash
# Fast Gmail search helpers (REST).
# Usage:
#   oc-gmail-search "newer_than:2d is:unread" [--limit 5] [--json]
#   oc-gmail-search --multi "entreverde" "tocancipa" [--newer-than 90d] [--limit 5]
#   oc-gmail-search --payment-check [--property Entreverde] [--newer-than 90d]
set -euo pipefail
export HOME=/home/chucky

if [[ $# -lt 1 ]]; then
  cat >&2 <<'EOF'
Usage:
  oc-gmail-search "<gmail query>" [--limit N] [--json]
  oc-gmail-search --multi <term> [term...] [--newer-than 90d] [--limit N] [--json]
  oc-gmail-search --payment-check [--property NAME] [--newer-than 90d] [--limit N] [--json]
EOF
  exit 2
fi

if [[ "$1" == "--multi" ]]; then
  shift
  exec /home/chucky/.local/bin/oc-gmail search --multi "$@"
fi

if [[ "$1" == "--payment-check" ]]; then
```

### oc-reset-session
```
#!/usr/bin/env bash
# Deterministic OpenClaw session reset (gateway RPC). Safe backup when chat is stuck.
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
```

### oc-web
```
#!/usr/bin/env bash
# OpenClaw-safe web research via Cursor agent (WebSearch/WebFetch).
# Prefer this over OpenAI guessing. Do NOT use OpenClaw browser plugin.
set -euo pipefail
export HOME=/home/chucky
export PATH="/home/chucky/.local/bin:/home/chucky/.nvm/versions/node/v24.19.0/bin:/usr/local/bin:/usr/bin:/bin:${PATH:-}"
OC_AGENT="${OC_AGENT_WRAPPER:-/home/chucky/.local/bin/oc-agent}"
export OC_AGENT_TIMEOUT="${OC_WEB_TIMEOUT:-180}"

if [[ $# -lt 1 ]]; then
  echo "Usage: oc-web <research query>" >&2
  exit 2
fi

QUERY="$*"
PROMPT="Busca en la web: ${QUERY}. Usa WebSearch y WebFetch. No inventes datos en vivo. Resume fuentes (URLs) y datos clave de forma concisa."

exec "$OC_AGENT" -p --approve-mcps --trust --force "$PROMPT"
```


## OpenClaw gateway version (from systemd)

- Unit description: `OpenClaw Gateway (v2026.7.1-2)`
- PATH openclaw: `/home/chucky/.nvm/versions/node/v24.19.0/bin/openclaw`
- ExecStart binary: `/home/chucky/.nvm/versions/node/v24.19.0/bin/node`
```
v24.19.0
```

## cursor-agent version
- symlink: `/home/chucky/.local/share/cursor-agent/versions/2026.08.11-e8db854/cursor-agent`
- version dir: `2026.08.11-e8db854` (from path)
```
2026.08.11-e8db854
```
