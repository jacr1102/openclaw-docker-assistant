# TOOLS.md - Local Notes

Skills describe generic behavior. This file is **our** specifics.

## GitHub

- Default product repo: **`jacr1102/mcsai`** (issues/PRs via `gh` unless told otherwise).
- **`gh` runs on the paired OpenClaw node** (e.g. Mac), not in the gateway container. Use **`exec`** against that node, then e.g. `/opt/homebrew/bin/gh` or `gh` on `PATH`. Auth is whatever is configured **on that machine** (`gh auth login`, etc.) — **not** `GH_TOKEN` on the VPS.
- Default commands with that `owner/repo`: `gh repo view jacr1102/mcsai`, `gh issue list --repo jacr1102/mcsai`, `gh pr list --repo jacr1102/mcsai` (add flags as needed). Prefer real output over guessing.

## Slack

- Bot is the team's dev assistant (**Chuck**).
- Prefer **threads** in busy channels when replies get long.
- _(optional)_ Important channels: `#…` / naming conventions — add if it helps routing context.

## OpenClaw / infra (non-secret)

- Control UI (HTTPS): `https://assistant.dhalia.fun` _(adjust if your hostname changed)_.
- Gateway ports on host: **18789** (typical); compose file: `docker-compose.prod.yml` on the deploy host.
- Workspace + config live on the server's bind mounts — **no credentials in this file**.

## Conventions (fill in as you agree)

- **Branches:** e.g. `feature/…`, `fix/…` _(write what you actually use)_.
- **Reviews:** e.g. PR required for `main` _(if applicable)_.

## What not to put here

- API keys, `GH_TOKEN`, gateway tokens, PEMs, `.env` contents, or private URLs with embedded secrets.

---

Add SSH host **aliases** (non-sensitive), service names, or glossary terms only if they help day-to-day.
