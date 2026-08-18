# Chucky: agent timeouts & long Cursor jobs (2026-08-18)

## Evidence / current settings (native gateway on chucky)

- `agents.defaults.timeoutSeconds`: **1800** (was 600; raised after repeated `LLM request timed out` / `embedded run timeout … timeoutMs=600000`).
- Primary chat model: **`ollama/qwen3.6:35b-a3b`** (not cursor-cli). Cursor coding via **`oc-agent`** / web via **`oc-web`**.
- Ollama provider `timeoutSeconds`: 1800.
- `oc-agent` wrapper default: `OC_AGENT_TIMEOUT` **600**; `oc-web` sets **180**.

## Guidance

Do **not** hold multi-hour Cursor work inside one OpenClaw/Qwen Slack turn. Persist plan in `memory/*.md`, run discrete `oc-agent -p` tasks, ask user to continue between tasks.

See workspace `AGENTS.md` § Long Cursor jobs and `memory/long-jobs-continue.md` on chucky.

## Architecture (orchestrator + worker)

See [`agents/chuck/memory/agents-and-long-jobs.md`](../agents/chuck/memory/agents-and-long-jobs.md):

- **Chucky (OpenClaw/Qwen)** = orchestrator on Slack (short turns, checklist, ¿sigo?)
- **Cursor (`oc-agent` / `oc-web`)** = worker (your Cursor subscription)
- Multi-hour: continue-loop, `openclaw cron --agent cron`, or **`oc-long-job`** background wrapper

## Web search iron rule

`oc-web` is a **binary** via OpenClaw tool **`exec`**, not tool id `oc-web`. Native `web_search` / `web_fetch` / `browser` are disabled+denied on the gateway. Live docs: `agents/chuck/AGENTS.md` + `TOOLS.md`.
