---
name: delivery-loop
description: >-
  Orchestrate multi-step work: ask Cursor for a plan, save checklist, implement
  one checkbox at a time via oc-agent, report progress on Slack, ask continue or
  use cron. Use when user says "empieza proyecto", "delivery loop", "plan e
  implementa punto por punto", "trabaja por horas", long coding jobs.
---

# Delivery loop — plan → one checkbox at a time → Slack

**Orchestration:** OpenClaw / Qwen (Chuck) drives the loop and Slack updates.  
**Implementation:** Cursor **only** via `/home/chucky/.local/bin/oc-agent` on **chucky** (`exec host=gateway`).  
**Web research:** `/home/chucky/.local/bin/oc-web` only (never invent live facts).

This is the **default** skill for multi-step Cursor coding that is **not** a full tech-gate (GitHub Project + issues). For tech gates, use `skills/tech-gate-delivery` instead.

---

## Trigger phrases (examples)

Spanish (preferred):

- “Empieza proyecto …”
- “Delivery loop”
- “Plan e implementa punto por punto”
- “Trabaja por horas”
- “Arma el plan y ve implementando uno a uno”
- “Sigue con el delivery” / “Sigue” / “Continúa”
- “Activa auto_continue en el delivery”

English:

- “Start a delivery loop”
- “Plan then implement checkbox by checkbox”

---

## Iron rules

1. **Qwen NEVER implements code itself.** All coding/plans/file edits go through a **fresh**:
   ```text
   /home/chucky/.local/bin/oc-agent -p --approve-mcps --trust --force [--workspace <path>] "…"
   ```
   Add `--workspace` when the repo path is known (clone under `/home/chucky/.openclaw/workspace/repos/<repo>` if needed). Never `sudo`, never `~`, never `host=node`.

2. **Phase PLAN:** one `oc-agent` call to produce a markdown plan with `- [ ]` checklist items. Save it as `memory/delivery-<slug>.md` using `skills/delivery-loop/TEMPLATE.md`.

3. **Write/update** `memory/delivery-active.md` pointing at that file + Slack target hint + status `running|paused|done` (or `none` when idle).

4. **Phase DO:** each Slack turn (or cron tick) does **exactly ONE** unchecked item via a **fresh** `oc-agent`; mark it `[x]`; post a **short** Slack summary (no exec dumps / no command lines); then ask **¿Sigo con el siguiente?** **unless** `auto_continue: true` in the delivery file header.

5. If the user says keep going / auto: continue the next item in the **same** turn **only** if the previous `oc-agent` finished quickly; otherwise prefer **cron** (`delivery-loop-tick`) or `/home/chucky/.local/bin/oc-long-job` for heavy items.

6. **Web research:** `oc-web` only (via `exec`).

7. **On stuck:** tell the user to send **`reset`** (plain text).

8. Keep Slack under ~8 lines. Never paste allowlists, tokens, raw tool XML, or absolute exec recipes into user-facing replies.

---

## Phase PLAN

1. Confirm repo / workspace (channel map still applies: `#dhaliora` → digital-message-platform, `#mc-sai` → mcsai, unless user names another).
2. Run **one** `oc-agent` prompt that returns a checklist plan (`- [ ] 1. …`).
3. Write `memory/delivery-<slug>.md` from the template (status `running`, `auto_continue: false` by default).
4. Write `memory/delivery-active.md`:
   - **File:** `memory/delivery-<slug>.md`
   - **Status:** `running`
   - **Updated:** ISO date
5. Slack kickoff: title, item count, repo, that you will do **one item per turn** (or cron if `auto_continue`).

---

## Phase DO (one item)

1. Read `memory/delivery-active.md` → open the delivery file.
2. Find the first `- [ ]` item.
3. Run **one** fresh `oc-agent` for that item only (raise `OC_AGENT_TIMEOUT` only for that invocation if needed; for multi-hour work use `oc-long-job` and record **Active job**).
4. On success: mark `- [x]`, append a one-line Log entry, bump **Updated**.
5. Slack: what was done + how many `[ ]` remain.
6. If `auto_continue: false` → ask **¿Sigo con el siguiente?**
7. If `auto_continue: true` → may start the next item in-turn only if the last `oc-agent` was quick; else stop and let cron/`oc-long-job` continue.

When no `[ ]` remain: set status `done`, set `delivery-active` status to `none`, Slack “Delivery complete”.

---

## Auto continue

- Default: `auto_continue: false` (ask after each item).
- Enable: user says **“activa auto_continue en el delivery”** (or edits the file header to `auto_continue: true`).
- Disable: **“pausa el delivery”** / set `auto_continue: false` or status `paused`.
- Cron job **`delivery-loop-tick`** (every 30m → Jonathan DM): runs one item **only** when status is `running` **and** `auto_continue: true`. Otherwise status-only or `NO_REPLY`.

---

## Stuck / resume

- Stuck session → user sends **`reset`**.
- Resume: “sigue con el delivery” / “continúa el delivery \<slug\>” → read active file and do the next `[ ]`.

---

## Anti-patterns

- Qwen writing/editing repo code directly
- Multiple unchecked items in one `oc-agent` call
- Dumping exec output or shell recipes into Slack
- Running `oc-agent` from cron when `auto_continue` is false
- Inventing web facts without `oc-web`
