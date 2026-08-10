#!/usr/bin/env node
/**
 * Gmail MCP OAuth for headless chucky — tokens always land on chucky.
 *
 * Default (recommended): paste-code. No ssh -L, no Mac callback.
 *   1) Open printed Google URL in ANY browser
 *   2) Consent
 *   3) Browser lands on http://localhost:8787/... (fails locally — expected)
 *   4) Paste the full redirect URL (or just ?code=...) into this SSH session
 *
 * Optional: --listen on Tailscale/LAN so the browser hits chucky directly
 * (requires that redirect URI in Google Cloud OAuth client).
 *
 * Ongoing Gmail MCP calls run on chucky via agent + mcp-remote; Mac is never
 * in the email data path.
 */
import http from 'node:http';
import { execFile, execSync } from 'node:child_process';
import { randomBytes, createHash } from 'node:crypto';
import { createInterface } from 'node:readline';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const PORT = 8787;
const CALLBACK_PATH = '/oauth/callback';
const SERVER_URL = 'https://gmailmcp.googleapis.com/mcp/v1';
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
].join(' ');
const CLIENT_FILE = path.join(os.homedir(), '.cursor/gmail-oauth-client.json');
const SERVER_HASH = createHash('md5').update(SERVER_URL).digest('hex');
const DEFAULT_TAILSCALE_IP = '100.88.86.99';

function usage() {
  console.log(`Usage: node ~/.cursor/gmail-oauth-login.js [options]

Options:
  (default)              Paste-code mode — no listener, no ssh -L
  --listen               Bind 0.0.0.0:${PORT}; redirect via Tailscale IP
  --listen-host <ip>     Bind a specific address (implies listen mode)
  --redirect-host <host> Host used in redirect_uri (default: ${DEFAULT_TAILSCALE_IP})
  --help                 Show this help

Google Cloud OAuth client redirect URIs:
  Paste mode:  http://localhost:${PORT}${CALLBACK_PATH}
  Listen mode: http://<redirect-host>:${PORT}${CALLBACK_PATH}
`);
}

function parseArgs(argv) {
  const opts = {
    mode: 'paste',
    listenHost: null,
    redirectHost: DEFAULT_TAILSCALE_IP,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') {
      usage();
      process.exit(0);
    } else if (a === '--listen') {
      opts.mode = 'listen';
      opts.listenHost = opts.listenHost || '0.0.0.0';
    } else if (a === '--listen-host') {
      opts.mode = 'listen';
      opts.listenHost = argv[++i];
      if (!opts.listenHost) throw new Error('--listen-host requires an IP');
    } else if (a === '--redirect-host') {
      opts.redirectHost = argv[++i];
      if (!opts.redirectHost) throw new Error('--redirect-host requires a host');
    } else if (a === '--paste' || a === '--paste-code') {
      opts.mode = 'paste';
    } else {
      throw new Error(`Unknown argument: ${a}`);
    }
  }
  return opts;
}

function getMcpRemoteVersion() {
  // Must match ~/.cursor/mcp.json pin (mcp-remote@0.1.38).
  // mcp-remote stores tokens under ~/.mcp-auth/mcp-remote-<version>/
  return '0.1.38';
}

function base64UrlEncode(buffer) {
  return Buffer.from(buffer).toString('base64url');
}

function generatePkce() {
  const codeVerifier = base64UrlEncode(randomBytes(32));
  const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
  return { codeVerifier, codeChallenge };
}

function tryOpenBrowser(url) {
  const tryCmd = (bin, args) =>
    new Promise((resolve) => {
      execFile(bin, args, (err) => resolve(!err));
    });
  return (async () => {
    if (await tryCmd('xdg-open', [url])) return true;
    if (await tryCmd('open', [url])) return true;
    return false;
  })();
}

