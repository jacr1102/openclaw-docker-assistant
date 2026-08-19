# Exec approvals on chucky (2026-08-19)

## Policy

| Agent | `tools.exec.mode` | Approvals `security` | Behavior |
|-------|-------------------|----------------------|----------|
| **main** | `full` | `full` (`ask=off`) | Exec on `host=gateway` auto-runs — **no Approve DM**, **no allowlist miss** |
| **cron** | `allowlist` | `allowlist` (`ask=off`) | Only allowlisted bins; misses **denied** (no hang) |
| Global default | `allowlist` | defaults `allowlist` | Stricter of config + `~/.openclaw/exec-approvals.json` wins (`minSecurity`) |

- Host file: `~/.openclaw/exec-approvals.json`
- `channels.slack.execApprovals.enabled=false` so approval DMs do not park sessions.

### Risk (main = full)

`main` can run **any** gateway-host command the model puts in `exec.command` (as user `chucky`). Prefer native `read` / `memory_*` for files; keep dangerous ops out of prompts. Cron stays locked to the allowlist.

## Why allowlist was failing (2026.7.1-2)

OpenClaw matches **resolved executables per pipeline segment**, not free text:

1. **Natural language** in `command` (e.g. `list files in ~/.openclaw/workspace/memory/ -> show first 30 lines`) — first token is `list` (not a binary); `->` is treated as a **redirect**.
2. **Redirects** (`2>/dev/null`, `>`, `>>`, `->`) set `authorizationPlan.reason=redirect` → `analysisOk=false` → **`exec denied: allowlist miss` before allowlist patterns apply**. A `*` pattern does **not** help.
3. Clean argv works under allowlist, e.g. `/bin/ls … | head -5` or `/home/chucky/.local/bin/oc-agent …` (on Ubuntu, `/usr/bin/ls` often realpaths to `/usr/lib/cargo/bin/coreutils/ls`).

Gateway logs redact `command`; recover argv from agent session/trajectory JSONL.

## Agent rules

See workspace `AGENTS.md`: real shell argv only; prefer `read` / `memory_get` / `memory_search` for memory listing; avoid redirects on cron/allowlist paths.

## Backups

Host: `~/.openclaw/*.bak-before-exec-full-*` (and earlier `*.bak-before-exec-allowlist-*`).
