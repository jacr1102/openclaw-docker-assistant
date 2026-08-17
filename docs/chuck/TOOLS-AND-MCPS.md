# Tools, wrappers & MCPs

**ES:** Binarios `oc-*`, Cursor CLI, Gmail y MCPs conectados en chucky.  
**EN:** `oc-*` bins, Cursor CLI, Gmail, and MCP servers on chucky.

Canonical day-to-day agent notes: [`agents/chuck/TOOLS.md`](../../agents/chuck/TOOLS.md).  
Live inventory export: [`docs/inventory/bins.md`](../inventory/bins.md), [`docs/inventory/mcps.md`](../inventory/mcps.md).

## Cursor CLI

- Install: `curl -fsS https://cursor.com/install | bash`
- Login: `agent login` (or `cursor-agent` login flow)
- Symlinks: `~/.local/bin/agent` → `cursor-agent` version dir
- OpenClaw primary chat model: **`cursor-cli/auto`** via `agents.defaults.cliBackends.cursor-cli`

Wrappers pin `OC_AGENT_BIN` to a versioned path under `~/.local/share/cursor-agent/versions/…`. After upgrading Cursor CLI, update the pin in `oc-agent` / `oc-gmail-agent` or set `OC_AGENT_BIN`.

## `oc-*` wrappers (install to `~/.local/bin`)

Repo copies: [`agents/chuck/bin/`](../../agents/chuck/bin/).

| Binary | Purpose |
|--------|---------|
| `oc-agent` | Coding / MCP via Cursor agent (`timeout` wrapper) |
| `oc-web` | Web research prompt → `oc-agent` (WebSearch/WebFetch) |
| `oc-gmail` | Fast Gmail REST (Node `oc-gmail.mjs`) — preferred for Slack |
| `oc-gmail-search` | Search helpers → `oc-gmail` |
| `oc-gmail-agent` | Fallback: Cursor + Gmail MCP (slow; hard 120s) |
| `oc-reset-session` | Gateway RPC session reset (`sessions.reset`) |

Also: **`gh`** (GitHub CLI) authenticated on chucky for issues/PRs.

### Copy onto a fresh host

```bash
scp agents/chuck/bin/oc-* chucky:~/.local/bin/
scp agents/chuck/oc-gmail.mjs chucky:~/.cursor/oc-gmail.mjs   # or path used by OC_GMAIL_SCRIPT
ssh chucky 'chmod +x ~/.local/bin/oc-*'
```

Adjust `HOME`, nvm Node path, and `OC_AGENT_BIN` inside wrappers if user/paths differ.

## Gmail

- Fast path: `oc-gmail` / `oc-gmail-search` (REST; see `agents/chuck/oc-gmail.mjs`)
- OAuth login helper: `agents/chuck/gmail-oauth-login.js` + notes in `agents/chuck/GMAIL_MCP_OAUTH.md`
- Aliases template: `agents/chuck/gmail-aliases.json.example` → live `gmail-aliases.json` (**gitignored**)
- MCP paths (inventory):
  - `~/.cursor/mcp.json` → local `gmail` + optional `gmail-hosted` (`mcp-remote` + OAuth client json)
  - OAuth client file: `~/.cursor/gmail-oauth-client.json` (**never commit**)

## MCPs

| Server | Role |
|--------|------|
| **mcsai-observability** | Live MCSAI admin (users/hours/…). Run via `oc-agent --approve-mcps` with workspace `…/repos/mcsai` |
| **gmail** / **gmail-hosted** | Cursor-side Gmail MCP (prefer `oc-gmail` for OpenClaw Slack) |

OpenClaw `mcp.servers` may expose a filtered `mcsai-observability` (see inventory). Env for MCP scripts stays on the host, not in git.

## Channels / plugins

| Channel | Status |
|---------|--------|
| **Slack** | Primary collaboration (Socket Mode). Tokens in `gateway.systemd.env` |
| **WhatsApp** | Plugin installed under `~/.openclaw/extensions/whatsapp` — needs QR link / login |

Plugin inventory: [`docs/inventory/plugins.md`](../inventory/plugins.md).

## Skills

Workspace skill: `tech-gate-delivery` — mirrored under [`agents/chuck/skills/`](../../agents/chuck/skills/).