function extractCode(input) {
  const raw = String(input || '').trim();
  if (!raw) return null;
  if (/^[A-Za-z0-9._\/\-]+$/.test(raw) && !raw.includes('://') && !raw.includes('=')) {
    return raw;
  }
  try {
    const asUrl = raw.includes('://') ? new URL(raw) : new URL(raw, 'http://localhost');
    const fromQuery = asUrl.searchParams.get('code');
    if (fromQuery) return fromQuery;
  } catch {
    // fall through
  }
  const m = raw.match(/[?&#]code=([^&\s#]+)/);
  if (m) return decodeURIComponent(m[1]);
  const m2 = raw.match(/^code=([^&\s#]+)/i);
  if (m2) return decodeURIComponent(m2[1]);
  return null;
}

function promptLine(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function exchangeCode({ code, clientId, clientSecret, redirectUri, codeVerifier }) {
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code_verifier: codeVerifier,
    }),
  });
  const tokens = await tokenRes.json();
  if (!tokenRes.ok) {
    throw new Error(`Token exchange failed: ${JSON.stringify(tokens)}`);
  }
  return tokens;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const mcpRemoteVersion = getMcpRemoteVersion();
  const tokenDir = path.join(os.homedir(), '.mcp-auth', `mcp-remote-${mcpRemoteVersion}`);
  const tokenFile = path.join(tokenDir, `${SERVER_HASH}_tokens.json`);
  const verifierFile = path.join(tokenDir, `${SERVER_HASH}_code_verifier.txt`);

  const client = JSON.parse(await readFile(CLIENT_FILE, 'utf8'));
  const { client_id: clientId, client_secret: clientSecret } = client;
  if (!clientId || !clientSecret) {
    console.error('Missing client_id or client_secret in', CLIENT_FILE);
    process.exit(1);
  }

  const redirectUri =
    opts.mode === 'listen'
      ? `http://${opts.redirectHost}:${PORT}${CALLBACK_PATH}`
      : `http://localhost:${PORT}${CALLBACK_PATH}`;

  const { codeVerifier, codeChallenge } = generatePkce();
  await mkdir(tokenDir, { recursive: true });
  await writeFile(verifierFile, codeVerifier, { mode: 0o600 });

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', SCOPES);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('resource', SERVER_URL);

  console.log('Gmail MCP OAuth — chucky-first');
  console.log('================================');
  console.log('Mode:           ', opts.mode);
  console.log('mcp-remote:     ', mcpRemoteVersion);
  console.log('redirect_uri:   ', redirectUri);
  console.log('Token file:     ', tokenFile);
  console.log('');
  console.log('Runtime note: MCP config + tokens live on chucky.');
  console.log('Mac browser is ONLY for one-time Google consent (optional device).');
  console.log('Ongoing Gmail calls: agent on chucky → mcp-remote → Google. No Mac.');
  console.log('');

  if (opts.mode === 'paste') {
    console.log('Paste-code flow (no ssh -L, no callback server):');
    console.log('  1. Open the URL below in ANY browser (phone/Mac/etc).');
    console.log('  2. Sign in and consent (gmail.readonly + gmail.compose).');
    console.log('  3. Browser redirects to localhost:8787 — page will fail. That is OK.');
    console.log('  4. Copy the FULL address-bar URL (contains ?code=...) and paste here.');
    console.log('');
    console.log('Authorize URL:');
    console.log('');
    console.log(authUrl.toString());
    console.log('');
    await tryOpenBrowser(authUrl.toString());

    const pasted = await promptLine('Paste redirect URL or code, then Enter:\n> ');
    const code = extractCode(pasted);
    if (!code) {
      throw new Error('Could not find authorization code in what you pasted.');
    }
    console.log('Exchanging code for tokens on chucky...');
    const tokens = await exchangeCode({
      code,
      clientId,
      clientSecret,
      redirectUri,
      codeVerifier,
    });
    await writeFile(tokenFile, JSON.stringify(tokens, null, 2), { mode: 0o600 });
    printSuccess(tokenFile);
    return;
  }

  // Listen mode — browser hits chucky (Tailscale/LAN) directly
  console.log('Listen flow (browser → chucky; no ssh -L):');
  console.log(`  Bind: ${opts.listenHost}:${PORT}`);
  console.log('  Ensure Google Cloud OAuth client includes redirect URI:');
  console.log(`    ${redirectUri}`);
  console.log('');
  console.log('1. Starting callback listener...');

  await new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url || '/', `http://${opts.redirectHost}:${PORT}`);
        if (url.pathname !== CALLBACK_PATH) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Not found — expected /oauth/callback');
          return;
        }
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');
        if (error) {
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`<h2>OAuth error: ${error}</h2>`);
          server.close();
          reject(new Error(`OAuth error: ${error}`));
          return;
        }
        if (!code) {
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end('<h2>Missing authorization code</h2>');
          server.close();
          reject(new Error('Missing authorization code'));
          return;
        }

        console.log('3. Received callback — exchanging code for tokens on chucky...');
        const tokens = await exchangeCode({
          code,
          clientId,
          clientSecret,
          redirectUri,
          codeVerifier,
        });
        await writeFile(tokenFile, JSON.stringify(tokens, null, 2), { mode: 0o600 });
        printSuccess(tokenFile);

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(
          '<h2>Gmail connected</h2><p>Tokens saved on chucky. You can close this tab.</p>'
        );
        server.close();
        resolve(undefined);
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<h2>Error</h2><pre>${String(err)}</pre>`);
        server.close();
        reject(err);
      }
    });

    server.listen(PORT, opts.listenHost, async () => {
      console.log(`   Listening on http://${opts.listenHost}:${PORT}${CALLBACK_PATH}`);
      console.log('');
      console.log('2. Open this URL in ANY browser:');
      console.log('');
      console.log(authUrl.toString());
      console.log('');
      const opened = await tryOpenBrowser(authUrl.toString());
      if (!opened) {
        console.log('(No local browser — open the URL from another device on Tailscale/LAN.)');
      }
      console.log('Do NOT close this terminal until you see Success.\n');
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        reject(new Error(`Port ${PORT} is in use. Free it, then retry.`));
      } else {
        reject(err);
      }
    });
  });
}

function printSuccess(tokenFile) {
  console.log('\nSuccess! Tokens saved on chucky:');
  console.log('  ', tokenFile);
  console.log('\nVerify (on chucky):');
  console.log('  export PATH="$HOME/.local/bin:$PATH"');
  console.log('  agent mcp list');
  console.log('  agent mcp list-tools gmail');
  console.log('  agent -p --approve-mcps --trust "Using gmail MCP list_labels pageSize 5; report names only"');
  console.log('\nMac is not required for ongoing email access.');
}

main().catch((err) => {
  console.error('\nError:', err.message || err);
  process.exit(1);
});
