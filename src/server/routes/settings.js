'use strict';

const express = require('express');
const { execFile } = require('child_process');
const { readSettings, writeSettings } = require('../db');

const router = express.Router();

// Strip secrets before sending settings to the browser. Presence is exposed as
// boolean flags so the UI can show "(saved — enter to change)" placeholders.
function redactSettings(s) {
  const out = JSON.parse(JSON.stringify(s || {}));
  if (out.onedrive && typeof out.onedrive === 'object') {
    ['accessToken', 'refreshToken', 'tokenExpiry', 'deviceCode'].forEach((k) => delete out.onedrive[k]);
  }
  if (out.dropbox && typeof out.dropbox === 'object') {
    out.dropbox.hasAppSecret = !!out.dropbox.appSecret;
    ['appSecret', 'accessToken', 'refreshToken', 'tokenExpiry', '_pendingRedirectUri', '_pendingState'].forEach((k) => delete out.dropbox[k]);
  }
  if (Array.isArray(out.registries)) {
    out.registries = out.registries.map((r) => {
      const c = Object.assign({}, r);
      c.hasPassword = !!c.password;
      delete c.password;
      return c;
    });
  }
  return out;
}

// GET /api/settings
router.get('/', (req, res) => {
  res.json(redactSettings(readSettings()));
});

// POST /api/settings
router.post('/', (req, res) => {
  try {
    const existing = readSettings();
    const body = req.body || {};
    const merged = Object.assign({}, existing, body);

    // Deep-merge provider objects so tokens/secrets set by the OAuth flow (and
    // never sent back to the browser) survive partial settings updates.
    if (body.onedrive) merged.onedrive = Object.assign({}, existing.onedrive, body.onedrive);
    if (body.dropbox) {
      merged.dropbox = Object.assign({}, existing.dropbox, body.dropbox);
      if ((body.dropbox.appSecret === undefined || body.dropbox.appSecret === '') && existing.dropbox && existing.dropbox.appSecret) {
        merged.dropbox.appSecret = existing.dropbox.appSecret;
      }
    }

    // Registries: honor the keepPassword flag to preserve a stored secret the
    // browser never received (matched by server + username).
    if (Array.isArray(body.registries)) {
      const prev = Array.isArray(existing.registries) ? existing.registries : [];
      merged.registries = body.registries.map((r) => {
        const out = Object.assign({}, r);
        if (out.keepPassword) {
          const match = prev.find((p) => (p.server || '') === (r.server || '') && (p.username || '') === (r.username || ''));
          if (match && match.password) out.password = match.password;
        }
        delete out.keepPassword;
        return out;
      });
    }

    writeSettings(merged);
    try { require('../backup-scheduler').reschedule(); } catch {}
    try { require('../update-scheduler').reschedule(); } catch {}
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/settings/test-registry — test registry authentication via docker login
router.post('/test-registry', (req, res) => {
  let { server, username, password, useStoredPassword } = req.body || {};
  if (useStoredPassword) {
    const s = readSettings();
    const match = (s.registries || []).find(
      (r) => (r.server || '') === (server || '') && (r.username || '') === (username || '')
    );
    if (match && match.password) password = match.password;
  }
  if (!username || !password) {
    return res.status(400).json({ ok: false, error: 'Username and password are required' });
  }
  // Guard against argument injection — a leading '-' would be parsed as a docker flag.
  if (/^-/.test(username) || (server && /^-/.test(server))) {
    return res.status(400).json({ ok: false, error: 'Invalid username or server' });
  }
  const args = ['login', '--username', username, '--password-stdin'];
  if (server) args.push(server);

  const proc = execFile('docker', args, { timeout: 30000 }, (err, stdout, stderr) => {
    if (err) {
      return res.json({ ok: false, error: (stderr || err.message).trim() });
    }
    res.json({ ok: true, message: (stdout || stderr || 'Login succeeded').trim() });
  });

  if (proc.stdin) {
    proc.stdin.write(password);
    proc.stdin.end();
  }
});

module.exports = router;
module.exports.readSettings = readSettings;
module.exports.writeSettings = writeSettings;
