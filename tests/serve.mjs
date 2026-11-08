// Local static server that behaves like the Netlify host: serves the site root,
// answers unknown paths with 404.html, compresses text, and applies the headers
// declared in the site's _headers file (so tests also catch CSP problems).
// Usage: node serve.mjs [port]
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.argv[2] || process.env.PORT || 4390);
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.webp': 'image/webp', '.avif': 'image/avif', '.jpg': 'image/jpeg', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

// Minimal reader for Netlify's _headers format: a path line, then indented "Name: value" lines.
function headerRules() {
  const file = join(root, '_headers');
  if (!existsSync(file)) return [];
  const rules = [];
  let current = null;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!/^\s/.test(line)) { current = { pattern: line.trim(), headers: {} }; rules.push(current); continue; }
    const i = line.indexOf(':');
    if (current && i > 0) current.headers[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return rules;
}
const matches = (pattern, path) => new RegExp('^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$').test(path);

createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = normalize(join(root, path));
  if (!file.startsWith(root) || file.includes(`${root}/tests`) || file.includes('/.git')) file = '';
  if (file && existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  let status = 200;
  if (!file || !existsSync(file)) { status = 404; file = join(root, '404.html'); }
  const headers = {};
  for (const r of headerRules()) if (matches(r.pattern, path)) Object.assign(headers, r.headers);
  if (!existsSync(file)) { res.writeHead(404, { 'Content-Type': 'text/plain', ...headers }); res.end('Not found'); return; }
  let body = readFileSync(file);
  const type = types[extname(file)] || 'application/octet-stream';
  headers['Content-Type'] = type;
  if (/text|javascript|json|xml|svg/.test(type) && /gzip/.test(req.headers['accept-encoding'] || '')) {
    body = gzipSync(body); headers['Content-Encoding'] = 'gzip';
  }
  res.writeHead(status, headers);
  res.end(body);
}).listen(port, '127.0.0.1', () => console.log(`serving ${root} on http://127.0.0.1:${port}`));
