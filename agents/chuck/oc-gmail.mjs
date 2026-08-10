#!/usr/bin/env node
/**
 * Fast Gmail CLI for OpenClaw on chucky — no Cursor agent loop.
 * Uses OAuth tokens from ~/.mcp-auth/mcp-remote-* (same as gmail-local-mcp).
 *
 * Usage:
 *   oc-gmail labels [--limit N] [--json]
 *   oc-gmail search <query> [--limit N] [--json]
 *   oc-gmail search --multi <term> [term...] [--newer-than 90d] [--limit N] [--json]
 *   oc-gmail payment-check [--property NAME] [--newer-than 90d] [--limit N] [--json]
 *   oc-gmail drafts [--limit N] [--query Q] [--json]
 *   oc-gmail thread <id> [--json]
 *   oc-gmail message <id> [--json]
 *   oc-gmail --help
 */
import { createHash } from 'node:crypto';
import { readFile, writeFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const SERVER_URL = 'https://gmailmcp.googleapis.com/mcp/v1';
const SERVER_HASH = createHash('md5').update(SERVER_URL).digest('hex');
const CLIENT_FILE = path.join(os.homedir(), '.cursor', 'gmail-oauth-client.json');
const GMAIL = 'https://gmail.googleapis.com/gmail/v1';
const AUTH_DIR = path.join(os.homedir(), '.mcp-auth');
const DEFAULT_ALIASES = path.join(
  os.homedir(),
  '.openclaw',
  'workspace',
  'gmail-aliases.json',
);

async function resolveTokenFile() {
  const preferred = path.join(AUTH_DIR, 'mcp-remote-0.1.38', `${SERVER_HASH}_tokens.json`);
  try {
    await readFile(preferred);
    return preferred;
  } catch {
    // fall through
  }
  let entries = [];
  try {
    entries = await readdir(AUTH_DIR, { withFileTypes: true });
  } catch {
    throw new Error(`No MCP auth dir at ${AUTH_DIR}; run gmail-oauth-login.js first`);
  }
  for (const ent of entries) {
    if (!ent.isDirectory() || !ent.name.startsWith('mcp-remote-')) continue;
    const candidate = path.join(AUTH_DIR, ent.name, `${SERVER_HASH}_tokens.json`);
    try {
      await readFile(candidate);
      return candidate;
    } catch {
      // continue
    }
  }
  throw new Error(`Gmail tokens not found under ${AUTH_DIR}; run gmail-oauth-login.js`);
}

async function loadTokens(tokenFile) {
  return JSON.parse(await readFile(tokenFile, 'utf8'));
}

async function saveTokens(tokenFile, tokens) {
  await writeFile(tokenFile, JSON.stringify(tokens, null, 2), { mode: 0o600 });
}

async function refreshTokens(tokenFile, tokens) {
  const client = JSON.parse(await readFile(CLIENT_FILE, 'utf8'));
  const body = new URLSearchParams({
    client_id: client.client_id,
    client_secret: client.client_secret,
    refresh_token: tokens.refresh_token,
    grant_type: 'refresh_token',
  });
  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(`token refresh failed: ${data.error || resp.status}`);
  const next = {
    ...tokens,
    access_token: data.access_token,
    expires_in: data.expires_in,
    scope: data.scope || tokens.scope,
    token_type: data.token_type || tokens.token_type,
  };
  if (data.refresh_token) next.refresh_token = data.refresh_token;
  await saveTokens(tokenFile, next);
  return next;
}

async function gmailFetch(tokenFile, pathname, { query, method = 'GET', body } = {}) {
  let tokens = await loadTokens(tokenFile);
  const url = new URL(`${GMAIL}${pathname}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === '') continue;
      if (Array.isArray(v)) {
        for (const item of v) url.searchParams.append(k, String(item));
      } else {
        url.searchParams.set(k, String(v));
      }
    }
  }
  const doReq = async (access) => {
    const resp = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${access}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await resp.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { raw: text };
    }
    return { resp, json };
  };
  let { resp, json } = await doReq(tokens.access_token);
  if (resp.status === 401 && tokens.refresh_token) {
    tokens = await refreshTokens(tokenFile, tokens);
    ({ resp, json } = await doReq(tokens.access_token));
  }
  if (!resp.ok) {
    const msg = json?.error?.message || json?.error || `HTTP ${resp.status}`;
    throw new Error(String(msg));
  }
  return json;
}

function headerMap(payloadHeaders = []) {
  const out = {};
  for (const h of payloadHeaders) {
    if (h?.name) out[h.name.toLowerCase()] = h.value || '';
  }
  return out;
}

function usage() {
  console.log(`oc-gmail — fast Gmail REST CLI (no Cursor agent)

Usage:
  oc-gmail labels [--limit N] [--json]
  oc-gmail search <query> [--limit N] [--json]
  oc-gmail search --multi <term> [term...] [--newer-than 90d] [--limit N] [--json]
  oc-gmail payment-check [--property NAME] [--newer-than 90d] [--limit N] [--json]
  oc-gmail drafts [--limit N] [--query Q] [--json]
  oc-gmail thread <id> [--json]
  oc-gmail message <id> [--json]

Examples:
  oc-gmail labels --limit 5
  oc-gmail search "newer_than:2d is:unread" --limit 5
  oc-gmail search --multi entreverde tocancipa --newer-than 90d
  oc-gmail payment-check --property Entreverde
  oc-gmail drafts --limit 5

Aliases (non-secret): ~/.openclaw/workspace/gmail-aliases.json
`);
}

function parseArgs(argv) {
  const args = [...argv];
  const flags = {
    json: false,
    limit: null,
    query: null,
    multi: false,
    newerThan: null,
    property: null,
    aliases: null,
  };
  const positional = [];
  while (args.length) {
    const a = args.shift();
    if (a === '--help' || a === '-h') return { cmd: 'help', flags, positional };
    if (a === '--json') flags.json = true;
    else if (a === '--multi') flags.multi = true;
    else if (a === '--limit') flags.limit = Number(args.shift());
    else if (a === '--query' || a === '-q') flags.query = args.shift();
    else if (a === '--newer-than') flags.newerThan = args.shift();
    else if (a === '--property') flags.property = args.shift();
    else if (a === '--aliases') flags.aliases = args.shift();
    else if (a.startsWith('--limit=')) flags.limit = Number(a.slice('--limit='.length));
    else if (a.startsWith('--query=')) flags.query = a.slice('--query='.length);
    else if (a.startsWith('--newer-than=')) flags.newerThan = a.slice('--newer-than='.length);
    else if (a.startsWith('--property=')) flags.property = a.slice('--property='.length);
    else if (a.startsWith('--aliases=')) flags.aliases = a.slice('--aliases='.length);
    else positional.push(a);
  }
  let cmd = (positional[0] || '').toLowerCase();
  // Compat: freeform prompts from older OpenClaw instructions
  if (!['labels', 'search', 'drafts', 'thread', 'message', 'help', 'payment-check'].includes(cmd)) {
    const joined = positional.join(' ').toLowerCase();
    if (!joined || joined.includes('list_labels') || joined.includes('labels')) {
      cmd = 'labels';
      if (!flags.limit) {
        const m = joined.match(/pagesize\s+(\d+)/i) || joined.match(/limit\s+(\d+)/i);
        if (m) flags.limit = Number(m[1]);
      }
      if (!flags.limit) flags.limit = 10;
    } else if (joined.includes('draft')) {
      cmd = 'drafts';
    } else if (joined.includes('search') || joined.includes('unread') || joined.includes('newer_than')) {
      cmd = 'search';
      const qm = positional.join(' ').match(/["']([^"']+)["']/);
      flags.query = flags.query || (qm ? qm[1] : 'newer_than:7d');
    } else {
      cmd = 'help';
    }
    return { cmd, flags, positional: [] };
  }
  return { cmd, flags, positional: positional.slice(1) };
}

function printJsonOrText(flags, obj, textFn) {
  if (flags.json) {
    console.log(JSON.stringify(obj, null, 2));
  } else {
    console.log(textFn(obj));
  }
}

function formatThreadLines(threads, startIndex = 1) {
  if (!threads.length) return '';
  return threads
    .map(
      (t, i) =>
        `${startIndex + i}. ${t.subject || '(no subject)'}\n   From: ${t.from}\n   Date: ${t.date}\n   id: ${t.id}`,
    )
    .join('\n\n');
}

async function searchThreads(tokenFile, q, limit) {
  const list = await gmailFetch(tokenFile, '/users/me/threads', {
    query: { q, maxResults: limit },
  });
  const threads = [];
  for (const t of list.threads || []) {
    const full = await gmailFetch(tokenFile, `/users/me/threads/${encodeURIComponent(t.id)}`, {
      query: { format: 'metadata', metadataHeaders: ['From', 'To', 'Subject', 'Date'] },
    });
    const msg = (full.messages || [])[0];
    const headers = headerMap(msg?.payload?.headers);
    threads.push({
      id: t.id,
      from: headers.from || '',
      subject: headers.subject || '',
      date: headers.date || '',
      messageCount: (full.messages || []).length,
    });
  }
  return {
    query: q,
    resultSizeEstimate: list.resultSizeEstimate || 0,
    threads,
  };
}

async function cmdLabels(tokenFile, flags) {
  const data = await gmailFetch(tokenFile, '/users/me/labels');
  let labels = data.labels || [];
  if (flags.limit) labels = labels.slice(0, flags.limit);
  const slim = labels.map((l) => ({ id: l.id, name: l.name, type: l.type }));
  printJsonOrText(flags, { labels: slim }, (o) =>
    o.labels.map((l) => l.name).join('\n') || '(no labels)');
}

async function cmdSearch(tokenFile, flags, positional) {
  const limit = flags.limit || 10;
  if (flags.multi) {
    const terms = positional.filter(Boolean);
    if (!terms.length) throw new Error('search --multi requires at least one term');
    const newer = flags.newerThan || '90d';
    const results = [];
    for (const term of terms) {
      const q = `${term} newer_than:${newer}`;
      results.push(await searchThreads(tokenFile, q, limit));
    }
    printJsonOrText(flags, { mode: 'multi', newerThan: newer, results }, (o) => {
      return o.results
        .map((r) => {
          const body = r.threads.length
            ? formatThreadLines(r.threads)
            : `(no threads for q=${JSON.stringify(r.query)})`;
          return `## q=${JSON.stringify(r.query)}\n${body}`;
        })
        .join('\n\n');
    });
    return;
  }

  const q = flags.query || positional.join(' ');
  if (!q) throw new Error('search requires a query, e.g. oc-gmail search "newer_than:2d"');
  const result = await searchThreads(tokenFile, q, limit);
  printJsonOrText(flags, result, (o) => {
    if (!o.threads.length) return `(no threads for q=${JSON.stringify(o.query)})`;
    return formatThreadLines(o.threads);
  });
}

