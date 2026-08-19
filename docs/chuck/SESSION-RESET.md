# Session reset (Slack / WhatsApp)

**ES:** Cómo desbloquear una sesión congelada.  
**EN:** How to clear a stuck OpenClaw session.

Full operator notes: [`agents/chuck/memory/session-reset.md`](../../agents/chuck/memory/session-reset.md).

## User self-serve (same chat)

Type exactly one of these as the **whole message**:

- `reset`
- `new`

Also accepted when delivered to the gateway: `/reset`, `/new`.

### Slack caveat

A leading `/` is often intercepted by Slack as an **unregistered slash command**, so **`/new` may never reach OpenClaw**. Prefer plain `reset` / `new`.

Optional if the Slack app registered `/openclaw`:

- `/openclaw /new`
- `/openclaw /reset`

In a channel: `@Chucky reset` (exact token after mention strip).

**`hola` alone does not reset.** Allowlisted exec no longer needs Slack Approve (`tools.exec.mode=allowlist`, host `ask=off`). If a session still looks stuck, use `oc-reset-session` rather than waiting on a DM approval.

WhatsApp (when linked): same — type `reset` or `new`.

## Config

`session.resetTriggers` includes: `/new`, `/reset`, `new`, `reset` (see redacted inventory).

## Operator CLI backup

```bash
# On chucky (allowlisted wrapper)
oc-reset-session --dm
oc-reset-session --list
oc-reset-session --key '<sessionKey>'
oc-reset-session --reason new
```

Repo template: [`scripts/oc-reset-session.sh`](../../scripts/oc-reset-session.sh) / [`agents/chuck/bin/oc-reset-session`](../../agents/chuck/bin/oc-reset-session).
