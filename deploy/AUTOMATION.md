# Gmail, hooks y GitHub (imagen extendida)

CI publica dos etiquetas en GHCR: **`openclaw-base:latest`** (solo upstream OpenClaw) y **`openclaw:latest`** (base + `gog` + `gh`). El despliegue usa **`openclaw:latest`**.

La imagen **`openclaw:latest`** **incluye**:

- **`gog`** — CLI [gogcli](https://gogcli.sh/) para Gmail (watch, Pub/Sub, etc.), alineado con [Gmail Pub/Sub | OpenClaw Docs](https://docs.openclaw.ai/automation/gmail-pubsub).
- **`gh`** — [GitHub CLI](https://cli.github.com/) para crear issues (`gh issue create`, etc.) desde scripts o skills.

El gateway sigue siendo OpenClaw upstream; solo se añaden binarios en `/usr/local/bin` (usuario runtime: `node`).

---

## Variables de entorno (`.env.prod` → fusionar en `.env`)

| Variable | Uso |
|----------|-----|
| **`GH_TOKEN`** | PAT de GitHub con permiso para **crear issues** en el repositorio objetivo (`repo` o `issues: write`). `gh` la usa automáticamente. No la commitees. |
| **`OPENCLAW_HOOK_TOKEN`** | Token compartido para autenticar **webhooks** hacia el gateway (debe coincidir con `hooks.token` en `openclaw.json` si lo configuras así). |
| **`OPENCLAW_SKIP_GMAIL_WATCHER`** | Si el gateway intenta levantar el watcher de Gmail y tú ejecutas `gog` **fuera** del contenedor, puedes poner `1` para evitar duplicados (ver doc OpenClaw). |

Slack y OpenAI siguen como en [`env.prod.example`](./env.prod.example).

---

## Configuración en `openclaw.json` (resumen)

No se versiona en este repo; vive en `OPENCLAW_CONFIG_DIR` en el servidor.

1. **Hooks Gmail** — `hooks.enabled`, `hooks.token`, `hooks.presets: ["gmail"]`, y opcionalmente `hooks.mappings` para enrutar a un agente, modelo y entrega a Slack. Ver [Gmail Pub/Sub](https://docs.openclaw.ai/automation/gmail-pubsub) y [Webhooks](https://docs.openclaw.ai/automation/webhook).

2. **OAuth Google** — El JSON de cliente **Desktop** lo registra `gog` en el volumen bajo el usuario `node` (p. ej. `gog auth credentials …`, `gog auth add …` ejecutados **dentro** del contenedor `openclaw-cli` o gateway si montas los mismos volúmenes).

3. **Filtrado por dominio (p. ej. `mc-sai.com`)** — Suele hacerse en el **mapping** / plantilla del hook o en la lógica del agente que procesa el cuerpo del correo (no en la imagen Docker).

4. **Issues en GitHub** — Define un **repositorio** destino; el **Project** de GitHub organiza issues ya creados (automatización del proyecto o API). Desde el agente/skill: `gh issue create --repo owner/repo --label bug --title "..." --body "..."` con `GH_TOKEN` en el entorno.

5. **`groupPolicy` / Slack** — Si usas allowlist vacía, el bot no atiende canales; ver [`SLACK.md`](./SLACK.md).

---

## Comprobar binarios en el contenedor

```bash
docker compose -f docker-compose.prod.yml exec openclaw-gateway sh -c 'command -v gog && command -v gh && gog version 2>/dev/null; gh --version'
```

---

## Build local de la imagen extendida (opcional)

Tras construir upstream como `openclaw-upstream:local` (mismo daemon Docker que ejecuta el `build` siguiente):

```bash
docker build -f docker/Dockerfile.openclaw-tools \
  --build-arg BASE_IMAGE=openclaw-upstream:local \
  -t openclaw:local-tools .
```

O usando la base ya subida a GHCR:

```bash
docker build -f docker/Dockerfile.openclaw-tools \
  --build-arg BASE_IMAGE=ghcr.io/TU_ORG/TU_REPO/openclaw-base:latest \
  -t openclaw:local-tools .
```

---

## Referencias

- [Gmail Pub/Sub — OpenClaw](https://docs.openclaw.ai/automation/gmail-pubsub)
- [Slack + Docker en este repo](./SLACK.md)
- [Deploy general](./README.md)
