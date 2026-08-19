#!/usr/bin/env bash
# System crontab wrapper: idle → silent exit; else wake OpenClaw cron agent once.
set -euo pipefail
export HOME=/home/chucky
export PATH="/home/chucky/.local/bin:/home/chucky/.nvm/versions/node/v24.19.0/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

LOG_DIR="${HOME}/logs"
mkdir -p "$LOG_DIR"
TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

TICK_OUT="$(/home/chucky/.local/bin/oc-delivery-tick 2>&1)" || true
KIND="$(printf '%s\n' "$TICK_OUT" | sed -n 's/^kind=//p' | head -1)"

echo "[$TS] tick kind=${KIND:-unknown}"
printf '%s\n' "$TICK_OUT" | sed 's/^/  /'

if [[ "${KIND:-}" == "idle" || -z "${KIND:-}" ]]; then
  echo "[$TS] idle — no Slack, no agent"
  exit 0
fi

# Only wake the LLM when there is an active delivery needing status or work.
MSG="$(cat <<'EOM'
You are the delivery-loop-tick worker. Keep the final reply under ~8 lines. Never dump exec commands, paths, allowlists, or tool XML.

Use ONLY this allowlisted helper first (do not cat files directly):
  /home/chucky/.local/bin/oc-delivery-status

Then:
1) If Status is none/paused/done or File is none → reply exactly: NO_REPLY
2) If delivery has no remaining "- [ ]" items → set Status done on the delivery file, set delivery-active Status/File to none, bump Updated, announce: Delivery complete (<title>).
3) If unchecked remain AND auto_continue is true: run EXACTLY ONE first unchecked item via:
   /home/chucky/.local/bin/oc-agent -p --approve-mcps --trust --force --workspace <Workspace if present> "<implement only this checkbox item>"
   On success mark [x], append one-line Log, update Updated/Active job. Announce short progress. Do not ask ¿Sigo? when auto_continue is true.
   Heavy items: /home/chucky/.local/bin/oc-long-job start; record Active job; announce started.
4) If unchecked remain AND auto_continue is false: announce short status only ("N pending; waiting for you to say sigue") — do NOT run oc-agent.
5) Web research only via /home/chucky/.local/bin/oc-web if needed for the item.

Tick precheck said:
EOM
)"
MSG="${MSG}
${TICK_OUT}"

# Deliver only when we already know work/status is needed (not idle).
openclaw agent \
  --agent cron \
  --message "$MSG" \
  --model ollama/qwen3.6:35b-a3b \
  --timeout 1200 \
  --deliver \
  --reply-channel slack \
  --reply-to user:UGN9SRK24 \
  --thinking off \
  2>&1 | sed 's/^/  agent: /' || {
    echo "[$TS] agent invocation failed (see above)"
    exit 1
  }

echo "[$TS] agent finished"
