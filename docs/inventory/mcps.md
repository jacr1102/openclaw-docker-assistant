# MCP inventory

Secrets/API keys redacted. Server names and command paths only.

### `/home/chucky/.cursor/mcp.json`

- **gmail**
  - command: `node`
  - args: `['/home/chucky/.cursor/gmail-local-mcp.mjs']`

- **gmail-hosted**
  - command: `npx`
  - args: `['-y', 'mcp-remote@0.1.38', 'https://gmailmcp.googleapis.com/mcp/v1', '8787', '--static-oauth-client-info', '@/home/chucky/.cursor/gmail-oauth-client.json', '--static-oauth-client-metadata', '{"scope":"https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.compose"}', '--auth-timeout', '300', '--debug']`

- **mcsai-observability**
  - command: `bash`
  - args: `['/home/chucky/.openclaw/workspace/repos/mcsai/mcp/mcsai-observability/run-mcp.sh']`

### `/home/chucky/.openclaw/workspace/repos/mcsai/.cursor/mcp.json`

- **mcsai-observability**
  - command: `bash`
  - args: `['${workspaceFolder}/mcp/mcsai-observability/run-mcp.sh']`

- **gmail**
  - command: `https://gmailmcp.googleapis.com/mcp/v1`

### `~/.openclaw/openclaw.json` → `mcp`

```json
{
  "servers": {
    "mcsai-observability": {
      "command": "bash",
      "args": [
        "/home/chucky/.openclaw/workspace/repos/mcsai/mcp/mcsai-observability/run-mcp.sh"
      ],
      "toolFilter": {
        "include": [
          "observability_schema"
        ]
      }
    }
  }
}
```
