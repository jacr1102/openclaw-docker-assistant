# GitHub desde el agente (sin `gh` en Docker)

La imagen publicada en GHCR es **solo OpenClaw upstream** (sin GitHub CLI dentro del contenedor).

Para **`gh`** (issues, API, repos), usa **GitHub CLI en un nodo** — por ejemplo el **Mac mini** con `gh auth login`, exec approvals en `~/.openclaw/exec-approvals.json`, y el nodo conectado al gateway. Ver [Exec approvals](https://docs.openclaw.ai/tools/exec-approvals) y la plantilla `scripts/exec-approvals.node.example.json` en este repo.

Si en el servidor tenías **`GH_TOKEN`** solo para `gh` en Docker, puedes quitarlo de **`.env.prod`** y del entorno del compose.

---

## Referencias

- [Slack + Docker en este repo](./SLACK.md)
- [Deploy general](./README.md)