async function loadAliases(aliasesPath) {
  const candidates = [
    aliasesPath,
    process.env.OC_GMAIL_ALIASES,
    DEFAULT_ALIASES,
    path.join(process.cwd(), 'gmail-aliases.json'),
  ].filter(Boolean);

  let lastErr = null;
  for (const p of candidates) {
    try {
      await access(p);
      const data = JSON.parse(await readFile(p, 'utf8'));
      return { path: p, data };
    } catch (err) {
      lastErr = err;
    }
  }
  throw new Error(
    `gmail-aliases.json not found (tried ${candidates.join(', ')})${lastErr ? `: ${lastErr.message}` : ''}`,
  );
}

function matchProperty(properties, name) {
  if (!name) return properties;
  const needle = name.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  const matched = properties.filter((p) => {
    const hay = String(p.name || '')
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase();
    return hay.includes(needle) || needle.includes(hay);
  });
  if (!matched.length) {
    const names = properties.map((p) => p.name).join(', ');
    throw new Error(`No property matched "${name}". Known: ${names || '(none)'}`);
  }
  return matched;
}

function buildPaymentQueries(property, paymentHints, newerThan) {
  const queries = [];
  const seen = new Set();
  const add = (q) => {
    const key = q.trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    queries.push(q);
  };
  const quoteTerm = (t) => {
    const s = String(t).trim();
    if (!s) return '';
    return /\s/.test(s) ? `"${s}"` : s;
  };
  const orGroup = (items) => {
    const parts = items.map(quoteTerm).filter(Boolean);
    if (!parts.length) return '';
    if (parts.length === 1) return parts[0];
    return `(${parts.join(' OR ')})`;
  };

  const terms = (property.queries || []).map((t) => String(t).trim()).filter(Boolean);
  const hints = (paymentHints || []).map((t) => String(t).trim()).filter(Boolean);
  // Keep "administracion" in hints but avoid duplicating it as a standalone broad OR
  // that collides with property admin phrases — prefer property+hint combos.
  const termOr = orGroup(terms);
  const hintOr = orGroup(hints);
  const adminOr = '(administracion OR administración OR admin)';

  // Prefer payment/admin-relevant queries first (less noise than bare property name).
  if (termOr && hintOr) add(`${termOr} ${hintOr} newer_than:${newerThan}`);
  if (termOr) add(`${termOr} ${adminOr} newer_than:${newerThan}`);
  for (const term of terms) {
    const qt = quoteTerm(term);
    if (hintOr) add(`${qt} ${hintOr} newer_than:${newerThan}`);
    add(`${qt} ${adminOr} newer_than:${newerThan}`);
  }
  // Broad fallback last
  for (const term of terms) add(`${quoteTerm(term)} newer_than:${newerThan}`);
  if (termOr) add(`${termOr} newer_than:${newerThan}`);

  return queries;
}

