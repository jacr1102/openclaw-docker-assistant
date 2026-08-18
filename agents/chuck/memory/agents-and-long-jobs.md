# Agentes y trabajos largos (Chucky + Cursor)

## ¿Esto es “un agente”?

Sí — pero son **dos roles**, no un solo proceso que responde 3 horas en Slack.

| Rol | Qué es | Dónde vive |
|-----|--------|------------|
| **Chucky (OpenClaw)** | **Orquestador** en Slack/WhatsApp. Modelo local **Qwen**. Entiende el pedido, elige herramienta, recuerda checklist, pregunta **¿sigo?**, resume resultados. | Gateway en chucky (`openclaw-gateway.service`) |
| **Cursor (`oc-agent` / `oc-web`)** | **Worker**. Usa tu suscripción Cursor: código, WebSearch/WebFetch, MCPs. | Binarios en `/home/chucky/.local/bin/oc-*` vía `exec host=gateway` |

Patrón clásico **orquestador + herramientas**. Chucky no “es Cursor”; Cursor no es el chat de Slack.

## Por qué un turno de Slack no dura horas

Cada mensaje de Slack dispara un **turno corto** de OpenClaw acotado por timeouts (`agents.defaults.timeoutSeconds`, hoy ~1800s). Si metes un plan de 3 horas dentro de **una** respuesta, Qwen se atasca, inventa, o el run hace timeout — no es un demonio de fondo.

## Cómo hacer trabajo de varias horas (práctico)

### A) Mejor para ustedes ahora — “continue loop”

1. Escribe el plan/checklist en `memory/<proyecto>.md` (ítems `[ ]` / `[x]`).
2. Chucky ejecuta **una** tarea con `oc-agent -p` (fresco, sin resume acumulado).
3. Resume en Slack y pregunta **¿sigo con la siguiente?**
4. Repite hasta vaciar el checklist.

Ventaja: control humano, sesiones Slack sanas, fácil de recuperar con `reset`/`new`.

### B) Cron — ticks programados

Usa el agente `cron` (mismo Qwen) para despertar cada N minutos, leer el checklist, tomar el siguiente ítem y llamar `oc-agent`:

```bash
openclaw cron add --agent cron --every 30m --announce   "Lee memory/<plan>.md; si hay un [ ] pendiente, ejecuta UNA tarea con oc-agent; marca progreso; resume breve."
```

(Ajusta schedule/mensaje; no pegues secretos.)

### C) Fondo real — `oc-long-job` (screen/nohup pattern)

Para no retener el turno de Slack:

```bash
exec host=gateway
  /home/chucky/.local/bin/oc-long-job start --workspace /path/al/repo -- "Sigue el plan en memory/foo.md; solo la tarea 1"
```

- Logs: `/home/chucky/logs/oc-jobs/<job-id>.log`
- Estado: `oc-long-job status <job-id>` / `log <job-id>` / `list`
- Chucky solo **arranca** y **consulta**; el worker corre en background en chucky.

También sirve `tmux`/`screen`/`nohup` a mano; el wrapper es la variante allowlisteada y simple.

## Web / internet

Siempre Cursor vía **`exec` → `/home/chucky/.local/bin/oc-web`**. Nunca tool id `oc-web`, nunca `web_search`/`browser` nativos, nunca inventar con Qwen. Ver `AGENTS.md` / `TOOLS.md` (IRON RULE).

## Relacionado

- `memory/long-jobs-continue.md` — nota corta de timeouts
- `memory/model-hybrid-setup.md` — Qwen chat + Cursor worker
