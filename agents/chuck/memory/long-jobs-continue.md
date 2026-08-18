# Long jobs = multiple short Cursor tasks

- OpenClaw Slack turns are bounded by `agents.defaults.timeoutSeconds` (raised to 1800 on 2026-08-18). That is **not** a license for multi-hour inline work.
- Local primary is Qwen (`ollama/qwen3.6:35b-a3b`). Huge plans inline still fail or invent; heavy coding/research goes through **`oc-agent` / `oc-web`** with their own timeouts (`OC_AGENT_TIMEOUT` default 600; `oc-web` uses 180).
- Pattern: write plan to `memory/*.md` → one short `oc-agent -p` task → summarize → ask user **continue?** → next task. Never one 3-hour Slack turn.
