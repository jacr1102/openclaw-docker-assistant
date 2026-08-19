# Exec approvals on chucky (2026-08-19)

## Policy

- `tools.exec.mode=allowlist` → allowlisted/safe-bin commands run with **no prompt**; everything else is **denied** (no Slack DM hang).
- Host `~/.openclaw/exec-approvals.json`: `defaults.ask=off`, `askFallback=deny`, `security=allowlist` (same for agents `main` and `cron`).
- `channels.slack.execApprovals.enabled=false` so approval DMs do not park sessions for 5–30 minutes.

## Allowlisted daily bins

`oc-agent`, `oc-web`, `oc-gmail`, `oc-gmail-search`, `oc-gmail-agent`, `oc-long-job`, `oc-delivery-status`, `oc-delivery-tick`, `oc-delivery-cron.sh`, `gh` (plus absolute paths under `/home/chucky/.local/bin/` and `/usr/bin/gh`, and globs `oc-*` / `/home/chucky/.local/bin/oc-*`).

## How ask vs auto works

| Mode | Allowlist hit | Miss |
|------|---------------|------|
| `allowlist` (current) | auto-run | deny (no Ask) |
| `ask` (previous) | auto-run | Slack Approve DM (hangs) |
| `full` | auto-run | auto-run (unrestricted) |

Shell chains (`cd … && cmd`) still need **every** top-level segment allowlisted.

Backups on host: `~/.openclaw/*.bak-before-exec-allowlist-auto-*`.
