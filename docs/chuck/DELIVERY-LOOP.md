# Delivery loop (Chuck / chucky)

Multi-step Cursor work orchestrated by OpenClaw (Qwen) with **one checkbox per turn**.

## Skill

Live path on chucky: `~/.openclaw/workspace/skills/delivery-loop/`  
Repo mirror: [`agents/chuck/skills/delivery-loop/`](../../agents/chuck/skills/delivery-loop/)

- `SKILL.md` — iron rules + PLAN/DO phases  
- `TEMPLATE.md` — `memory/delivery-<slug>.md` shape  
- `examples.md` — Spanish/English triggers  

## Start from Slack (exact phrases)

- `Empieza proyecto: <goal>`
- `Delivery loop: <goal>`
- `Plan e implementa punto por punto <goal>`
- `Trabaja por horas en <goal>`

Chuck plans via `oc-agent`, writes `memory/delivery-<slug>.md` + `memory/delivery-active.md`, implements **one** `- [ ]`, then asks **¿Sigo con el siguiente?**

Continue: `Sigue` / `Sigue con el siguiente` / `Continúa el delivery`

## auto_continue

Default: `false` (manual ¿Sigo?).

Enable:

- Tell Chuck: **`activa auto_continue en el delivery`**
- Or edit `memory/delivery-<slug>.md` → `auto_continue: true` (keep **Status:** `running`)

Disable / pause: `Pausa el delivery` / `Desactiva auto_continue`

## Progress cron (no Slack spam when idle)

**Idle must produce zero Slack messages and zero exec-approval prompts.**

OpenClaw job `delivery-loop-tick` is **disabled by default** (it woke the LLM every 30m; with the old `tools.exec.mode=ask` + Slack `execApprovals`, even a `cat` of `delivery-active.md` spammed DMs). As of 2026-08-19, chucky uses `mode=allowlist` + host `ask=off` so allowlisted `oc-delivery-*` auto-run without Approve.

**Live path:** user crontab on chucky:

```cron
*/30 * * * * /home/chucky/.local/bin/oc-delivery-cron.sh >> ~/logs/delivery-cron.log 2>&1
```

Flow:

1. `oc-delivery-tick` reads `memory/delivery-active.md` (+ delivery file) in bash — **no LLM, no Slack**.
2. If `kind=idle` (Status none/paused/done, or File none) → **exit 0 silently**.
3. If `kind=status` or `kind=work` → wake `openclaw agent --agent cron` once (deliver to Slack DM).

When woken:

- `auto_continue: true` → run **one** `oc-agent` item and DM short progress  
- `auto_continue: false` + running → status-only (“N pending; waiting for you to say sigue”)  
- checklist empty → mark done / clear active pointer

### Re-enable auto progress later

1. Keep the **system crontab** (preferred) — it already gates on idle.
2. Set delivery `auto_continue: true` and Status `running` (Slack: **activa auto_continue en el delivery**).
3. Optional: re-enable OpenClaw cron only after cron-agent allowlist includes `oc-delivery-*` / helpers:
   `openclaw cron enable c736b205-81ce-4400-a58f-a4a0c2afff28`  
   Prefer leaving it disabled and relying on `oc-delivery-cron.sh`.

## Helpers

```bash
/home/chucky/.local/bin/oc-delivery-status   # human-readable dump
/home/chucky/.local/bin/oc-delivery-tick     # idle|status|work classifier
/home/chucky/.local/bin/oc-delivery-cron.sh  # crontab entrypoint
```

Coding always:

```bash
/home/chucky/.local/bin/oc-agent -p --approve-mcps --trust --force [--workspace …] "…"
```

Stuck session: user sends **`reset`**.

## vs tech-gate-delivery

| Skill | When |
|-------|------|
| **delivery-loop** | Generic multi-step Cursor plan/checklist |
| **tech-gate-delivery** | Full GitHub Project + issues + PR merge loop from a tech gate |
