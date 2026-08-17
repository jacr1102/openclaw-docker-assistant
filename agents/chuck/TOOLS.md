# TOOLS.md - Local Notes

Skills describe generic behavior. This file is **our** specifics.

## Exec defaults (native gateway on chucky)

- Gateway runs **natively on chucky** — prefer **`exec` with `host=gateway`** (local).
- **workdir** for approvals: **`/home/chucky/.openclaw/workspace`** (not `/home/node/...`).
- Hosts: **chucky** = local; **dhaliora / VPS / server2** = VPS via `ssh dhaliora`.

## HARD RULE — never sudo for OpenClaw wrappers / MCP

**Never** prefix `oc-agent`, `oc-gmail`, `oc-gmail-search`, `oc-gmail-agent`, `oc-web`, or `gh` with `sudo`.
**Never** use `sudo` for MCP / Cursor agent / Gmail / web / GitHub exec on chucky.

- Allowlisted binary is `/home/chucky/.local/bin/oc-agent` (or bare `oc-agent`) — **not** `/usr/bin/sudo`.
- `sudo …` misses the exec allowlist → Slack approval required → often `initiating-platform-disabled` / stuck.
- Correct pattern (MCSAI observability):

```bash
exec host=gateway workdir=/home/chucky/.openclaw/workspace/repos/mcsai
  /home/chucky/.local/bin/oc-agent -p --approve-mcps --trust --force --workspace /home/chucky/.openclaw/workspace/repos/mcsai "Using mcsai-observability users_list per_page=3; report count/total only"
```

VPS `sudo` over `ssh dhaliora` is separate and limited; do **not** allowlist local `sudo` on chucky.

## OpenClaw exec wrappers (preferred)

- **Always `exec host=gateway`**. Never `host=node` for Gmail/`agent` (Mac node is often disconnected; session `/exec host=node` overrides break gateway).
- **Never use `~` in exec commands** — OpenClaw may pass tilde literally and allowlist/spawn fails. Use absolute paths or wrappers below.

### Gmail — fast REST (ALWAYS; no “cursor” keyword)

**Primary (prefer this exact form):**

```bash
/home/chucky/.local/bin/oc-gmail search "newer_than:7d" --limit 5
/home/chucky/.local/bin/oc-gmail labels --limit 5
/home/chucky/.local/bin/oc-gmail drafts --limit 5
/home/chucky/.local/bin/oc-gmail payment-check
/home/chucky/.local/bin/oc-gmail search --multi entreverde tocancipa --newer-than 90d
```

- Auto-route every email ask via `exec host=gateway` → **`oc-gmail`**. User does **not** need to say “cursor” / MCP.
- **Never claim Gmail works** until this command succeeds. On OAuth/tokens missing: one Slack sentence + only `ssh -t chucky 'node /home/chucky/.cursor/gmail-oauth-login.js'`.
- Implementation: `/home/chucky/.cursor/oc-gmail.mjs` + tokens `/home/chucky/.mcp-auth/mcp-remote-*/<hash>_tokens.json`. Hard **120s** timeout (~1–3s normal).
- `oc-gmail-search` is a **thin alias** of `oc-gmail search` (same auth). Prefer **`oc-gmail search`** so the agent does not invent a separate broken tool.
- Property/payment presets: `/home/chucky/.openclaw/workspace/gmail-aliases.json` (non-secret).
- Do **not** use Cursor `agent -p` for routine Gmail. Optional fallback only if `oc-gmail` fails non-auth and Gmail MCP works: `oc-agent -p --approve-mcps …`.

### Coding — Cursor agent via exec (not chat primary)

Chat primary is **Qwen** (`ollama/qwen3.6:35b-a3b`). Use Cursor only through wrappers:

```bash
/home/chucky/.local/bin/oc-agent -p --approve-mcps --trust --force "…"
```

