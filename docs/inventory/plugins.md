# OpenClaw plugins

## extensions dir
```
total 16
drwxrwxr-x  4 chucky chucky 4096 Aug 17 00:15 .
drwx------ 19 chucky chucky 4096 Aug 17 13:20 ..
drwx------  4 chucky chucky 4096 Aug 17 00:16 cursor-cli
drwxrwxr-x  5 chucky chucky 4096 Aug 16 00:23 whatsapp
/home/chucky/.openclaw/extensions
/home/chucky/.openclaw/extensions/whatsapp
/home/chucky/.openclaw/extensions/whatsapp/README.md
/home/chucky/.openclaw/extensions/whatsapp/skills
/home/chucky/.openclaw/extensions/whatsapp/skills/wacli
/home/chucky/.openclaw/extensions/whatsapp/package.json
/home/chucky/.openclaw/extensions/whatsapp/node_modules
/home/chucky/.openclaw/extensions/whatsapp/node_modules/typebox
/home/chucky/.openclaw/extensions/whatsapp/node_modules/ws
/home/chucky/.openclaw/extensions/whatsapp/node_modules/@img
/home/chucky/.openclaw/extensions/whatsapp/node_modules/tslib
/home/chucky/.openclaw/extensions/whatsapp/node_modules/hashery
/home/chucky/.openclaw/extensions/whatsapp/node_modules/long
/home/chucky/.openclaw/extensions/whatsapp/node_modules/strtok3
/home/chucky/.openclaw/extensions/whatsapp/node_modules/@borewit
/home/chucky/.openclaw/extensions/whatsapp/node_modules/@tokenizer
/home/chucky/.openclaw/extensions/whatsapp/node_modules/simple-yenc
/home/chucky/.openclaw/extensions/whatsapp/node_modules/music-metadata
/home/chucky/.openclaw/extensions/whatsapp/node_modules/baileys
/home/chucky/.openclaw/extensions/whatsapp/node_modules/node-wav
/home/chucky/.openclaw/extensions/whatsapp/node_modules/@keyv
/home/chucky/.openclaw/extensions/whatsapp/node_modules/@pinojs
/home/chucky/.openclaw/extensions/whatsapp/node_modules/pino-std-serializers
/home/chucky/.openclaw/extensions/whatsapp/node_modules/token-types
/home/chucky/.openclaw/extensions/whatsapp/node_modules/safe-stable-stringify
/home/chucky/.openclaw/extensions/whatsapp/node_modules/p-queue
/home/chucky/.openclaw/extensions/whatsapp/node_modules/@thi.ng
/home/chucky/.openclaw/extensions/whatsapp/node_modules/real-require
/home/chucky/.openclaw/extensions/whatsapp/node_modules/pino-abstract-transport
/home/chucky/.openclaw/extensions/whatsapp/node_modules/ieee754
/home/chucky/.openclaw/extensions/whatsapp/node_modules/audio-buffer
/home/chucky/.openclaw/extensions/whatsapp/node_modules/quick-format-unescaped
/home/chucky/.openclaw/extensions/whatsapp/node_modules/content-type
/home/chucky/.openclaw/extensions/whatsapp/node_modules/codec-parser
/home/chucky/.openclaw/extensions/whatsapp/node_modules/.bin
/home/chucky/.openclaw/extensions/whatsapp/node_modules/curve25519-js
/home/chucky/.openclaw/extensions/whatsapp/node_modules/detect-libc
/home/chucky/.openclaw/extensions/whatsapp/node_modules/protobufjs
/home/chucky/.openclaw/extensions/whatsapp/node_modules/libsignal
/home/chucky/.openclaw/extensions/whatsapp/node_modules/semver
/home/chucky/.openclaw/extensions/whatsapp/node_modules/split2
/home/chucky/.openclaw/extensions/whatsapp/node_modules/mpg123-decoder
/home/chucky/.openclaw/extensions/whatsapp/node_modules/thread-stream
/home/chucky/.openclaw/extensions/whatsapp/node_modules/hookified
/home/chucky/.openclaw/extensions/whatsapp/node_modules/win-guid
/home/chucky/.openclaw/extensions/whatsapp/node_modules/debug
/home/chucky/.openclaw/extensions/whatsapp/node_modules/p-timeout
/home/chucky/.openclaw/extensions/whatsapp/node_modules/media-typer
/home/chucky/.openclaw/extensions/whatsapp/node_modules/qified
/home/chucky/.openclaw/extensions/whatsapp/node_modules/uint8array-extras
/home/chucky/.openclaw/extensions/whatsapp/node_modules/qoa-format
/home/chucky/.openclaw/extensions/whatsapp/node_modules/atomic-sleep
/home/chucky/.openclaw/extensions/whatsapp/node_modules/ogg-opus-decoder
/home/chucky/.openclaw/extensions/whatsapp/node_modules/whatsapp-rust-bridge
/home/chucky/.openclaw/extensions/whatsapp/node_modules/@hapi
/home/chucky/.openclaw/extensions/whatsapp/node_modules/eventemitter3
/home/chucky/.openclaw/extensions/whatsapp/node_modules/@wasm-audio-decoders
/home/chucky/.openclaw/extensions/whatsapp/node_modules/cacheable
/home/chucky/.openclaw/extensions/whatsapp/node_modules/pino
/home/chucky/.openclaw/extensions/whatsapp/node_modules/@protobufjs
```

## From config `plugins` (redacted)
- `cursor-cli` version=0.0.6
- `whatsapp` version=2026.7.1

```json
{
  "entries": {
    "openai": {
      "enabled": false
    },
    "slack": {
      "enabled": true
    },
    "codex": {
      "enabled": false
    },
    "ollama": {
      "enabled": true
    },
    "whatsapp": {
      "enabled": true
    },
    "cursor-cli": {
      "enabled": true,
      "config": {
        "command": "/home/chucky/.local/bin/cursor-agent",
        "mode": "agent",
        "allowTools": true
      }
    }
  },
  "allow": [
    "slack",
    "openai",
    "memory-core",
    "browser",
    "canvas",
    "device-pair",
    "file-transfer",
    "ollama",
    "phone-control",
    "talk-voice",
    "whatsapp",
    "cursor-cli"
  ]
}
```

## Bundled / configured plugins (from openclaw.json plugins + channels)

plugins config type: dict
plugins keys: ['entries', 'allow']
  entries names: ['openai', 'slack', 'codex', 'ollama', 'whatsapp', 'cursor-cli']
  allow: ['slack', 'openai', 'memory-core', 'browser', 'canvas', 'device-pair', 'file-transfer', 'ollama', 'phone-control', 'talk-voice', 'whatsapp', 'cursor-cli']
channels: ['slack']
extension dirs: ['whatsapp', 'cursor-cli']
npm hits for slack: ['projects/openclaw-slack-b25c10c1bd', 'projects/openclaw-slack-b25c10c1bd/node_modules/@openclaw/slack', 'projects/openclaw-slack-b25c10c1bd/node_modules/@openclaw/slack/skills/slack', 'projects/openclaw-slack-b25c10c1bd/node_modules/@openclaw/slack/node_modules/@slack', 'projects/openclaw-slack-b25c10c1bd/node_modules/@openclaw/slack/node_modules/@slack/web-api/dist/types/request/slackLists.d.ts.map']
npm hits for whatsapp: []
npm hits for ollama: []
npm hits for cursor-cli: []