async function cmdPaymentCheck(tokenFile, flags) {
  const { path: aliasesPath, data } = await loadAliases(flags.aliases);
  const properties = matchProperty(data.properties || [], flags.property);
  const paymentHints = data.paymentHints || [
    'pago',
    'pagado',
    'factura',
    'recibo',
    'administracion',
    'cuota',
  ];
  const primaryWindow = flags.newerThan || '90d';
  const broadenWindow = primaryWindow === '365d' ? null : '365d';
  const limit = flags.limit || 5;

  const propertyResults = [];
  for (const property of properties) {
    const windows = [primaryWindow, ...(broadenWindow ? [broadenWindow] : [])];
    let chosen = null;
    const attempts = [];

    for (const window of windows) {
      const queries = buildPaymentQueries(property, paymentHints, window);
      // Payment/admin-relevant queries first; bare property name last.
      const hits = [];
      let totalEstimate = 0;
      for (const q of queries) {
        const result = await searchThreads(tokenFile, q, limit);
        attempts.push({ query: q, count: result.threads.length, estimate: result.resultSizeEstimate });
        if (result.threads.length) {
          hits.push(result);
          totalEstimate += result.resultSizeEstimate || 0;
        }
        // Enough signal from this window — stop expanding combos
        if (hits.reduce((n, r) => n + r.threads.length, 0) >= limit) break;
      }

      if (hits.length) {
        // Dedupe threads across queries
        const byId = new Map();
        for (const r of hits) {
          for (const t of r.threads) {
            if (!byId.has(t.id)) byId.set(t.id, { ...t, matchedQuery: r.query });
          }
        }
        chosen = {
          property: property.name,
          newerThan: window,
          broadened: window !== primaryWindow,
          queriesTried: attempts.length,
          resultSizeEstimate: totalEstimate,
          threads: [...byId.values()].slice(0, limit),
        };
        break;
      }
    }

    propertyResults.push(
      chosen || {
        property: property.name,
        newerThan: primaryWindow,
        broadened: Boolean(broadenWindow),
        queriesTried: attempts.length,
        resultSizeEstimate: 0,
        threads: [],
        attempts: attempts.map((a) => a.query),
      },
    );
  }

  const out = {
    aliasesPath,
    paymentHints,
    results: propertyResults,
  };

  printJsonOrText(flags, out, (o) => {
    return o.results
      .map((r) => {
        const header = `## ${r.property} (newer_than:${r.newerThan}${r.broadened && r.newerThan !== primaryWindow ? ', broadened' : ''})`;
        if (!r.threads.length) {
          return `${header}\n(no threads — tried ${r.queriesTried} queries; broaden terms in gmail-aliases.json / USER.md)`;
        }
        const lines = r.threads.map(
          (t, i) =>
            `${i + 1}. ${t.subject || '(no subject)'}\n   From: ${t.from}\n   Date: ${t.date}\n   id: ${t.id}`,
        );
        return `${header}\n${lines.join('\n\n')}`;
      })
      .join('\n\n');
  });
}

