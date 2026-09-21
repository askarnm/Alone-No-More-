// Alone No More — backend server
// Handles: user registration, login, contact messages, and a simple admin view.

const path = require('path');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const Database = require('better-sqlite3');

const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-this-secret-before-deploying';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme123';

const app = express();
const db = new Database(path.join(__dirname, 'data.sqlite'));

// ---------- Database setup ----------
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    message TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// ---------- Middleware ----------
app.use(cors());
app.use(express.json());
app.use(
  cookieSession({
    name: 'session',
    keys: [SESSION_SECRET],
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  })
);
app.use(express.static(path.join(__dirname, '..', 'frontend')));

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');
}

// ---------- Auth routes ----------

// Register a new customer account
app.post('/api/register', (req, res) => {
  const { name, email, phone, password } = req.body || {};

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: 'Please fill in every field.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'That email address doesn\'t look right.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password should be at least 6 characters.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'An account with that email already exists.' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare('INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)')
    .run(name.trim(), email.toLowerCase().trim(), phone.trim(), passwordHash);

  req.session.userId = info.lastInsertRowid;
  res.json({ ok: true, name: name.trim() });
});

// Log in an existing customer
app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter your email and password.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  }

  req.session.userId = user.id;
  res.json({ ok: true, name: user.name });
});

// Log out
app.post('/api/logout', (req, res) => {
  req.session = null;
  res.json({ ok: true });
});

// Who's currently logged in (used by the frontend to greet the visitor)
app.get('/api/me', (req, res) => {
  if (!req.session || !req.session.userId) return res.json({ loggedIn: false });
  const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(req.session.userId);
  if (!user) return res.json({ loggedIn: false });
  res.json({ loggedIn: true, user });
});

// ---------- Contact route ----------
app.post('/api/contact', (req, res) => {
  const { name, phone, message } = req.body || {};
  if (!name || !phone) {
    return res.status(400).json({ error: 'Please add your name and phone number.' });
  }
  db.prepare('INSERT INTO messages (name, phone, message) VALUES (?, ?, ?)').run(
    name.trim(),
    phone.trim(),
    (message || '').trim()
  );
  res.json({ ok: true });
});

// ---------- Admin routes (for the site owner) ----------

// Simple password check — sets an admin flag on the session
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body || {};
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Wrong admin password.' });
  }
  req.session.isAdmin = true;
  res.json({ ok: true });
});

function requireAdmin(req, res, next) {
  if (!req.session || !req.session.isAdmin) {
    return res.status(401).json({ error: 'Admin login required.' });
  }
  next();
}

// Everything the owner needs to see: registered customers + contact messages
app.get('/api/admin/data', requireAdmin, (req, res) => {
  const users = db.prepare('SELECT id, name, email, phone, created_at FROM users ORDER BY created_at DESC').all();
  const messages = db.prepare('SELECT id, name, phone, message, created_at FROM messages ORDER BY created_at DESC').all();
  res.json({ users, messages });
});

app.listen(PORT, () => {
  console.log(`Alone No More server running on http://localhost:${PORT}`);
});
