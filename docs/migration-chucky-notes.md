# OpenClaw: VPS → chucky (notes)

## Decision

**On chucky: native OpenClaw (no Docker gateway).**  
Reason: full host access (`gh`, `agent`, filesystem, docker CLI if needed).  
VPS Nginx + TLS proxies to chucky Tailscale `:18789`.

**State dir choice:** `~/.openclaw` (native default).

## Cutover status — DONE 2026-08-06

| Item | Value |
|------|--------|
| Live gateway | **chucky** native systemd user unit `openclaw-gateway.service` |
| Chucky Tailscale | `100.88.86.99` |
| Public URL | `https://assistant.dhalia.fun` |
| Nginx `proxy_pass` | `http://100.88.86.99:18789` |
| Nginx backup | `/etc/nginx/sites-available/assistant.bak.cutover-20260806202232` |
| VPS container | `assistant-openclaw-gateway-1` **Exited** (data kept under `/home/assistant/data`) |
| Health | `https://assistant.dhalia.fun/healthz` → **200**; chucky `127.0.0.1:18789/healthz` → **200** |
| Linger | **yes** |

### Cutover steps executed

1. Stopped VPS: `docker stop assistant-openclaw-gateway-1`
2. Started chucky: `systemctl --user enable --now openclaw-gateway.service`
3. Patched Nginx via Docker bind-mount (deploy has docker group, no sudo):
   - `proxy_pass http://127.0.0.1:18789` → `http://100.88.86.99:18789`
   - `nginx -t` + `nginx -s reload` via `nsenter` into host PID 1

### Rollback (if needed)

```bash
# 1) Revert Nginx
ssh dhaliora 'docker run --rm -v /etc/nginx/sites-available:/sites alpine \
  sh -c "cp /sites/assistant.bak.cutover-20260806202232 /sites/assistant"
docker run --rm --privileged --pid=host alpine \
  nsenter --target 1 --mount --uts --ipc --net --pid -- nginx -t
docker run --rm --privileged --pid=host alpine \
  nsenter --target 1 --mount --uts --ipc --net --pid -- nginx -s reload'

# 2) Stop chucky
ssh chucky 'export XDG_RUNTIME_DIR=/run/user/$(id -u); systemctl --user stop openclaw-gateway.service'

# 3) Start VPS gateway
ssh dhaliora 'docker start assistant-openclaw-gateway-1'
```

## VPS inventory (edge / rollback host)

| Item | Value |
|------|--------|
| SSH | `deploy@assistant.dhalia.fun` via `~/.ssh/dhaliora_deploy` (alias: `ssh dhaliora`) |
| Hostname | `server2.dhalia.fun` |
| Public IP | `159.198.32.65` |
| Tailscale | `100.64.157.106` (`server2`) |
| Compose project | `assistant` |
| Host path | `/home/assistant` (`docker-compose.prod.yml`) |
| Config bind (cold) | `/home/assistant/data/config` |
| Workspace bind (cold) | `/home/assistant/data/workspace` |
| Role now | Nginx TLS terminator + rollback data |

### Caveats

- Config volume had **~1.8M** `openclaw.json.clobbered.*` junk — exclude when copying.

## VPS access from chucky

| Item | Value |
|------|--------|
| On chucky | `~/.ssh/dhaliora_deploy` (+ `.pub`), mode `600`/`644` |
| SSH config | `Host dhaliora` / `assistant.dhalia.fun` → User `deploy`, `IdentityFile ~/.ssh/dhaliora_deploy`, `IdentitiesOnly yes` |
| Hop check | `ssh chucky 'ssh -o BatchMode=yes dhaliora "hostname; whoami"'` |
| Sudoers | `/etc/sudoers.d/deploy-openclaw` (visudo-validated; **not** `NOPASSWD: ALL`) |
| Site wrapper | `/usr/local/sbin/deploy-site-ops` — file ops only under `/etc/nginx` and `/var/www` |
| Aliases | `OPENCLAW_APT`, `OPENCLAW_NGINX`, `OPENCLAW_CERT`, `OPENCLAW_SITE`, `OPENCLAW_NOP` (`true`) |
| Verify | `ssh dhaliora 'sudo -n true && sudo -n nginx -t && sudo -n apt-get update -qq'` |

