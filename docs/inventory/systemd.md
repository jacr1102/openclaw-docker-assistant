# Systemd (user) — OpenClaw Gateway

## Unit
- name: `openclaw-gateway.service`
- unit file: `~/.config/systemd/user/openclaw-gateway.service`

## Status
```
● openclaw-gateway.service - OpenClaw Gateway (v2026.7.1-2)
     Loaded: loaded (/home/chucky/.config/systemd/user/openclaw-gateway.service; enabled; preset: enabled)
     Active: active (running) since Mon 2026-08-17 13:20:56 UTC; 1min 37s ago
 Invocation: 01a5c16830ea4bb9b4d2f42369df98f0
   Main PID: 23332 (MainThread)
      Tasks: 12 (limit: 37495)
     Memory: 805.8M (peak: 809.9M)
        CPU: 9.469s
     CGroup: /user.slice/user-1000.slice/user@1000.service/app.slice/openclaw-gateway.service
             └─23332 /home/chucky/.nvm/versions/node/v24.19.0/bin/node /home/chucky/.nvm/versions/node/v24.19.0/lib/node_modules/openclaw/dist/index.js gateway --port 18789

Aug 17 13:21:01 chuck node[23332]: 2026-08-17T13:21:01.151+00:00 [gateway] agent model: cursor-cli/auto (thinking=off, fast=off)
Aug 17 13:21:01 chuck node[23332]: 2026-08-17T13:21:01.153+00:00 [gateway] http server listening (10 plugins: browser, canvas, device-pair, file-transfer, memory-core, ollama, phone-control, slack, talk-voice, whatsapp; 1.1s)
Aug 17 13:21:01 chuck node[23332]: 2026-08-17T13:21:01.156+00:00 [gateway] log file: /tmp/openclaw/openclaw-2026-08-17.log
Aug 17 13:21:01 chuck node[23332]: 2026-08-17T13:21:01.229+00:00 [gateway] starting channels and sidecars...
Aug 17 13:21:01 chuck node[23332]: 2026-08-17T13:21:01.325+00:00 [slack] [default] starting provider
Aug 17 13:21:01 chuck node[23332]: 2026-08-17T13:21:01.556+00:00 [gateway] ready
Aug 17 13:21:01 chuck node[23332]: 2026-08-17T13:21:01.569+00:00 [heartbeat] disabled
Aug 17 13:21:03 chuck node[23332]: 2026-08-17T13:21:03.014+00:00 [slack] socket mode connected
Aug 17 13:21:06 chuck node[23332]: 2026-08-17T13:21:06.988+00:00 [ws] ⇄ res ✓ health 52ms conn=6df859cb…9089 id=6f1437ec…69de
Aug 17 13:21:11 chuck node[23332]: 2026-08-17T13:21:11.633+00:00 [gateway] agent runtime plugins pre-warmed in 77ms
```

## Linger
```
Linger=yes
total 8
drwxr-xr-x  2 root root 4096 Aug  6 20:19 .
drwxr-xr-x 13 root root 4096 Aug  6 12:49 ..
-rw-r--r--  1 root root    0 Aug  6 20:19 chucky
```

## How to restart

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw-gateway.service
systemctl --user status openclaw-gateway.service
```

## Enable / logs

```bash
systemctl --user enable openclaw-gateway.service
journalctl --user -u openclaw-gateway.service -f
```

## Unit file (secrets redacted)
```ini
[Unit]
Description=OpenClaw Gateway (v2026.7.1-2)
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/home/chucky/.nvm/versions/node/v24.19.0/bin/node /home/chucky/.nvm/versions/node/v24.19.0/lib/node_modules/openclaw/dist/index.js gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group
EnvironmentFile=REDACTED_PATH_OR_SEE_NOTE
Environment=OPENCLAW_SERVICE_MANAGED_ENV_KEYS=OPENAI_API_KEY,OPENCLAW_GATEWAY_BIND,OPENCLAW_GATEWAY_PORT,OPENCLAW_SKIP_GMAIL_WATCHER,SLACK_APP_TOKEN,SLACK_BOT_TOKEN,NODE_OPTIONS
Environment=HOME=/home/chucky
Environment=TMPDIR=/tmp
Environment=NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
Environment=PATH=/home/chucky/.nvm/versions/node/v24.19.0/bin:/usr/local/bin:/usr/bin:/bin:/home/chucky/.nvm/current/bin:/home/chucky/.local/bin:/home/chucky/.npm-global/bin:/home/chucky/bin:/home/chucky/.nix-profile/bin
Environment=OPENCLAW_SYSTEMD_UNIT=openclaw-gateway.service
Environment="OPENCLAW_WINDOWS_TASK_NAME=OpenClaw Gateway"
Environment=OPENCLAW_WINDOWS_TASK_HIDDEN_LAUNCHER=1
Environment=OPENCLAW_SERVICE_MARKER=openclaw
Environment=OPENCLAW_SERVICE_KIND=gateway
Environment=OPENCLAW_SERVICE_VERSION=2026.7.1-2

[Install]
WantedBy=default.target
```

Note: `gateway.systemd.env` exists at `~/.openclaw/gateway.systemd.env` but is **not** copied (contains secrets).
