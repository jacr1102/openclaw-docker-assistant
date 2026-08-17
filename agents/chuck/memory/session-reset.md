# Session reset (self-serve)

When Slack/WhatsApp chat is stuck ("Something went wrong… use /new"):

**Type exactly one of these as the whole message** (plain text, no slash needed):

- `reset`
- `new`

Also accepted when the channel delivers them: `/reset`, `/new`.

- `hola` alone does **not** reset.
- Slack often swallows `/new` as an unregistered slash command — prefer `reset` or `new` without `/`.
- Optional Slack app slash (if registered): `/openclaw /new` or `/openclaw /reset`.
- WhatsApp: same plain-text `reset` / `new` (text commands work).

Backup (SSH or from a working chat via exec): `oc-reset-session --dm`


## Slack slash commands (optional)

Slack does **not** auto-create slash commands. `commands.native: auto` is off for Slack.

Gateway already enables single-command mode: `/openclaw …` via `channels.slack.slashCommand`.

### A) Single command (usually already in app manifest)

1. Open https://api.slack.com/apps → your OpenClaw app
2. **Slash Commands** → confirm `/openclaw` exists (Socket Mode: no Request URL needed)
3. In Slack type: `/openclaw /new` or `/openclaw /reset`

### B) Native `/new` and `/reset` (optional)

1. Same app → **Slash Commands** → Create New Command
2. Add at least:
   - Command: `/new` — description: Start a new session
   - Command: `/reset` — description: Reset the current session
3. Socket Mode: leave Request URL empty / unused (payloads ride the websocket)
4. Reinstall / approve scopes if Slack prompts
5. Set OpenClaw `channels.slack.commands.native: true` (or global `commands.native: true`) and restart gateway

Until B is done, **prefer plain-text `reset` / `new`**.
