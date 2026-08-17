# GitHub desde el agente (sin `gh` en Docker)

La imagen publicada en GHCR es **solo OpenClaw upstream** (sin GitHub CLI dentro del contenedor).

Para **`gh`** (issues, API, repos), usa **GitHub CLI en un nodo** — por ejemplo el **Mac mini** con `gh auth login`, exec approvals en `~/.openclaw/exec-approvals.json`, y el nodo conectado al gateway. Ver [Exec approvals](https://docs.openclaw.ai/tools/exec-approvals) y la plantilla `scripts/exec-approvals.node.example.json` en este repo.

Si en el servidor tenías **`GH_TOKEN`** solo para `gh` en Docker, puedes quitarlo de **`.env.prod`** y del entorno del compose.

Si **`exec`** dice que no existe **`/opt/homebrew/bin/gh`** pero en el Mac **`command -v gh`** sí funciona, casi seguro el comando se ejecutó en **`host=sandbox`** (por defecto), no en el nodo. En Control UI: **`/exec host=node`** (y **`node=…`** si hay varios) o configura **`tools.exec.host=node`** para el agente. Luego vuelve a probar.

Si el fallo persiste **con `host=node`**, en el Mac comprueba la ruta real: **`command -v gh`**. Apple Silicon suele usar **`/opt/homebrew`**; Intel a veces **`/usr/local/bin/gh`**. Sin binario: **`brew install gh`** y **`gh auth login`** en esa máquina.

### `SYSTEM_RUN_DENIED: approval requires an existing canonical cwd`

La aprobación de **`exec` resuelve el `workdir` en el filesystem del gateway** (el contenedor Linux), no en el Mac. Si pones **`/Users/...`**, dentro del contenedor **no existe** → sigue fallando el “canonical cwd”.

**Workspace ya configurado en el deploy:** en `docker-compose.prod.yml` el volumen **`OPENCLAW_WORKSPACE_DIR`** se monta como **`/home/node/.openclaw/workspace`** dentro del gateway. Esa es la ruta “oficial” del workspace **vista por el proceso del gateway**.

1. En el **VPS**, comprueba que el directorio existe **dentro del contenedor**:
   ```bash
   docker compose -f docker-compose.prod.yml exec openclaw-gateway sh -c 'test -d /home/node/.openclaw/workspace && echo OK'
   ```
2. En Control UI, con **`/exec host=node`** (y **`security`/`ask`** como ya uses), pide un **`exec`** con:
   - **`workdir`:** **`/home/node/.openclaw/workspace`** (ruta **dentro del contenedor**, no `/Users/...`)
   - **`command`:** p. ej. `/opt/homebrew/bin/gh issue list --repo jacr1102/mcsai --limit 5`

Texto listo para pegar:

```text
Ejecuta con exec: host=node, workdir=/home/node/.openclaw/workspace, command: /opt/homebrew/bin/gh issue list --repo jacr1102/mcsai --limit 5
```

OpenClaw debería enlazar ese plan con el workspace del agente y reenviarlo al nodo; el nodo ejecuta en **su** sistema con la lógica interna del producto (si el binario sigue en el Mac, no hace falta que exista `/home/node/...` en macOS).

**¿Config fija “por defecto”?** En la doc pública de `exec` no hay un `tools.exec.workdir` global permanente; el workspace del agente viene de **`OPENCLAW_WORKSPACE_DIR`** + config de agentes. Para defaults de sesión sigue siendo **`/exec`** en el chat o **`tools.exec.host` / `tools.exec.node`** por agente. Si quieres ver qué tiene el gateway:  
`docker compose exec openclaw-gateway openclaw config get` (o revisa `openclaw.json` bajo **`OPENCLAW_CONFIG_DIR`**).

Si **incluso con `workdir=/home/node/.openclaw/workspace`** falla igual, es muy probable el bug upstream **`resolveWorkdir` / nodo remoto**; toca **actualizar OpenClaw** o **GitHub/API en el gateway** mientras tanto.

---

## Nodo Mac: `node.err.log` y WebSocket al gateway

Los logs del nodo en macOS suelen ir a **`~/.openclaw/logs/node.err.log`** (`node.log` puede estar vacío).

Si ves **`SECURITY ERROR: Cannot connect ... over plaintext ws://`**, OpenClaw **bloquea** `ws://` hacia una IP remota (p. ej. Tailscale) salvo que permitas explícitamente el modo “break-glass” en redes privadas de confianza:

- En **`scripts/mac-node.env`** (o `~/.openclaw-node.env`): **`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`**
- Vuelve a instalar el servicio del nodo para que el LaunchAgent herede la variable, p. ej.  
  `OPENCLAW_NODE_FORCE_INSTALL=1 ./scripts/start-openclaw-node-mac.sh`

Alternativas más seguras a largo plazo: **`wss://`** al dominio público del gateway (TLS delante de Nginx), o túnel SSH a `127.0.0.1:18789` como indica el mensaje de error.

Si ves **`ECONNREFUSED`** a `IP:18789`, el gateway en el VPS no acepta conexiones en ese momento (reinicio, firewall, o IP equivocada). Comprueba desde el Mac: `nc -vz IP 18789` y que **`OPENCLAW_GATEWAY_HOST`** sea la IP correcta (Tailscale del servidor).

---

## Referencias

- [Slack + Docker en este repo](./SLACK.md)
- [Deploy general](./README.md)
