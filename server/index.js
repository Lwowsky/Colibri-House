import 'dotenv/config';
import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT || 3000);
const CONTENT_DIR = (process.env.CONTENT_DIR || 'content').replace(/^\/+|\/+$/g, '');
const COOKIE_NAME = 'colibri_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 12;
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_ORIGINS = String(process.env.ADMIN_ALLOWED_ORIGIN || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '12mb' }));
app.use((req, res, next) => {
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  next();
});
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  }
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

function getConfig() {
  return {
    adminUsername: requiredEnv('ADMIN_USERNAME'),
    adminPasswordHash: requiredEnv('ADMIN_PASSWORD_HASH'),
    sessionSecret: requiredEnv('ADMIN_SESSION_SECRET'),
    githubToken: requiredEnv('GITHUB_TOKEN'),
    repoOwner: requiredEnv('GITHUB_REPO_OWNER'),
    repoName: requiredEnv('GITHUB_REPO_NAME'),
    repoBranch: process.env.GITHUB_REPO_BRANCH || 'main',
  };
}

function parseCookies(header = '') {
  const result = {};
  for (const part of header.split(/;\s*/)) {
    if (!part) continue;
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = decodeURIComponent(part.slice(0, idx));
    const value = decodeURIComponent(part.slice(idx + 1));
    result[key] = value;
  }
  return result;
}

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64url(input) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + padding, 'base64').toString('utf8');
}

function sign(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

function makeSessionCookie(username, secret) {
  const payload = base64url(JSON.stringify({ u: username, exp: Date.now() + SESSION_TTL_SECONDS * 1000 }));
  const signature = sign(payload, secret);
  return `${payload}.${signature}`;
}

function verifySessionCookie(cookieValue, secret) {
  if (!cookieValue || !cookieValue.includes('.')) return null;
  const [payload, receivedSig] = cookieValue.split('.');
  const expectedSig = sign(payload, secret);
  const a = Buffer.from(receivedSig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  let parsed;
  try {
    parsed = JSON.parse(fromBase64url(payload));
  } catch {
    return null;
  }
  if (!parsed?.u || !parsed?.exp || parsed.exp < Date.now()) return null;
  return parsed;
}

function getBearerToken(req) {
  const header = String(req.headers.authorization || '');
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

function resolveSession(req, secret) {
  const bearer = getBearerToken(req);
  if (bearer) {
    const session = verifySessionCookie(bearer, secret);
    if (session) return session;
  }
  const cookies = parseCookies(req.headers.cookie || '');
  return verifySessionCookie(cookies[COOKIE_NAME], secret);
}

function setSession(res, username, secret, secure) {
  const token = makeSessionCookie(username, secret);
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${SESSION_TTL_SECONDS}`,
  ];
  if (secure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearSession(res, secure) {
  const parts = [
    `${COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    'Max-Age=0',
  ];
  if (secure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

function isSecureRequest(req) {
  return req.secure || req.headers['x-forwarded-proto'] === 'https';
}

async function hashPassword(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey.toString('hex'));
    });
  });
}

async function verifyPassword(password, storedValue) {
  const [scheme, salt, hash] = String(storedValue || '').split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const computed = await hashPassword(password, salt);
  const a = Buffer.from(computed, 'hex');
  const b = Buffer.from(hash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function requireAuth(req, res, next) {
  let config;
  try {
    config = getConfig();
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
    return;
  }
  const session = resolveSession(req, config.sessionSecret);
  if (!session || session.u !== config.adminUsername) {
    res.status(401).json({ ok: false, error: 'Unauthorized' });
    return;
  }
  req.adminUser = session.u;
  req.config = config;
  next();
}

async function githubRequest(config, apiPath, init = {}) {
  const res = await fetch(`https://api.github.com${apiPath}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${config.githubToken}`,
      'User-Agent': 'colibri-house-admin',
      ...(init.headers || {}),
    },
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message = typeof data === 'object' && data?.message ? data.message : `GitHub request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

function repoPrefix(config) {
  return `/repos/${encodeURIComponent(config.repoOwner)}/${encodeURIComponent(config.repoName)}`;
}

function joinRepoPath(...parts) {
  return parts
    .filter(Boolean)
    .join('/')
    .replace(/^\/+/, '')
    .replace(/\/+/g, '/');
}

function decodeGitHubContent(content) {
  return Buffer.from(String(content || '').replace(/\n/g, ''), 'base64').toString('utf8');
}

async function loadJsonFromGithub(config, repoPath) {
  const data = await githubRequest(
    config,
    `${repoPrefix(config)}/contents/${repoPath}?ref=${encodeURIComponent(config.repoBranch)}`,
  );
  return JSON.parse(decodeGitHubContent(data.content));
}

async function getCurrentCommitAndTree(config) {
  const ref = await githubRequest(
    config,
    `${repoPrefix(config)}/git/ref/heads/${encodeURIComponent(config.repoBranch)}`,
  );
  const commitSha = ref?.object?.sha;
  const commit = await githubRequest(config, `${repoPrefix(config)}/git/commits/${commitSha}`);
  return { commitSha, treeSha: commit.tree.sha };
}

async function createBlob(config, content) {
  const blob = await githubRequest(config, `${repoPrefix(config)}/git/blobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, encoding: 'utf-8' }),
  });
  return blob.sha;
}

