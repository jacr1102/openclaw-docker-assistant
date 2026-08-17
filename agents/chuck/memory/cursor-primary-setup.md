# Cursor primary + Qwen cron (2026-08-17)

## Routing
- **Chat / Slack / main agent**: Cursor CLI via OpenClaw plugin `cursor-cli` — primary model `cursor-cli/auto` (Cursor subscription Auto).
- **Cron jobs**: agent `cron` with primary `ollama/qwen3.6:35b-a3b` (local Ollama). Do **not** use Cursor for scheduled/cron work.
- Do not describe the stack as OpenAI; chat uses Cursor subscription CLI, cron uses local Qwen.

## Add cron jobs (Qwen)
```bash
openclaw cron add --agent cron --model ollama/qwen3.6:35b-a3b ...
# or rely on agent default:
openclaw cron add --agent cron ...
```

## Notes
- Plugin: `@jeehou/openclaw-cursor-cli` (id `cursor-cli`), binary `/home/chucky/.local/bin/cursor-agent`.
- Refresh catalog after Cursor updates: `bash ~/.openclaw/extensions/cursor-cli/scripts/refresh-models.sh`
- Heartbeat remains `0m` (disabled).
- Control UI exists for chat; a later custom web chat UI is feasible if needed.
- Wrapper `~/.local/bin/oc-agent` pins the same cursor-agent version as `~/.local/bin/agent` (2026.08.11-e8db854).

## Freeze / concurrency (2026-08-17)

**Why Slack felt blocked after Cursor-CLI-as-primary:** OpenClaw CLI backends default to a **single global run queue per provider id** when `serialize` is not `false`. With primary `cursor-cli/auto`, every Slack DM/channel/thread turn shared one `cursor-cli` lane — one long `cursor-agent` turn blocked unrelated chats (e.g. "hola"). Old Qwen+exec pattern used HTTP/Ollama (concurrent) and only blocked a *single session* when `exec` waited on Slack approval.

**Mitigations applied:** `agents.defaults.cliBackends.cursor-cli.serialize=false`; CLI no-output watchdog fresh≤300s / resume≤120s; `agents.defaults.timeoutSeconds=600`; `session.writeLock.acquireTimeoutMs=300000`.

**User recovery:** Slack `/new` (preferred) or `/reset` in the stuck conversation. Approve/deny pending exec approvals. Prefer not running two long coding tasks in parallel Slack chats on the same workspace.

