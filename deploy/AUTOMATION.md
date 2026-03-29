# GitHub desde el agente (sin `gh` en Docker)

La imagen publicada en GHCR es **solo OpenClaw upstream** (sin GitHub CLI dentro del contenedor).

Para **`gh`** (issues, API, repos), usa **GitHub CLI en un nodo** — por ejemplo el **Mac mini** con `gh auth login`, exec approvals en `~/.openclaw/exec-approvals.json`, y el nodo conectado al gateway. Ver [Exec approvals](https://docs.openclaw.ai/tools/exec-approvals) y la plantilla `scripts/exec-approvals.node.example.json` en este repo.

Si en el servidor tenías **`GH_TOKEN`** solo para `gh` en Docker, puedes quitarlo de **`.env.prod`** y del entorno del compose.

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
