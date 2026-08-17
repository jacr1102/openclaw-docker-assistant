# Model routing

**ES:** Modelos por agente.  
**EN:** Which model each agent uses.

Detail: [`agents/chuck/memory/cursor-primary-setup.md`](../../agents/chuck/memory/cursor-primary-setup.md).  
Agents block in inventory: [`docs/inventory/cron.md`](../inventory/cron.md).

## Summary

| Agent id | Name | Primary model | When |
|----------|------|---------------|------|
| `main` | (default chat) | **`cursor-cli/auto`** | Slack / Control UI / interactive |
| `cron` | `cron-qwen` | **`ollama/qwen3.6:35b-a3b`** | OpenClaw cron / `--agent cron` only |

- Chat must **not** fall back to cloud OpenAI for routine work; Cursor subscription drives `cursor-cli/*`.
- Qwen/Ollama is reserved for the **cron** agent (local MoE), not for day-to-day Slack coding.
- Heartbeat: disabled (`every: "0m"`) to save credits.
- `cliBackends.cursor-cli.command`: `/home/chucky/.local/bin/cursor-agent`

## Related aliases (available, not primary chat)

- `ollama/qwen3.6:27b` → `qwen27`
- `ollama/gpt-oss:20b` → `local-orchestrator`
- Many `cursor-cli/*` model ids for explicit overrides

## Ops tips

- Long Cursor CLI turns can stall a session → see [SESSION-RESET.md](./SESSION-RESET.md).
- Avoid many parallel long `oc-agent` / `cursor-agent` jobs against the same workspace.