- **Fresh `-p` per coding task** — do not resume/accumulate Cursor agent sessions across tasks.
- One task at a time; keep the plan in `memory/`; after each task ask **¿sigo con la siguiente?**
- Fallback Gmail-via-agent (discouraged): `/home/chucky/.local/bin/oc-gmail-agent "…"` (120s timeout, `-p --print --approve-mcps --trust --force`).

### MCSAI live admin — observability MCP (not OS users)

For **live MCSAI product admin** (list/show **users**, **hours**, telemetry, customers, activity logs; activate/deactivate **when those MCP tools exist**):

- Use **`oc-agent` with `--approve-mcps`** against the **mcsai** workspace and the **`mcsai-observability`** MCP.
- **Do not** use `sudo` (including `sudo oc-agent` / `sudo oc-gmail` / `sudo gh`) / `useradd` / OS account changes.
- **Do not** use GitHub (`gh`) for live user/hours admin — `gh` is for code/issues/PRs only.
- Credentials live in gitignored `repos/mcsai/mcp/.env` (loaded by `run-mcp.sh`). Never print `.env`, passwords, or JWTs.

```bash
exec host=gateway workdir=/home/chucky/.openclaw/workspace/repos/mcsai
  /home/chucky/.local/bin/oc-agent -p --approve-mcps --trust --force --workspace /home/chucky/.openclaw/workspace/repos/mcsai "Using mcsai-observability: users_list per_page=3. Summarize counts only."
```

- MCP entry: `~/.cursor/mcp.json` → `mcsai-observability` → `bash /home/chucky/.openclaw/workspace/repos/mcsai/mcp/mcsai-observability/run-mcp.sh`
- Workspace copy: `repos/mcsai/.cursor/mcp.json` (absolute `run-mcp.sh` path).
- Read-only tools today include `users_list`, `users_show`, `hours_list`, `hours_show`, `hours_history`, plus telemetry/customers/activity. Prefer `per_page` (not `limit`).

### Web search — Cursor agent (preferred)

```bash
/home/chucky/.local/bin/oc-web "cartelera cine Bogotá hoy"
/home/chucky/.local/bin/oc-web "clima Bogotá mañana"
/home/chucky/.local/bin/oc-agent -p --approve-mcps --trust --force "Busca en la web: <query>. Resume fuentes y datos clave."
```

- **ALWAYS** for internet/web research, news, showtimes/cartelera, prices, weather, current events, or "busca en internet/web".
- Cursor agent uses **WebSearch** / **WebFetch**. OpenClaw’s job is only to **summarize** that output for Slack — never invent live facts from the chat model alone.
- Prefer **`oc-web`** (180s timeout + research prompt prefix). Equivalent: `oc-agent` with an explicit "Busca en la web…" prompt.
- **Do not** enable or use the OpenClaw `browser` plugin for ordinary web lookups.
- Ask the user only if the tool fails **twice** (timeouts/errors with no usable stdout).

### Example exec patterns

```text
# GitHub (read-only)
exec host=gateway workdir=/home/chucky/.openclaw/workspace
  /usr/bin/gh issue list --repo jacr1102/mcsai --limit 10

# Gmail (fast)
exec host=gateway workdir=/home/chucky/.openclaw/workspace
  /home/chucky/.local/bin/oc-gmail labels --limit 5

# MCSAI live admin (observability MCP — not sudo/useradd, not gh)
exec host=gateway workdir=/home/chucky/.openclaw/workspace/repos/mcsai
  /home/chucky/.local/bin/oc-agent -p --approve-mcps --trust --force --workspace /home/chucky/.openclaw/workspace/repos/mcsai "Using mcsai-observability MCP: hours_list per_page=5. Report counts/status only."

# Cursor agent (coding only)
exec host=gateway workdir=/home/chucky/.openclaw/workspace
  /home/chucky/.local/bin/oc-agent -p --approve-mcps --trust --force "Summarize open PRs in jacr1102/mcsai using gh"

# Web research (Cursor WebSearch/WebFetch)
exec host=gateway workdir=/home/chucky/.openclaw/workspace
  /home/chucky/.local/bin/oc-web "cartelera cine Bogotá hoy"
exec host=gateway workdir=/home/chucky/.openclaw/workspace
  /home/chucky/.local/bin/oc-agent -p --approve-mcps --trust --force "Busca en la web: clima Bogotá mañana. Resume fuentes y datos clave."

# VPS
exec host=gateway workdir=/home/chucky/.openclaw/workspace
  /usr/bin/ssh dhaliora 'hostname && systemctl is-active nginx'
```

