// AVENA server: serves /public and stores bookings and contact messages. No npm packages needed.
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const TYPES = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.ico': 'image/x-icon'
};
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Each API route: where to store records, how to validate, which fields to keep
const ROUTES = {
  '/api/reservations': {
    store: path.join(__dirname, 'data', 'reservations.json'),
    validate(b) {
      const today = new Date().toISOString().slice(0, 10);
      if (!b.name || b.name.trim().length < 2) return 'Enter your name.';
      if (!EMAIL.test(b.email || '')) return 'Enter a valid email address.';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date || '') || b.date < today) return 'Choose today or a later date.';
      if (!/^\d{2}:\d{2}$/.test(b.time || '')) return 'Choose a time.';
      const g = Number(b.guests);
      if (!Number.isInteger(g) || g < 1 || g > 12) return 'We seat 1 to 12 guests online.';
      return null;
    },
    pick: b => ({ name: b.name.trim(), email: b.email.trim(), date: b.date, time: b.time, guests: Number(b.guests), notes: String(b.notes || '').slice(0, 500) })
  },
  '/api/messages': {
    store: path.join(__dirname, 'data', 'messages.json'),
    validate(b) {
      if (!b.name || b.name.trim().length < 2) return 'Enter your name.';
      if (!EMAIL.test(b.email || '')) return 'Enter a valid email address.';
      if (!b.message || b.message.trim().length < 10) return 'Write a message of at least 10 characters.';
      return null;
    },
    pick: b => ({ name: b.name.trim(), email: b.email.trim(), message: String(b.message).trim().slice(0, 1000) })
  }
};

function send(res, code, body, type = 'application/json') {
  res.writeHead(code, { 'Content-Type': type + '; charset=utf-8' });
  res.end(Buffer.isBuffer(body) || typeof body === 'string' ? body : JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 1e5) { reject(new Error('Body too large')); req.destroy(); }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const route = ROUTES[url.pathname];

  if (req.method === 'POST' && route) {
    try {
      const body = JSON.parse(await readBody(req));
      const error = route.validate(body);
      if (error) return send(res, 400, { error });
      fs.mkdirSync(path.dirname(route.store), { recursive: true });
      const list = fs.existsSync(route.store) ? JSON.parse(fs.readFileSync(route.store, 'utf8')) : [];
      list.push({ id: Date.now(), ...route.pick(body), createdAt: new Date().toISOString() });
      fs.writeFileSync(route.store, JSON.stringify(list, null, 2));
      return send(res, 201, { ok: true });
    } catch {
      return send(res, 400, { error: 'We could not read that request. Try again.' });
    }
  }

  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });

  const requested = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
  const file = path.normalize(path.join(PUBLIC_DIR, requested));
  if (!file.startsWith(PUBLIC_DIR) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    return send(res, 404, 'Page not found', 'text/plain');
  }
  send(res, 200, fs.readFileSync(file), TYPES[path.extname(file)] || 'application/octet-stream');
});

server.listen(PORT, () => console.log(`AVENA is running at http://localhost:${PORT}`));
