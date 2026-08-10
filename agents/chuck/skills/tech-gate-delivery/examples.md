# Tech gate delivery — example prompts

## Minimal (preferred)

Attach or paste the tech gate, then:

```text
Trabaja en este proyecto.
```

(Default target: `#dhaliora` / `jacr1102/digital-message-platform`.)

Or explicitly:

```text
Ejecuta este tech gate en Dhaliora / digital-message-platform
```

Chuck should: create/reuse GitHub Project → create all issues → add them to the project → implement one-by-one (plan → security review → PR → PR review → merge).

**Do not** run against mcsai unless the human explicitly says so (e.g. “en mcsai” / `#mc-sai`).

## Resume after interruption

```text
Continúa el tech gate <slug> desde donde quedó
```

Chuck should read `memory/tech-gate-<slug>.md` and resume the next incomplete issue.

## Scope only bootstrap (optional override)

```text
Solo crea el Project y las issues del tech gate; no implementes aún
```
