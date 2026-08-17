# Model routing

**ES:** Modelos por agente (híbrido).  
**EN:** Hybrid model routing per agent.

Detail: [`agents/chuck/memory/model-hybrid-setup.md`](../../agents/chuck/memory/model-hybrid-setup.md).  
Agents block in inventory: [`docs/inventory/cron.md`](../inventory/cron.md).

## Summary

| Agent id | Name | Primary model | When |
|----------|------|---------------|------|
| `main` | (default chat) | **`ollama/qwen3.6:35b-a3b`** | Slack / WhatsApp / Control UI / interactive |
| `cron` | `cron-qwen` | **`ollama/qwen3.6:35b-a3b`** | OpenClaw cron / `--agent cron` only |

- **Chat primary is local Qwen** (Ollama). Do **not** set `agents.defaults.model.primary` to `cursor-cli/*`.
- **Cursor CLI** stays installed for coding/heavy work via **`oc-agent` / `oc-web`** (`exec host=gateway`). Plugin `cursor-cli` may remain enabled but is unused as chat primary.
- Heartbeat: disabled (`every: "0m"`).
- Optional: `cliBackends.cursor-cli.command` → `/home/chucky/.local/bin/cursor-agent` (for plugin/catalog only when needed).

## Workflow (one task at a time)

1. One task at a time; persist the plan in `memory/*.md`.
2. After each task, ask the user: **¿sigo con la siguiente?**
3. Each coding task = fresh `oc-agent -p` (no resume accumulation).

## Related aliases (available, not required for chat)

- `ollama/qwen3.6:27b` → `qwen27`
- `ollama/gpt-oss:20b` → `local-orchestrator`
- Many `cursor-cli/*` model ids (optional overrides; not default chat)

## Ops tips

- Local Qwen chat: prefer `agents.defaults.thinkingDefault: "off"` (and model `params.thinking: false`) so Ollama sends `think: false`; otherwise thinking-only replies can starve content and time out.

- After switching primary models, send **`reset`** or **`new`** once in Slack so the session picks up Qwen.
- Stuck sessions → [SESSION-RESET.md](./SESSION-RESET.md).
- Avoid many parallel long `oc-agent` / `cursor-agent` jobs against the same workspace.