async function cmdDrafts(tokenFile, flags) {
  const limit = flags.limit || 10;
  const data = await gmailFetch(tokenFile, '/users/me/drafts', {
    query: { maxResults: limit, q: flags.query || undefined },
  });
  const drafts = [];
  for (const d of data.drafts || []) {
    const msgId = d.message?.id;
    let headers = {};
    if (msgId) {
      const msg = await gmailFetch(tokenFile, `/users/me/messages/${encodeURIComponent(msgId)}`, {
        query: { format: 'metadata', metadataHeaders: ['From', 'To', 'Subject', 'Date'] },
      });
      headers = headerMap(msg?.payload?.headers);
    }
    drafts.push({
      id: d.id,
      messageId: msgId,
      to: headers.to || '',
      subject: headers.subject || '',
      date: headers.date || '',
    });
  }
  printJsonOrText(flags, { drafts, resultSizeEstimate: data.resultSizeEstimate }, (o) => {
    if (!o.drafts.length) return '(no drafts)';
    return o.drafts
      .map(
        (d, i) =>
          `${i + 1}. ${d.subject || '(no subject)'}\n   To: ${d.to}\n   draft: ${d.id}`,
      )
      .join('\n\n');
  });
}

async function cmdThread(tokenFile, flags, positional) {
  const id = positional[0];
  if (!id) throw new Error('thread requires an id');
  const full = await gmailFetch(tokenFile, `/users/me/threads/${encodeURIComponent(id)}`, {
    query: { format: 'metadata', metadataHeaders: ['From', 'To', 'Subject', 'Date'] },
  });
  printJsonOrText(flags, full, (o) => {
    const lines = [`thread ${o.id}`, `messages: ${(o.messages || []).length}`, ''];
    for (const m of o.messages || []) {
      const h = headerMap(m.payload?.headers);
      lines.push(`- ${h.date || ''} | ${h.from || ''} | ${h.subject || ''}`);
      lines.push(`  id=${m.id}`);
    }
    return lines.join('\n');
  });
}