async function commitFiles(config, files, message) {
  const { commitSha, treeSha } = await getCurrentCommitAndTree(config);
  const tree = [];
  for (const file of files) {
    const blobSha = await createBlob(config, file.content);
    tree.push({ path: file.path, mode: '100644', type: 'blob', sha: blobSha });
  }

  const newTree = await githubRequest(config, `${repoPrefix(config)}/git/trees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base_tree: treeSha, tree }),
  });

  const commit = await githubRequest(config, `${repoPrefix(config)}/git/commits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, tree: newTree.sha, parents: [commitSha] }),
  });

  await githubRequest(config, `${repoPrefix(config)}/git/refs/heads/${encodeURIComponent(config.repoBranch)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sha: commit.sha, force: false }),
  });

  return commit.sha;
}

function safeImageFilename(filename) {
  const ext = path.extname(filename || '').toLowerCase();
  const base = path.basename(filename || 'image', ext).toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'image';
  const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.jpg';
  return `${base}-${Date.now()}${safeExt}`;
}

async function uploadImageToGithub(config, { base64, filename, folder, commitMessage }) {
  const filePath = joinRepoPath(CONTENT_DIR, 'uploads', folder || 'menu', safeImageFilename(filename));
  const body = {
    message: commitMessage || `admin: upload ${path.basename(filePath)}`,
    content: base64,
    branch: config.repoBranch,
  };

  await githubRequest(config, `${repoPrefix(config)}/contents/${filePath}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return `/${filePath}`;
}

function assertJsonObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
}

function assertJsonArray(value, label) {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array.`);
}

app.get('/api/admin/session', (req, res) => {
  try {
    const config = getConfig();
    const session = resolveSession(req, config.sessionSecret);
    res.json({ authenticated: !!session && session.u === config.adminUsername, username: session?.u || null });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post('/api/admin/login', async (req, res) => {
  try {
    const config = getConfig();
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '');
    const usernameBuf = Buffer.from(username);
    const expectedUserBuf = Buffer.from(config.adminUsername);
    const userOk = usernameBuf.length === expectedUserBuf.length && crypto.timingSafeEqual(usernameBuf, expectedUserBuf);
    const passOk = await verifyPassword(password, config.adminPasswordHash);
    if (!userOk || !passOk) {
      res.status(401).json({ ok: false, error: 'Невірний логін або пароль.' });
      return;
    }
    const token = makeSessionCookie(username, config.sessionSecret);
    setSession(res, username, config.sessionSecret, isSecureRequest(req));
    res.json({ ok: true, username, token });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post('/api/admin/logout', (req, res) => {
  clearSession(res, isSecureRequest(req));
  res.json({ ok: true });
});

app.get('/api/admin/content', requireAuth, async (req, res) => {
  try {
    const { config } = req;
    const [site, categories, menu] = await Promise.all([
      loadJsonFromGithub(config, joinRepoPath(CONTENT_DIR, 'site.json')),
      loadJsonFromGithub(config, joinRepoPath(CONTENT_DIR, 'categories.json')),
      loadJsonFromGithub(config, joinRepoPath(CONTENT_DIR, 'menu.json')),
    ]);
    res.json({ ok: true, site, categories, menu });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post('/api/admin/save', requireAuth, async (req, res) => {
  try {
    assertJsonObject(req.body?.site, 'site');
    assertJsonArray(req.body?.categories, 'categories');
    assertJsonArray(req.body?.menu, 'menu');

    const files = [
      { path: joinRepoPath(CONTENT_DIR, 'site.json'), content: JSON.stringify(req.body.site, null, 2) + '\n' },
      { path: joinRepoPath(CONTENT_DIR, 'categories.json'), content: JSON.stringify(req.body.categories, null, 2) + '\n' },
      { path: joinRepoPath(CONTENT_DIR, 'menu.json'), content: JSON.stringify(req.body.menu, null, 2) + '\n' },
    ];

    const commitSha = await commitFiles(req.config, files, String(req.body?.commitMessage || 'admin: update content').trim() || 'admin: update content');
    res.json({ ok: true, commitSha });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post('/api/admin/upload-image', requireAuth, async (req, res) => {
  try {
    const base64 = String(req.body?.base64 || '').trim();
    const filename = String(req.body?.filename || 'image.jpg');
    const contentType = String(req.body?.contentType || '');
    const folder = String(req.body?.folder || 'menu').replace(/[^a-z0-9/_-]/gi, '');
    if (!contentType.startsWith('image/')) throw new Error('Тільки зображення дозволені.');
    if (!base64) throw new Error('Порожній файл.');
    const size = Buffer.byteLength(base64, 'base64');
    if (size > MAX_UPLOAD_BYTES) throw new Error('Файл завеликий. Максимум 8MB.');

    const publicPath = await uploadImageToGithub(req.config, {
      base64,
      filename,
      folder,
      commitMessage: String(req.body?.commitMessage || '').trim(),
    });
    res.json({ ok: true, path: publicPath });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get('/api/admin/health', async (_req, res) => {
  try {
    const config = getConfig();
    res.json({ ok: true, repo: `${config.repoOwner}/${config.repoName}`, branch: config.repoBranch });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get('/admin', (_req, res) => {
  res.redirect(302, '/admin/');
});
app.get('/admin/', (_req, res) => {
  res.sendFile(path.join(ROOT, 'admin', 'index.html'));
});
app.use(express.static(ROOT, { extensions: ['html'] }));

app.use(async (req, res) => {
  try {
    const html = await fs.readFile(path.join(ROOT, 'index.html'), 'utf8');
    res.status(404).type('html').send(html);
  } catch {
    res.status(404).type('text').send('Not found');
  }
});

app.listen(PORT, () => {
  console.log(`Colibri House running on http://localhost:${PORT}`);
});
