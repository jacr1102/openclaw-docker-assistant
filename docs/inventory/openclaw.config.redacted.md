# OpenClaw config (redacted)

Host `chucky` · source `~/.openclaw/openclaw.json`

## Gateway
- bind: `lan`
- port: `18789`
- auth: REDACTED

## tools.exec
```json
{
  "host": "gateway",
  "mode": "ask"
}
```

## agents.defaults.cliBackends / compaction / heartbeat
```json
{
  "cliBackends": {
    "cursor-cli": {
      "serialize": false,
      "reliability": {
        "watchdog": {
          "fresh": {
            "noOutputTimeoutRatio": 0.8,
            "minMs": 120000,
            "maxMs": 300000
          },
          "resume": {
            "noOutputTimeoutRatio": 0.3,
            "minMs": 45000,
            "maxMs": 120000
          }
        }
      },
      "command": "/home/chucky/.local/bin/cursor-agent"
    }
  },
  "compaction": {
    "mode": "safeguard",
    "reserveTokens": 4096,
    "reserveTokensFloor": 4096
  },
  "heartbeat": {
    "every": "0m"
  },
  "model": {
    "primary": "ollama/qwen3.6:35b-a3b"
  }
}
```

## session.resetTriggers
```json
[
  "/new",
  "/reset",
  "new",
  "reset"
]
```

## Channel keys
`['slack']`

## Plugin config keys
`['entries', 'allow']`

Full structured dump: `openclaw.config.redacted.json5`
