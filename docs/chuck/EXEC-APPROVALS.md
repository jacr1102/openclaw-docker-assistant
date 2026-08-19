# Exec approvals on chucky (2026-08-19)

## Policy

- `tools.exec.mode=allowlist` → allowlisted/safe-bin commands run with **no prompt**; everything else is **denied** (no Slack DM hang).
- Host `~/.openclaw/exec-approvals.json`: `defaults.ask=off`, `askFallback=deny`, `security=allowlist` (same for agents `main` and `cron`).
- `channels.slack.execApprovals.enabled=false` so approval DMs do not park sessions for 5–30 minutes.
- **Do not** set mode back to `ask` (autonomy) or unrestricted `full` unless allowlist cannot express needed wrappers.

## Allowlisted bins

### Wrappers / GitHub

`oc-agent`, `oc-web`, `oc-gmail`, `oc-gmail-search`, `oc-gmail-agent`, `oc-long-job`, `oc-delivery-status`, `oc-delivery-tick`, `oc-delivery-cron.sh`, `oc-reset-session`, `gh` (plus absolute paths under `/home/chucky/.local/bin/` and `/usr/bin/gh`, and globs `oc-*` / `/home/chucky/.local/bin/oc-*`).

### Repo exploration / shell autonomy (main + cron)

Bare names and absolute paths (and Ubuntu `resolvedRealPath` under `/usr/lib/cargo/bin/coreutils/…` where applicable):

`ls`, `cat`, `head`, `tail`, `find`, `git`, `grep`, `rg`, `sed`, `awk`/`gawk`, `jq`, `pwd`, `echo`, `printf`, `wc`, `sort`, `uniq`, `mkdir`, `cp`, `mv`, `touch`, `bash`, `sh`, `file`, `stat`, `env`, `which`, `basename`, `dirname`, `realpath`, `cut`, `tr`, `xargs`, `tee`, `test`/`true`/`false`, `curl`, `ssh`, plus host info bins already present (`hostname`, `uname`, `free`, `df`, …).

**Why coreutils paths:** OpenClaw path-pattern matching uses `resolvedRealPath`. On this host many `/usr/bin/ls` style links resolve to `/usr/lib/cargo/bin/coreutils/ls` — those realpaths are allowlisted for safe tools only (not a broad `coreutils/*` glob).

## Explicitly denied (not allowlisted)

- `sudo` / `/usr/bin/sudo` — never allowlist local sudo on chucky.
- `rm`, `dd`, `mkfs`, `shutdown`, and similar destructive tools — leave denied; prefer `oc-agent` / careful workflows for deletes.
- Do **not** allowlist `chmod`/`chown` broadly.

## Shell chains and `bash -lc`

- Chains (`cmd1 && cmd2`, pipes) require **every** top-level segment allowlisted.
- `bash -lc '…'` / `sh -c '…'` requires `/bin/bash` (or `bash`) **and** each analyzed inner command allowlisted.
- Prefer simple argv forms: `ls /abs/path`, `find /abs/path -name '*delivery*'`, `head -n 20 file` over complex unanalyzable shells (heredocs, command substitution, redirects can still deny).

## How ask vs auto works

| Mode | Allowlist hit | Miss |
|------|---------------|------|
| `allowlist` (current) | auto-run | deny (no Ask) |
| `ask` (previous) | auto-run | Slack Approve DM (hangs) |
| `full` | auto-run | auto-run (unrestricted) |

Backups on host: `~/.openclaw/*.bak-before-shell-allowlist-*` (and earlier `*.bak-before-exec-allowlist-auto-*`).
