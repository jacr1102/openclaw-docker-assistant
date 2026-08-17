# Gmail MCP OAuth on chucky (one-time)

## Architecture (read this)

| Piece | Where |
| --- | --- |
| MCP config (`~/.cursor/mcp.json`) | **chucky only** |
| OAuth client (`~/.cursor/gmail-oauth-client.json`) | **chucky only** |
| Tokens (`~/.mcp-auth/mcp-remote-*/…_tokens.json`) | **chucky only** |
| Runtime (`agent` → `mcp-remote` → Google Gmail MCP) | **chucky only** |

**Mac is never on the email data path.** Cursor Desktop on Mac is not OpenClaw’s Gmail path.

A browser (Mac, phone, whatever) is only used once to click Google consent. After that, all Gmail tool calls stay on chucky. No `ssh -L`, no Mac port-forward, no Mac MCP for OpenClaw.

Config / scopes already on chucky: `gmail.readonly` + `gmail.compose`. Tool schemas load without tokens; **API calls need tokens** → finish OAuth once below.

---

## Auth (recommended): paste-code — no `ssh -L`

From your Mac (or anywhere), open an SSH session to chucky and run:

```bash
ssh -t chucky 'node ~/.cursor/gmail-oauth-login.js'
```

(`-t` allocates a TTY so paste prompts work.)

Then:

1. Copy the printed Google authorize URL into **any** browser.
2. Sign in / consent (readonly + compose/drafts).
3. Google redirects to `http://localhost:8787/oauth/callback?...` — the page will fail to load. **That is expected** (nothing needs to listen on the browser machine).
4. Copy the **full** address-bar URL (it contains `?code=...`) and paste it into the SSH session, then Enter.
5. Helper prints **Success** and writes tokens under `~/.mcp-auth/` **on chucky**.

### Verify (on chucky)

Prefer the fast REST CLI (no Cursor agent):

```bash
ssh chucky '/home/chucky/.local/bin/oc-gmail labels --limit 5'
ssh chucky '/home/chucky/.local/bin/oc-gmail search "newer_than:2d" --limit 3'
```

Optional MCP/agent check (slow; not used by OpenClaw for routine Gmail):

```bash
ssh chucky 'export PATH="$HOME/.local/bin:$PATH"; agent mcp list; agent mcp list-tools gmail'
```

---

## Auth (optional): callback listener on chucky Tailscale IP

Use if paste-from-address-bar is awkward. Browser hits chucky over Tailscale; still **no Mac tunnel**.

1. In [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → the OAuth client used in `~/.cursor/gmail-oauth-client.json`, add redirect URI:

   `http://100.88.86.99:8787/oauth/callback`

   (Also keep `http://localhost:8787/oauth/callback` for paste mode.)

2. On chucky:

```bash
ssh -t chucky 'node ~/.cursor/gmail-oauth-login.js --listen'
```

3. Open the printed URL in any browser that can reach `100.88.86.99` (Tailscale). Consent → callback hits chucky → tokens saved locally.

Custom bind / redirect host if needed:

```bash
node ~/.cursor/gmail-oauth-login.js --listen-host 0.0.0.0 --redirect-host 100.88.86.99
# or LAN:
node ~/.cursor/gmail-oauth-login.js --listen-host 0.0.0.0 --redirect-host 192.168.68.117
```

LAN redirect URI would be `http://192.168.68.117:8787/oauth/callback` (add that in Google Cloud too).

---

## Google Cloud OAuth client — redirect URIs

Client credentials live only on chucky: `~/.cursor/gmail-oauth-client.json` (do not commit).

| Mode | Redirect URI to allow |
| --- | --- |
| Paste-code (default) | `http://localhost:8787/oauth/callback` |
| Tailscale listen | `http://100.88.86.99:8787/oauth/callback` |
| LAN listen (optional) | `http://192.168.68.117:8787/oauth/callback` |

`mcp-remote` does not offer a true Google OOB / device-code flow for this hosted Gmail MCP; paste-code reuses the localhost redirect URI without needing a listener on either machine.

---

## Ongoing access (after tokens exist)

On chucky only:

```bash
export PATH="$HOME/.local/bin:$PATH"
agent mcp list
agent -p --approve-mcps --trust "List unread threads from the last 2 days"
```

OpenClaw / Chuck should invoke `agent` on the gateway host (chucky). Email never routes through the Mac.

---

## Notes

- Ask before send / trash / spam (scopes intentionally omit extras beyond compose/drafts).
- Do not invent email contents — use MCP output only.
- Re-run the login helper if refresh tokens are revoked or `~/.mcp-auth` is wiped.
- Do **not** configure Gmail MCP in Mac Cursor Desktop as OpenClaw’s path; keep Mac Desktop Gmail (if any) separate from Chuck.

## Slack / OpenClaw auto-routing

After tokens exist, Slack Chuck must use **`exec host=gateway` → `/home/chucky/.local/bin/oc-gmail search "…" --limit N`** automatically (no “use cursor” required). Never claim Gmail works until that command succeeds. See `AGENTS.md` / `TOOLS.md` → **Gmail auto-routing**.
