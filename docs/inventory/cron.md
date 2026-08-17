# Cron — OpenClaw agents + OS crontab

## OpenClaw cron (if any)

### Config / state clues
```
total 16
drwxr-xr-x  4 chucky chucky 4096 Mar 29 01:18 .
drwx------ 19 chucky chucky 4096 Aug 17 13:20 ..
drwxr-xr-x  3 chucky chucky 4096 Mar 29 01:18 gh
drwxr-xr-x  4 chucky chucky 4096 Mar 26 00:35 main
/home/chucky/.openclaw/agents/main/agent/codex-home/.tmp/plugins/plugins/render/skills/render-cron-jobs
/home/chucky/.openclaw/agents/main/agent/codex-home/.tmp/plugins/plugins/render/skills/render-cron-jobs/references/cron-patterns.md
/home/chucky/.openclaw/agents/main/agent/codex-home/.tmp/plugins/plugins/vercel/skills/cron-jobs
/home/chucky/.openclaw/agents/main/agent/codex-home/.tmp/plugins/plugins/cloudflare/skills/cloudflare/references/cron-triggers
```

### openclaw cron (CLI)
```
No cron jobs.
```

## User crontab (`crontab -l`)
```
# MCSAI remote MySQL backup (staggered vs Mac 08:00/17:00)
5 8,17 * * * /home/chucky/bin/mcsai-backup-remote.sh >> /home/chucky/logs/mcsai-cron.log 2>&1
```

## System cron snippets mentioning openclaw / mcsai / backup
```
/etc/cron.daily/dpkg:8:/usr/libexec/dpkg/dpkg-db-backup
e2scrub_all
```

Note: backup.conf passwords intentionally omitted.

## Agents (structure, redacted)
```json
{
  "defaults": {
    "model": {
      "primary": "cursor-cli/auto"
    },
    "models": {
      "ollama/gpt-oss:20b": {
        "alias": "local-orchestrator",
        "params": {
          "num_ctx": 32768,
          "keep_alive": "24h"
        }
      },
      "ollama/qwen3.6:27b": {
        "alias": "qwen27",
        "params": {
          "num_ctx": 32768,
          "keep_alive": "30m",
          "thinking": false
        }
      },
      "ollama/qwen3.6:35b-a3b": {
        "alias": "qwen35moe",
        "params": {
          "num_ctx": 32768,
          "keep_alive": "24h",
          "thinking": false
        }
      },
      "cursor-cli/auto": {},
      "cursor-cli/claude-4-sonnet": {},
      "cursor-cli/claude-4.5-opus": {},
      "cursor-cli/claude-4.5-sonnet": {},
      "cursor-cli/claude-4.6-opus": {},
      "cursor-cli/claude-4.6-sonnet": {},
      "cursor-cli/claude-fable-5": {},
      "cursor-cli/claude-opus-4-7": {},
      "cursor-cli/claude-opus-4-8": {},
      "cursor-cli/claude-opus-5": {},
      "cursor-cli/claude-sonnet-5": {},
      "cursor-cli/composer-2.5": {},
      "cursor-cli/cursor-grok-4.5": {},
      "cursor-cli/cursor-grok-4.6": {},
      "cursor-cli/gemini-3-flash": {},
      "cursor-cli/gemini-3.1-pro": {},
      "cursor-cli/gemini-3.5-flash": {},
      "cursor-cli/gemini-3.6-flash": {},
      "cursor-cli/gemini-3.6-flash-minimal": {},
      "cursor-cli/gemini-3.7-flash": {},
      "cursor-cli/glm-5.2": {},
      "cursor-cli/gpt-5-mini": {},
      "cursor-cli/gpt-5.1": {},
      "cursor-cli/gpt-5.2": {},
      "cursor-cli/gpt-5.3-codex": {},
      "cursor-cli/gpt-5.4": {},
      "cursor-cli/gpt-5.4-mini": {},
      "cursor-cli/gpt-5.4-nano": {},
      "cursor-cli/gpt-5.5": {},
      "cursor-cli/gpt-5.5-extra": {},
      "cursor-cli/gpt-5.6-luna": {},
      "cursor-cli/gpt-5.6-sol": {},
      "cursor-cli/gpt-5.6-terra": {},
      "cursor-cli/kimi-k2.7-code": {},
      "cursor-cli/kimi-k3": {}
    },
    "compaction": {
      "mode": "safeguard",
      "reserveTokens": "REDACTED",
      "reserveTokensFloor": "REDACTED"
    },
    "maxConcurrent": 4,
    "subagents": {
      "maxConcurrent": 8
    },
    "workspace": "/home/chucky/.openclaw/workspace",
    "heartbeat": {
      "every": "0m"
    },
    "experimental": {
      "localModelLean": true
    },
    "timeoutSeconds": 600,
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
    }
  },
  "list": [
    {
      "id": "main",
      "model": {
        "primary": "cursor-cli/auto"
      },
      "tools": {
        "exec": {
          "host": "gateway"
        }
      },
      "workspace": "/home/chucky/.openclaw/workspace",
      "experimental": {
        "localModelLean": true
      }
    },
    {
      "id": "cron",
      "name": "cron-qwen",
      "model": {
        "primary": "ollama/qwen3.6:35b-a3b"
      },
      "workspace": "/home/chucky/.openclaw/workspace",
      "tools": {
        "exec": {
          "host": "gateway"
        }
      },
      "experimental": {
        "localModelLean": true
      }
    }
  ]
}
```
