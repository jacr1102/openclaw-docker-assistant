# Server setup — chucky + VPS edge

**ES:** Topología del host OpenClaw (nativo en chucky) y el proxy TLS en el VPS.  
**EN:** Host topology for native OpenClaw on chucky and the VPS TLS proxy.

## Architecture

```
Slack / Control UI (browser)
        │
        ▼
https://assistant.dhalia.fun   (VPS: server2 / dhaliora)
        │  Nginx TLS terminator
        ▼
http://100.88.86.99:18789     (chucky via Tailscale)
        │
        ▼
openclaw-gateway.service      (systemd --user, linger=yes)
        │
        ├── Slack Socket Mode
        ├── Cursor CLI (cursor-agent)  ← primary model cursor-cli/auto
        ├── oc-* wrappers (~/.local/bin)
        └── Ollama Qwen                ← only agent id `cron`
```

| Role | Host | Notes |
|------|------|--------|
| Gateway | **chucky** | Native OpenClaw (no Docker gateway). State: `~/.openclaw` |
| Edge / TLS | **dhaliora** / `server2.dhalia.fun` | Nginx → Tailscale IP of chucky |
| Public UI | `https://assistant.dhalia.fun` | Control UI + healthz |
| Health | `https://assistant.dhalia.fun/healthz` | Expect HTTP 200 |

Cutover history and rollback: [`docs/migration-chucky-notes.md`](../migration-chucky-notes.md).

## chucky host

| Item | Value |
|------|--------|
| LAN | `chucky@192.168.68.117` |
| Tailscale | `100.88.86.99` |
| SSH (from Mac) | `ssh chucky` (`~/.ssh/chucky_ed25519`) |
| Node | nvm → **v24.19.0** |
| OpenClaw | **2026.7.1-2** (npm global under nvm) |
| Workspace | `~/.openclaw/workspace` |
| Gateway unit | `~/.config/systemd/user/openclaw-gateway.service` |
| Secrets env | `~/.openclaw/gateway.systemd.env` (**never commit**) |

### Gateway config highlights

- `gateway.mode=local`, `gateway.bind=lan`, `gateway.port=18789`
- `gateway.controlUi.allowedOrigins` includes `https://assistant.dhalia.fun`
- `tools.exec.host=gateway`, `tools.exec.mode=ask` (approvals)
- `session.resetTriggers`: `/new`, `/reset`, `new`, `reset`

Inventory snapshot: [`docs/inventory/systemd.md`](../inventory/systemd.md), [`docs/inventory/openclaw.config.redacted.md`](../inventory/openclaw.config.redacted.md).

### systemd user + linger

```bash
# On chucky
loginctl enable-linger chucky   # so gateway survives logout
export XDG_RUNTIME_DIR=/run/user/$(id -u)
systemctl --user daemon-reload
systemctl --user enable --now openclaw-gateway.service
systemctl --user status openclaw-gateway.service
journalctl --user -u openclaw-gateway.service -f
```

`EnvironmentFile` for Slack/OpenAI/etc. lives outside git (`gateway.systemd.env`).

## VPS (dhaliora)

| Item | Value |
|------|--------|
| SSH | `ssh dhaliora` / `deploy@assistant.dhalia.fun` |
| Public IP | `159.198.32.65` |
| Tailscale | `100.64.157.106` |
| Nginx | `proxy_pass http://100.88.86.99:18789` |
| OpenClaw container | **Stopped** (rollback data under `/home/assistant/data`) |

Example nginx snippet (repo): [`deploy/nginx-openclaw.https.example.conf`](../../deploy/nginx-openclaw.https.example.conf).

## Tailscale

1. Install on chucky (`curl -fsSL https://tailscale.com/install.sh | sh`).
2. `sudo tailscale up` and join the tailnet.
3. Confirm VPS can reach `http://100.88.86.99:18789/healthz`.
4. Point Nginx `proxy_pass` at that Tailscale IP (not LAN).

## MCSAI MySQL backup (on chucky)

- Script: [`scripts/mcsai-backup-remote.sh`](../../scripts/mcsai-backup-remote.sh) → install to `~/bin/mcsai-backup-remote.sh`
- Config (secrets): `~/.config/mcsai-backup/backup.conf` mode `600` — **not in git**
- Crontab: `5 8,17 * * * … >> ~/logs/mcsai-cron.log`
- Output: `~/Backups/mcsai-remote/*.sql.gz` (30-day retention)

## Bootstrap helpers

From this repo (Mac → chucky):

```bash
./scripts/bootstrap-chucky.sh          # SSH key + Host aliases
ssh chucky 'bash -s' < scripts/setup-chucky-base.sh
```

Then follow the numbered reinstall checklist in the root [README.md](../../README.md).