## GitHub

- Default product repo: **`jacr1102/mcsai`**.
- Binary on chucky: **`/usr/bin/gh`** (authenticated on chucky). Primary path — **not** Mac-node `/opt/homebrew/bin/gh`.
- Default commands: `gh repo view jacr1102/mcsai`, `gh issue list --repo jacr1102/mcsai`, `gh pr list --repo jacr1102/mcsai`. Prefer real output over guessing.
- **Ask first** before mutate (create/comment/merge/close/push) unless the human clearly requested that exact action — **exception:** when **`skills/tech-gate-delivery/SKILL.md`** is active, Project/issue/PR create + merge-to-main after green review are authorized.
- Optional fallback: paired Mac node with Homebrew `gh` — only if gateway `gh` is unavailable.

## Tech gate delivery

- Skill: **`skills/tech-gate-delivery/SKILL.md`** (+ `examples.md`).
- Trigger: human pastes a tech gate + “trabaja en este proyecto” / “ejecuta este tech gate”.
- **Default target:** `#dhaliora` / **`jacr1102/digital-message-platform`**.  
  **Do NOT run tech-gate delivery against `jacr1102/mcsai`** unless the human explicitly names mcsai / `#mc-sai`.
- Flow: Project (create if needed) → all issues from gate → per issue: plan (tests + N+1) → security review → `oc-agent` implement PR → review/fix → merge default branch → next.
- Progress file: `memory/tech-gate-<slug>.md`. Gate docs: `memory/tech-gates/`.
- Coding/plans/reviews: `/home/chucky/.local/bin/oc-agent`. GitHub mutations: `/usr/bin/gh`.
- Clone repos under `/home/chucky/.openclaw/workspace/repos/<repo>` when implementing (Dhaliora: `repos/digital-message-platform`).

## Gmail (fast REST via `oc-gmail`)

- **ALWAYS** `exec host=gateway` → `/home/chucky/.local/bin/oc-gmail search "<query>" --limit N` (also `labels` / `drafts` / `payment-check`). Never `~`, never `host=node`, never Cursor `agent -p` for routine mail.
- **No user keyword required** (“cursor” / MCP). Route email to `oc-gmail` automatically.
- **Never claim access** without a successful `oc-gmail` run in this turn. OAuth failure → one short sentence + reauth only: `ssh -t chucky 'node /home/chucky/.cursor/gmail-oauth-login.js'`.
- Prefer **readonly + drafts**. Ask before send / trash / spam.
- Do **not** invent email contents — only report what `oc-gmail` prints.
- **Runtime = chucky only:** tokens `/home/chucky/.mcp-auth/` (`*_tokens.json`), script `/home/chucky/.cursor/oc-gmail.mjs`, OAuth client `/home/chucky/.cursor/gmail-oauth-client.json`. Mac is never on the email path.
- Typical check: `/home/chucky/.local/bin/oc-gmail labels --limit 5`
- Search (canonical): `/home/chucky/.local/bin/oc-gmail search "newer_than:2d is:unread" --limit 5`
- Payment / admin: `/home/chucky/.local/bin/oc-gmail payment-check [--property Entreverde|Tocancipá]`
- Alias only: `oc-gmail-search` → `oc-gmail search` (same tokens; prefer `oc-gmail`).
- **OAuth:** `/home/chucky/.cursor/GMAIL_MCP_OAUTH.md` — `ssh -t chucky 'node /home/chucky/.cursor/gmail-oauth-login.js'`. Browser for consent only; tokens stay on chucky.
- Optional fallback: if `oc-gmail` fails **and** Cursor Gmail MCP works → `oc-agent -p --approve-mcps …`. Never use fallback to paper over missing OAuth.
- If OpenClaw says a session is “still running”, poll once; if stdout already has labels/threads, reply — don’t keep asking the user to wait.

