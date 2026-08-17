# Hybrid model setup (2026-08-17)

## Routing
- **Chat / Slack / WhatsApp / main agent**: local Qwen via Ollama — primary model `ollama/qwen3.6:35b-a3b`.
- **Cron jobs**: agent `cron` with the same primary `ollama/qwen3.6:35b-a3b` (unchanged role).
- **Cursor CLI**: installed (plugin `cursor-cli` may stay enabled) but **not** `agents.defaults.model.primary`. Use Cursor only through **`oc-agent` / `oc-web`** exec for coding and heavy work (classic AGENTS.md pattern).

## One task at a time (workflow)
1. Work **one task** at a time — do not start the next until the current one is done.
2. Persist the plan in a **memory markdown** file under `memory/` (e.g. `memory/<project>-plan.md`) and update it as you go.
3. After each completed task, ask the user: **¿sigo con la siguiente?**
4. Each coding task = a **fresh** `oc-agent -p …` invocation (no resume / session accumulation across tasks).

## Add cron jobs (Qwen)
```bash
openclaw cron add --agent cron --model ollama/qwen3.6:35b-a3b ...
# or rely on agent default:
openclaw cron add --agent cron ...
```

## Notes
- Plugin `@jeehou/openclaw-cursor-cli` (id `cursor-cli`) may remain installed for catalog / optional overrides; chat must not use `cursor-cli/*` as primary.
- Wrapper `~/.local/bin/oc-agent` pins the same cursor-agent binary as `~/.local/bin/agent`.
- Heartbeat remains `0m` (disabled).
- Session self-serve: type `reset` or `new` — see `memory/session-reset.md`.

## History
- Previously (briefly) chat primary was `cursor-cli/auto`; reverted to hybrid Qwen-primary + Cursor-via-exec.

## Local Qwen performance
- Prefer `agents.defaults.thinkingDefault: "off"` and model `params.thinking`/`think: false` so Ollama gets `think: false`.
- Full OpenClaw bootstrap prompts are ~14k tokens; on CPU expect multi-minute first responses. Session self-serve `reset`/`new` after model switches.