**Agent practice:** prefer `ssh dhaliora '…'` for VPS; local shell for chucky. Never print secrets. Keep VPS OpenClaw container stopped.

**Emergency root (legacy):** if sudoers is missing/broken, host edits can still use docker bind-mount + `docker run --privileged --pid=host … nsenter` (same as nginx cutover). Prefer the sudoers path for day-to-day.

## Target (chucky) — live

| Item | Value |
|------|--------|
| LAN | `chucky@192.168.68.117` |
| Tailscale | `100.88.86.99` |
| SSH | `~/.ssh/chucky_ed25519` (alias: `ssh chucky`) |
| Node | **v24.19.0** via nvm |
| OpenClaw | **2026.7.1-2** |
| State dir | `~/.openclaw` |
| Workspace | `~/.openclaw/workspace` |
| Gateway unit | `~/.config/systemd/user/openclaw-gateway.service` (**enabled, running**) |
| Env | `~/.openclaw/gateway.systemd.env` |

### Config notes (native)

- `gateway.mode=local`, `gateway.bind=lan`, `gateway.port=18789`
- `gateway.controlUi.allowedOrigins` includes `https://assistant.dhalia.fun`
- Slack schema: `streaming` object form; Slack starts on chucky only

## Checklist

- [x] Native OpenClaw + Node on chucky
- [x] Config + workspace migrated (clobbered excluded)
- [x] Secrets env for systemd
- [x] `allowedOrigins` + `bind=lan`
- [x] systemd user unit
- [x] `loginctl enable-linger chucky` → Linger=yes
- [x] Stop VPS OpenClaw container
- [x] Start chucky gateway (health 200)
- [x] Nginx → `http://100.88.86.99:18789` (reloaded)
- [x] Public `https://assistant.dhalia.fun/healthz` → 200
- [ ] Keep VPS data as rollback for a few days
- [ ] Update GitHub Actions / Mac `OPENCLAW_GATEWAY_HOST` to `100.88.86.99`
- [ ] On chucky: agent login / `gh auth` / any host-local tool auth as needed
- [ ] Confirm Slack replies from chucky (single Socket Mode connection)

## Post-cutover next steps (user)

1. Confirm Slack works (message the bot).
2. On chucky: `gh auth login` / agent credentials if needed for host tools.
3. Point Mac node / CI `OPENCLAW_GATEWAY_HOST` at `100.88.86.99` (or keep using public URL via Nginx).
4. After a few stable days, optionally remove VPS OpenClaw container/image (keep `/home/assistant/data` backup longer).

## MCSAI prod MySQL backup (chucky) — added 2026-08-10

Remote dump of hosting MySQL → chucky disk. **Mac cron + LaunchAgent left active** until chucky runs are verified for several days.

| Item | Value |
|------|--------|
| Script | `/home/chucky/bin/mcsai-backup-remote.sh` (repo: `scripts/mcsai-backup-remote.sh`) |
| Config | `/home/chucky/.config/mcsai-backup/backup.conf` (`600`, not in git) |
| Output | `/home/chucky/Backups/mcsai-remote/*.sql.gz` (30-day retention) |
| Logs | `~/logs/mcsai-backup.log`, `~/logs/mcsai-cron.log` |
| Crontab (chucky) | `5 8,17 * * *` (staggered vs Mac `0 8,17` + LaunchAgent `08:10`/`17:10`) |
| README | `/home/chucky/Backups/mcsai-remote/README.md` |
| mysqldump | Prefer `sudo apt-get install -y mysql-client`; interim: `~/bin/mysqldump` → `~/.local/mysql-client` |

Manual test 2026-08-10: OK (~8.7M `.sql.gz`). Do **not** disable Mac schedules until dual-run period is done.
