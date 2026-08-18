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

## Cron: `delivery-loop-tick`

- Every **30m**, agent **`cron`**, isolated session  
- Announces to Jonathan Slack DM (`user:UGN9SRK24`) with `--best-effort-deliver`  
- If no active/running delivery → `NO_REPLY`  
- If `auto_continue: true` → runs **one** `oc-agent` item and DMs short progress  
- If `auto_continue: false` → status-only (“N pending; waiting for you to say sigue”) — no `oc-agent`

## Helpers

```bash
/home/chucky/.local/bin/oc-delivery-status
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
