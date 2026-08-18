# Delivery loop — example prompts

## Start (plan + first item)

```text
Empieza proyecto: mejora el export CSV en Dhaliora (digital-message-platform). Plan e implementa punto por punto.
```

```text
Delivery loop: arregla los flaky tests del API y deja checklist en memory.
```

```text
Plan e implementa punto por punto el refactor de hours en mcsai.
```

```text
Trabaja por horas en este feature: <descripción>
```

Chuck should: one `oc-agent` plan → `memory/delivery-<slug>.md` + `memory/delivery-active.md` → implement **one** `[ ]` → Slack summary → ¿Sigo?

## Continue manually

```text
Sigue
```

```text
Sigue con el siguiente
```

```text
Continúa el delivery
```

## Enable auto mode (cron will implement)

```text
Activa auto_continue en el delivery
```

Or edit `memory/delivery-<slug>.md` and set `auto_continue: true` (status must stay `running`).

Cron `delivery-loop-tick` then does one checkbox every ~30m and DMs progress.

## Pause / stop auto

```text
Pausa el delivery
```

```text
Desactiva auto_continue
```

## Status

```text
Estado del delivery
```

(or `exec` → `/home/chucky/.local/bin/oc-delivery-status`)

## Stuck

```text
reset
```
