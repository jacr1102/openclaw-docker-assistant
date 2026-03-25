# Hooks y GitHub (imagen extendida)

CI publica dos etiquetas en GHCR: **`openclaw-base:latest`** (solo upstream OpenClaw) y **`openclaw:latest`** (base + **`gh`**). El despliegue usa **`openclaw:latest`**.

La imagen **`openclaw:latest`** **incluye**:

- **`gh`** — [GitHub CLI](https://cli.github.com/) para crear issues (`gh issue create`, etc.) desde scripts o skills.

El gateway sigue siendo OpenClaw upstream; solo se añade el binario en `/usr/local/bin` (usuario runtime: `node`).

---

## Variables de entorno (`.env.prod` → fusionar en `.env`)

| Variable | Uso |
|----------|-----|
| **`GH_TOKEN`** | PAT de GitHub con permiso para **crear issues** en el repositorio objetivo (`repo` o `issues: write`). `gh` la usa automáticamente. No la commitees. |
| **`OPENCLAW_HOOK_TOKEN`** | Token compartido para autenticar **webhooks** hacia el gateway (debe coincidir con `hooks.token` en `openclaw.json` si lo configuras así). |

Slack y OpenAI siguen como en [`env.prod.example`](./env.prod.example).

---

## Configuración en `openclaw.json` (resumen)

No se versiona en este repo; vive en `OPENCLAW_CONFIG_DIR` en el servidor.

1. **Webhooks** — Si usas hooks HTTP hacia el gateway, alinea `hooks.token` con `OPENCLAW_HOOK_TOKEN` cuando apliques. Ver [Webhooks | OpenClaw](https://docs.openclaw.ai/automation/webhook).

2. **Issues en GitHub** — Define un **repositorio** destino; el **Project** de GitHub organiza issues ya creados (automatización del proyecto o API). Desde el agente/skill: `gh issue create --repo owner/repo --label bug --title "..." --body "..."` con `GH_TOKEN` en el entorno.

3. **`groupPolicy` / Slack** — Si usas allowlist vacía, el bot no atiende canales; ver [`SLACK.md`](./SLACK.md).

---

## Comprobar `gh` en el contenedor

```bash
docker compose -f docker-compose.prod.yml exec openclaw-gateway sh -c 'command -v gh && gh --version'
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

- [Slack + Docker en este repo](./SLACK.md)
- [Deploy general](./README.md)