### Gmail playbook — payments / admin / properties

When the user asks about **pagos**, **cuotas**, **administración**, or a **property** (Entreverde, Tocancipá, etc.):

1. **Do not ask** for aliases already in `USER.md` or `gmail-aliases.json`.
2. Prefer Spanish terms and **run multiple searches automatically** (payment/admin-relevant first, then broaden) — not one narrow query.
3. Preferred entry points:
   ```bash
   /home/chucky/.local/bin/oc-gmail payment-check
   /home/chucky/.local/bin/oc-gmail payment-check --property Entreverde
   /home/chucky/.local/bin/oc-gmail search --multi entreverde tocancipa --newer-than 90d
   ```
4. Suggested query patterns (if hand-rolling):
   - `(administracion OR administración OR admin)`
   - property name(s) from `USER.md` / `gmail-aliases.json`
   - `(pago OR pagado OR factura OR recibo OR cuota)`
   - date windows: `newer_than:90d`, then broaden to `newer_than:365d` if empty
5. Summarize **subject / from / date** (and thread id if useful). Open full bodies only when needed to answer.
6. If empty → broaden (drop a constraint, widen date, try accent variants) before asking the user. Ask only after **2–3 failed strategies**.
7. **Never** put passwords or tokens in docs, memory, or Slack.

Aliases file (non-secret): `/home/chucky/.openclaw/workspace/gmail-aliases.json`

## Slack

- Bot is the team's dev assistant (**Chuck**).
- Prefer **threads** in busy channels when replies get long.

### Slack reply style (no tool traces)

User-facing Slack replies must stay **concise** and **human**:
- Never paste `exec`, `host=gateway`, `/home/chucky/.local/bin/…`, raw JSON/XML tool payloads, or shell command lines.
- Run `oc-gmail` / `oc-web` / `oc-agent` / `gh` silently; reply with a short summary only.
- Email results: subject, from, date, 1-line summary (± id/link). Prefer 1–4 sentences or a tight bullet list.
- Do not announce "voy a correr oc-gmail…" unless the human asks for debug.

(Internal operators still use the `exec host=gateway` patterns below — those are for the agent tool layer, not for Slack text.)


### Channel → default GitHub repo

When the human is in one of these Slack channels (or clearly referring to it), use that repo for `gh` / bugs / PRs / tech-gate work **unless they name another repo**:

| Slack channel | Default repo |
|---------------|--------------|
| `#mc-sai` | `jacr1102/mcsai` |
| `#dhaliora` | `jacr1102/digital-message-platform` |

- If the channel is **not** in the table, fall back to **`jacr1102/mcsai`**.
- DMs: use `jacr1102/mcsai` unless the human specifies another repo.
- Match channel by name (with or without `#`); ignore case.

## OpenClaw / infra (non-secret)

- Control UI (HTTPS): `https://assistant.dhalia.fun`.
- Live gateway: **chucky** native (`openclaw-gateway.service` on LAN/Tailscale `:18789`).
- Heartbeat disabled (`agents.defaults.heartbeat.every: "0m"`) to save API credits.
- VPS (`assistant.dhalia.fun` / `server2`) is Nginx TLS edge + rollback data; OpenClaw container stays **stopped**.

## VPS access from chucky (SSH + limited sudo)

