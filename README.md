# openclaw-docker-assistant

**ES:** Kit de despliegue y runbook para **Chuck / OpenClaw**: gateway nativo en el host **chucky**, borde TLS en el VPS (`assistant.dhalia.fun`), más el wrapper Docker histórico del repo.  
**EN:** Deployment kit and reinstall runbook for **Chuck / OpenClaw**: native gateway on **chucky**, VPS TLS edge (`assistant.dhalia.fun`), plus the historical Docker wrapper in this repo.

Remote: [github.com/jacr1102/openclaw-docker-assistant](https://github.com/jacr1102/openclaw-docker-assistant)

---

## Qué es este repo / What this repo is

| Contenido / Content | Ubicación |
|---------------------|-----------|
| Runbook de reinstalación + arquitectura | Este `README.md` |
| Agent Chuck (AGENTS, TOOLS, skills, wrappers) | [`agents/chuck/`](./agents/chuck/) |
| Guías operativas chucky | [`docs/chuck/`](./docs/chuck/) |
| Inventario exportado (redactado) | [`docs/inventory/`](./docs/inventory/) |
| Notas de cutover VPS → chucky | [`docs/migration-chucky-notes.md`](./docs/migration-chucky-notes.md) |
| Scripts (backup, bootstrap, reset) | [`scripts/`](./scripts/) |
| Compose / GHCR / nginx examples (legado Docker) | `docker-compose*.yml`, [`deploy/`](./deploy/) |

Upstream OpenClaw se clona en `./upstream/` (gitignored) solo si usas el path Docker local.

---

## Arquitectura / Architecture

```
Usuarios (Slack, browser Control UI)
              │
              ▼
   https://assistant.dhalia.fun
   VPS (dhaliora / server2) — Nginx + TLS
              │  proxy_pass → Tailscale
              ▼
   http://100.88.86.99:18789
   chucky — OpenClaw nativo (systemd --user)
              │
              ├── Slack Socket Mode (canal principal)
              ├── WhatsApp plugin (instalado; falta vincular QR)
              ├── ollama/qwen3.6:35b-a3b  ← chat primary (main + cron)
              ├── Cursor CLI vía oc-agent/oc-web (no primary)
              └── oc-agent, oc-web, oc-gmail*, gh, MCPs
```

| Pieza | Detalle |
|-------|---------|
| **chucky** | Ubuntu local; OpenClaw **sin Docker** en el gateway; estado en `~/.openclaw` |
| **VPS** | Termina TLS y hace proxy a chucky por Tailscale; contenedor OpenClaw antiguo **detenido** (rollback) |
| **Control UI** | `https://assistant.dhalia.fun` |
| **Health** | `https://assistant.dhalia.fun/healthz` → 200 |

Más detalle: [docs/chuck/SERVER-SETUP.md](./docs/chuck/SERVER-SETUP.md) · cutover: [docs/migration-chucky-notes.md](./docs/migration-chucky-notes.md)

---

## Modelos / Models

| Agente | Modelo | Uso |
|--------|--------|-----|
| `main` (chat / Slack / WhatsApp) | **`ollama/qwen3.6:35b-a3b`** | Primario — Qwen local (Ollama) |
| `cron` (`cron-qwen`) | **`ollama/qwen3.6:35b-a3b`** | Trabajos cron OpenClaw (`--agent cron`) |

Cursor CLI **no** es el chat primario; coding/heavy vía `oc-agent` / `oc-web`. Guía: [docs/chuck/MODELS.md](./docs/chuck/MODELS.md)

---

## Herramientas conectadas / Connected tools

| Tool | Rol |
|------|-----|
| `oc-agent` | Coding + MCP vía Cursor agent |
| `oc-web` | Investigación web (WebSearch/WebFetch) |
| `oc-gmail` / `oc-gmail-search` | Gmail rápido (REST); preferido en Slack |
| `oc-gmail-agent` | Fallback Gmail MCP (lento) |
| `oc-reset-session` | Reset de sesión vía gateway RPC |
| `gh` | GitHub CLI en chucky |
| **mcsai-observability** MCP | Admin live MCSAI (vía `oc-agent --approve-mcps`) |
| Gmail MCP | `~/.cursor` / `mcp-remote` path (OAuth local) |

Inventario: [docs/chuck/TOOLS-AND-MCPS.md](./docs/chuck/TOOLS-AND-MCPS.md) · [docs/inventory/](./docs/inventory/)

### Canales

- **Slack** — superficie principal (DM + canales). Tokens en env de systemd (no en git).
- **WhatsApp** — plugin instalado; hace falta **vincular con QR** / login antes de usarlo en producción.

---

## Recuperación de sesión / Session recovery

En Slack (o WhatsApp vinculado), escribe exactamente:

- `reset` **o** `new`

como mensaje completo. **No uses `/new` en Slack** (Slack suele interceptar slash commands no registrados).

Detalles: [docs/chuck/SESSION-RESET.md](./docs/chuck/SESSION-RESET.md)

---

## Backup MCSAI (cron en chucky)

- Script: [`scripts/mcsai-backup-remote.sh`](./scripts/mcsai-backup-remote.sh)
- Secrets: `~/.config/mcsai-backup/backup.conf` (modo `600`, **nunca en git**)
- Crontab chucky: `5 8,17 * * *` → `~/logs/mcsai-cron.log`
- Destino: `~/Backups/mcsai-remote/*.sql.gz`

---

## Checklist de reinstalación / Reinstall checklist

Orden sugerido en un Ubuntu nuevo (usuario `chucky`):

1. **Usuario Ubuntu** `chucky` + SSH por clave (`scripts/bootstrap-chucky.sh` desde el Mac).
2. **Tailscale** instalado y `sudo tailscale up` (anotar IP; hoy `100.88.86.99`).
3. **Base packages** — `scripts/setup-chucky-base.sh` (git, jq, Docker opcional, `gh`, etc.).
4. **Node (nvm) + OpenClaw** — Node **v24.x**; `npm i -g openclaw` (o versión pinneada del inventario).
5. **Cursor CLI** — install + `agent login` (suscripción Cursor).
6. **Copiar wrappers** desde este repo: `agents/chuck/bin/oc-*` → `~/.local/bin/`; `oc-gmail.mjs` y skills/agent docs a `~/.openclaw/workspace`.
7. **Restaurar config redactada** — partir de [`docs/inventory/openclaw.config.redacted.*`](./docs/inventory/) / backup offline; **rellenar secrets** en `~/.openclaw/openclaw.json` y `~/.openclaw/gateway.systemd.env` (nunca commitear).
8. **systemd user + linger** — unit `openclaw-gateway.service`; `loginctl enable-linger chucky`; `systemctl --user enable --now openclaw-gateway.service`.
9. **Slack** — `SLACK_APP_TOKEN` / `SLACK_BOT_TOKEN` en el EnvironmentFile; Socket Mode; emparejar dispositivo si aplica ([`deploy/SLACK.md`](./deploy/SLACK.md)).
10. **Gmail OAuth** — client secret local + login (`agents/chuck/GMAIL_MCP_OAUTH.md`); aliases desde `gmail-aliases.json.example`.
11. **MCP env** — `~/.cursor/mcp.json`, script `mcsai-observability`, vars de API; sin commitear tokens.
12. **Clonar repos** bajo `~/.openclaw/workspace/repos/` (p.ej. `mcsai`, `digital-message-platform`, este repo).
13. **VPS Nginx** — `proxy_pass` a `http://<chucky-tailscale>:18789`; `allowedOrigins` incluye `https://assistant.dhalia.fun`.
14. **Verificar** — `curl -sS https://assistant.dhalia.fun/healthz`; `systemctl --user status openclaw-gateway`; mensaje de prueba en Slack; opcional `oc-reset-session --list`.
15. **Extras** — cron MCSAI backup; WhatsApp QR si se necesita; `gh auth login`.

Guías: [SERVER-SETUP](./docs/chuck/SERVER-SETUP.md) · [TOOLS-AND-MCPS](./docs/chuck/TOOLS-AND-MCPS.md) · [MODELS](./docs/chuck/MODELS.md)

---

## Qué NO commitear / What NOT to commit

| Nunca en git | Ejemplo |
|--------------|---------|
| Env con secretos | `.env`, `gateway.systemd.env`, `*.env` (salvo `*.example`) |
| Config OpenClaw live | `openclaw.json`, `**/openclaw.json` |
| MCP live | `mcp.json` (salvo examples) |
| OAuth / tokens | `gmail-oauth-client.json`, `*token*`, `.mcp-auth/` |
| Backup DB secrets | `backup.conf`, `**/mcsai-backup/**` |
| Aliases Gmail live | `gmail-aliases.json` |
| Backups con secretos | `*.bak` que copien configs reales |
| Datos locales | `data/`, `upstream/`, `.local-openclaw/` |

Usa plantillas: `.env.example`, `deploy/*.example`, `gmail-aliases.json.example`, inventario **redacted**.

---

## Documentación / Docs index

| Doc | Tema |
|-----|------|
| [docs/chuck/SERVER-SETUP.md](./docs/chuck/SERVER-SETUP.md) | Topología, Tailscale, VPS, systemd, backup |
| [docs/chuck/TOOLS-AND-MCPS.md](./docs/chuck/TOOLS-AND-MCPS.md) | oc-*, Cursor, Gmail, MCPs |
| [docs/chuck/SESSION-RESET.md](./docs/chuck/SESSION-RESET.md) | `reset` / `new` |
| [docs/chuck/MODELS.md](./docs/chuck/MODELS.md) | Hybrid Qwen chat + Cursor via exec |
| [docs/inventory/](./docs/inventory/) | Snapshot bins, mcps, plugins, cron, systemd, config redacted |
| [docs/migration-chucky-notes.md](./docs/migration-chucky-notes.md) | Cutover VPS → chucky + rollback |
| [agents/chuck/](./agents/chuck/) | Personalidad, tools, skills, wrappers |
| [deploy/README.md](./deploy/README.md) | Deploy Docker/GHCR (legado / rollback) |
| [deploy/SLACK.md](./deploy/SLACK.md) | App Slack |
| [deploy/AUTOMATION.md](./deploy/AUTOMATION.md) | Automatización / nodos |

---

## Docker kit (histórico / local smoke)

Este repo también envuelve el OpenClaw oficial para correr el **gateway en contenedor** con datos junto al repo (útil en lab o rollback VPS).

### Prerequisites

- Docker + Compose v2, `git`, `openssl` (o `python3`)

### Quick start (local Docker)

```bash
chmod +x scripts/*.sh
./scripts/docker-setup.sh
```

Control UI: [http://127.0.0.1:18789/](http://127.0.0.1:18789/). Variables: [`.env.example`](./.env.example).

### Production compose / GHCR

- `docker-compose.prod.yml` — imagen GHCR
- `.github/workflows/deploy.yml` — build + push + deploy
- Plantillas: [`deploy/env.prod.example`](./deploy/env.prod.example), [`deploy/vps.env.example`](./deploy/vps.env.example)

**Nota:** El gateway **en producción actual** es nativo en chucky; el path Docker en VPS queda como borde Nginx + datos fríos. Ver migration notes.

### Day-to-day (Docker path)

```bash
docker compose logs -f openclaw-gateway
docker compose run --rm openclaw-cli channels login
```

---

## License

This wrapper repository is MIT licensed. OpenClaw itself is licensed under its upstream repository.
