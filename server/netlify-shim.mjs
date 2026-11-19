// Runs the Netlify functions in netlify/functions/ on the VPS. On Netlify each
// file was its own function behind /api/<name> (netlify.toml); here one small
// Node process loads them all and turns each request into the `event` object
// they expect, then their { statusCode, headers, body } back into a response.
// nginx serves the built site and proxies /api/* here (deploy/vps/nginx.conf).
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'netlify', 'functions');
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 4425);
const MAX_BODY = 1024 * 1024;

const handlers = new Map();
for (const file of fs.readdirSync(DIR)) {
  if (!file.endsWith('.js')) continue;
  const mod = require(path.join(DIR, file));
  if (typeof mod.handler === 'function') handlers.set(file.slice(0, -3), mod.handler);
}

const readBody = (req) => new Promise((resolve, reject) => {
  if (req.method === 'GET' || req.method === 'HEAD') return resolve(null);
  let size = 0;
  const chunks = [];
  req.on('data', (c) => {
    size += c.length;
    if (size > MAX_BODY) { reject(Object.assign(new Error('Body too large'), { status: 413 })); req.destroy(); return; }
    chunks.push(c);
  });
  req.on('end', () => resolve(chunks.length ? Buffer.concat(chunks).toString('utf8') : null));
  req.on('error', reject);
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const m = url.pathname.match(/^\/(?:api|\.netlify\/functions)\/([a-z0-9-]+)\/?$/);
  const handler = m && handlers.get(m[1]);
  if (!handler) { res.writeHead(404, { 'Content-Type': 'application/json' }); return res.end('{"error":"Not found"}'); }
  try {
    const event = {
      httpMethod: req.method,
      path: url.pathname,
      rawUrl: `https://${req.headers.host || 'localhost'}${req.url}`,
      headers: req.headers,
      queryStringParameters: Object.fromEntries(url.searchParams),
      body: await readBody(req),
      isBase64Encoded: false,
    };
    const out = (await handler(event, {})) || {};
    const headers = { ...(out.headers || {}) };
    let body = out.body ?? '';
    if (out.isBase64Encoded) body = Buffer.from(String(body), 'base64');
    if (!Object.keys(headers).some((h) => h.toLowerCase() === 'content-type')) headers['Content-Type'] = 'application/json; charset=utf-8';
    res.writeHead(out.statusCode || 200, headers);
    res.end(body);
  } catch (error) {
    console.error(`/api/${m[1]}:`, error);
    if (!res.headersSent) res.writeHead(error.status || 500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.status ? error.message : 'Internal error' }));
  }
});

server.listen(PORT, HOST, () => console.log(`americaecon functions on http://${HOST}:${PORT} (${[...handlers.keys()].join(', ')})`));