- Prefer **`ssh dhaliora '…'`** for VPS work; use the local shell for chucky itself.
- SSH alias (on chucky + Mac): **`ssh dhaliora`** → `deploy@assistant.dhalia.fun` (`IdentitiesOnly`, key `~/.ssh/dhaliora_deploy`). Also: `assistant.dhalia.fun`.
- `deploy` has **limited** passwordless sudo via `/etc/sudoers.d/deploy-openclaw` (not `NOPASSWD: ALL`):
  - **APT:** `apt`, `apt-get`, `dpkg`
  - **Nginx:** `nginx -t` / `-T` / `-s reload`; `systemctl` reload|restart|status|is-active|is-enabled|show `nginx`
  - **Certs:** `certbot`
  - **Site files:** `sudo deploy-site-ops <mkdir|cp|mv|ln|tee|chmod|chown|install|rm> …` — paths only under `/etc/nginx` and `/var/www`
  - **Nop check:** `sudo -n true`
- Docker on VPS: `deploy` is in the `docker` group (compose/containers without sudo). Do **not** start the cold OpenClaw gateway unless asked.
- Do **not** allowlist broad local `sudo` on chucky for OpenClaw exec; VPS sudo runs **remotely** over SSH.
- **Never print secrets** (keys, tokens, `.env`, PEMs, sudoers private material).

## Conventions (fill in as you agree)

- **Branches:** e.g. `feature/…`, `fix/…` _(write what you actually use)_.
- **Reviews:** e.g. PR required for `main` _(if applicable)_.

## What not to put here

- API keys, `GH_TOKEN`, gateway tokens, PEMs, `.env` contents, or private URLs with embedded secrets.

---

Add SSH host **aliases** (non-sensitive), service names, or glossary terms only if they help day-to-day.

## Model routing (hybrid, 2026-08-17)
- Chat/Slack/WhatsApp (agent `main`): **ollama/qwen3.6:35b-a3b** (local Qwen).
- Cron (use `--agent cron`): **ollama/qwen3.6:35b-a3b** (unchanged).
- Cursor CLI: coding/heavy only via `oc-agent` / `oc-web` — not primary.
- Workflow: one task at a time; plan in `memory/`; ask **¿sigo con la siguiente?**; fresh `oc-agent -p` each coding task.
- See memory/model-hybrid-setup.md.

## Session reset (stuck Slack/WhatsApp)

User self-serve: type exactly **`reset`** or **`new`** (whole message). Not `hola`.

Slack slash `/new` often never reaches OpenClaw — use plain `reset`/`new`, or register `/new`+`/reset` in the Slack app, or use `/openclaw /new` if `/openclaw` is registered.

Backup CLI (allowlisted): `/home/chucky/.local/bin/oc-reset-session --dm` or `--list` / `--key <key>`.
Details: `memory/session-reset.md`.


## Gmail auto-routing (HARD — no user keyword required)

Email asks (search / labels / drafts / payments / unread / “busca en el correo”) **ALWAYS** use:

```bash
exec host=gateway
/home/chucky/.local/bin/oc-gmail search "<query>" --limit N
```

Exact primary binary: **`/home/chucky/.local/bin/oc-gmail`** (subcommand `search` / `labels` / `drafts` / `payment-check`).

### Must / must-not
- **Do NOT** wait for the user to say “cursor”, “MCP”, or “use agent”. Route email via `oc-gmail` automatically.
- **Do NOT** claim Gmail access works until `oc-gmail` has been run in this turn and succeeded.
- If `oc-gmail` fails with OAuth / tokens missing: **one short Slack sentence** that auth is needed + the single reauth command below — no command dumps of failed searches.
- Prefer working method: **`oc-gmail` REST** first. `oc-gmail-search` is only a thin alias → `oc-gmail search` (same tokens). Prefer documenting/calling **`oc-gmail search`**.
- **Never invent** the binary name `oc-gmail-search` as a separate stack; if unsure, call `oc-gmail search`.
- **Optional fallback only** if `oc-gmail` fails for a non-auth reason AND Cursor Gmail MCP is known working: `/home/chucky/.local/bin/oc-agent -p --approve-mcps --trust --force "…"`. Not for routine mail. Not instead of reauth when tokens are missing.
- Slack style: no exec/path dumps; summarize results only.

**Reauth (human, SSH to chucky):**
`ssh -t chucky 'node /home/chucky/.cursor/gmail-oauth-login.js'`