async function cmdMessage(tokenFile, flags, positional) {
  const id = positional[0];
  if (!id) throw new Error('message requires an id');
  const msg = await gmailFetch(tokenFile, `/users/me/messages/${encodeURIComponent(id)}`, {
    query: { format: 'full' },
  });
  printJsonOrText(flags, msg, (o) => {
    const h = headerMap(o.payload?.headers);
    return [
      `id: ${o.id}`,
      `thread: ${o.threadId}`,
      `From: ${h.from || ''}`,
      `To: ${h.to || ''}`,
      `Subject: ${h.subject || ''}`,
      `Date: ${h.date || ''}`,
      '',
      o.snippet || '',
    ].join('\n');
  });
}

async function main() {
  const { cmd, flags, positional } = parseArgs(process.argv.slice(2));
  if (cmd === 'help') {
    usage();
    process.exit(0);
  }
  const tokenFile = await resolveTokenFile();
  switch (cmd) {
    case 'labels':
      await cmdLabels(tokenFile, flags);
      break;
    case 'search':
      await cmdSearch(tokenFile, flags, positional);
      break;
    case 'payment-check':
      await cmdPaymentCheck(tokenFile, flags);
      break;
    case 'drafts':
      await cmdDrafts(tokenFile, flags);
      break;
    case 'thread':
      await cmdThread(tokenFile, flags, positional);
      break;
    case 'message':
      await cmdMessage(tokenFile, flags, positional);
      break;
    default:
      usage();
      process.exit(2);
  }
}

main().catch((err) => {
  console.error(`oc-gmail error: ${err.message || err}`);
  process.exit(1);
});
