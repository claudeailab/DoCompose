'use strict';

const express = require('express');
const fs = require('fs');
const crypto = require('crypto');
const router = express.Router();

const API = 'https://api.dropboxapi.com/2';
const CONTENT_API = 'https://content.dropboxapi.com/2';
const TOKEN_URL = 'https://api.dropboxapi.com/oauth2/token';
const AUTH_URL = 'https://www.dropbox.com/oauth2/authorize';

const { readSettings, writeSettings } = require('./settings');

function htmlEsc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// Origin we post the auth result to — derived from the redirect URI the browser
// supplied (never a wildcard), falling back to the request host.
function popupOrigin(req) {
  try {
    const db = readSettings().dropbox || {};
    if (db._pendingRedirectUri) return new URL(db._pendingRedirectUri).origin;
  } catch {}
  return `${req.protocol}://${req.get('host')}`;
}

function popupPage(targetOrigin, message, note) {
  return `<!doctype html><html><body style="font-family:system-ui,sans-serif;background:#0e1428;color:#eef2fb;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><p>${htmlEsc(note || 'You can close this window.')}</p><script>
    (function(){ try { if (window.opener) window.opener.postMessage(${JSON.stringify(message)}, ${JSON.stringify(targetOrigin)}); } catch (e) {} window.close(); })();
  </script></body></html>`;
}

function getDropbox() { return readSettings().dropbox || {}; }
function saveDropbox(data) {
  const s = readSettings();
  s.dropbox = Object.assign({}, s.dropbox || {}, data);
  writeSettings(s);
}
function getAppCreds() {
  const s = readSettings();
  const db = s.dropbox || {};
  return { appKey: db.appKey || '', appSecret: db.appSecret || '' };
}

// ── Token management ──────────────────────────────────────────────────────────
async function getValidToken() {
  const db = getDropbox();
  if (!db.refreshToken) throw new Error('Dropbox not connected');

  if (db.accessToken && db.tokenExpiry && Date.now() < db.tokenExpiry - 60000) {
    return db.accessToken;
  }

  const { appKey, appSecret } = getAppCreds();
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: db.refreshToken,
  });
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${appKey}:${appSecret}`).toString('base64'),
    },
    body: body.toString(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.error || 'Token refresh failed');

  saveDropbox({
    accessToken: data.access_token,
    tokenExpiry: Date.now() + (data.expires_in || 14400) * 1000,
  });
  return data.access_token;
}
module.exports.getValidToken = getValidToken;

// ── File operations ───────────────────────────────────────────────────────────
// Dropbox chunk size: 8 MiB (must be ≤ 150 MiB; smaller = more progress granularity)
const DB_CHUNK_SIZE = 8 * 1024 * 1024;
// Simple upload threshold: files at or below this size use the single-request path.
const DB_SIMPLE_THRESHOLD = 8 * 1024 * 1024;

async function dbApiArg(token, url, arg, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
      'Dropbox-API-Arg': JSON.stringify(arg),
    },
    body,
  });
  if (!res.ok) {
    const raw = await res.text().catch(() => '');
    let msg = `Dropbox error HTTP ${res.status}`;
    try { const j = JSON.parse(raw); msg = j.error_summary || msg; } catch {}
    throw new Error(msg);
  }
  return res.json().catch(() => ({}));
}

async function uploadFile(token, localPath, remotePath) {
  const dropboxPath = remotePath.startsWith('/') ? remotePath : '/' + remotePath;
  const fileSize = fs.statSync(localPath).size;

  if (fileSize <= DB_SIMPLE_THRESHOLD) {
    const content = fs.readFileSync(localPath);
    await dbApiArg(token, `${CONTENT_API}/files/upload`, {
      path: dropboxPath, mode: { '.tag': 'overwrite' }, autorename: false, mute: true,
    }, content);
    return;
  }

  // Large file: use upload session
  const fd = fs.openSync(localPath, 'r');
  try {
    // Start session with first chunk
    const firstBuf = Buffer.allocUnsafe(DB_CHUNK_SIZE);
    const firstRead = fs.readSync(fd, firstBuf, 0, DB_CHUNK_SIZE, 0);
    const startRes = await dbApiArg(token, `${CONTENT_API}/files/upload_session/start`,
      { close: false }, firstBuf.slice(0, firstRead));
    const sessionId = startRes.session_id;

    let offset = firstRead;
    while (offset + DB_CHUNK_SIZE < fileSize) {
      const buf = Buffer.allocUnsafe(DB_CHUNK_SIZE);
      const n = fs.readSync(fd, buf, 0, DB_CHUNK_SIZE, offset);
      await dbApiArg(token, `${CONTENT_API}/files/upload_session/append_v2`,
        { cursor: { session_id: sessionId, offset }, close: false }, buf.slice(0, n));
      offset += n;
    }

    // Finish: last chunk + commit
    const remaining = fileSize - offset;
    const lastBuf = Buffer.allocUnsafe(remaining);
    if (remaining > 0) fs.readSync(fd, lastBuf, 0, remaining, offset);
    await dbApiArg(token, `${CONTENT_API}/files/upload_session/finish`, {
      cursor: { session_id: sessionId, offset },
      commit: { path: dropboxPath, mode: { '.tag': 'overwrite' }, autorename: false, mute: true },
    }, remaining > 0 ? lastBuf : Buffer.alloc(0));
  } finally {
    fs.closeSync(fd);
  }
}
module.exports.uploadFile = uploadFile;

async function listFolder(token, folderPath) {
  const path = folderPath.startsWith('/') ? folderPath : '/' + folderPath;
  const res = await fetch(`${API}/files/list_folder`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, include_deleted: false }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    // Path not found — return empty list
    if (err.error && err.error['.tag'] === 'path' && err.error.path && err.error.path['.tag'] === 'not_found') return [];
    throw new Error(err.error_summary || `List failed: HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.entries || [];
}
module.exports.listFolder = listFolder;

async function deleteItem(token, itemPath) {
  const path = itemPath.startsWith('/') ? itemPath : '/' + itemPath;
  const res = await fetch(`${API}/files/delete_v2`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }),
  });
  if (!res.ok && res.status !== 409) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error_summary || `Delete failed: HTTP ${res.status}`);
  }
}
module.exports.deleteItem = deleteItem;

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/dropbox/auth/url?redirectUri=...
router.get('/auth/url', (req, res) => {
  const { appKey } = getAppCreds();
  if (!appKey) return res.status(400).json({ error: 'No App Key configured' });
  const redirectUri = req.query.redirectUri;
  if (!redirectUri) return res.status(400).json({ error: 'redirectUri required' });

  // Store redirect URI + a CSRF state token so the callback can validate the flow
  const state = crypto.randomBytes(16).toString('hex');
  saveDropbox({ _pendingRedirectUri: redirectUri, _pendingState: state });

  const url = `${AUTH_URL}?` + new URLSearchParams({
    client_id: appKey,
    redirect_uri: redirectUri,
    response_type: 'code',
    token_access_type: 'offline',
    state,
  });
  res.json({ url });
});

// GET /api/dropbox/callback — Dropbox redirects here after auth
router.get('/callback', async (req, res) => {
  const { code, error, state } = req.query;
  const origin = popupOrigin(req);
  if (error) return res.status(400).send(popupPage(origin, `dropbox-auth-error:${error}`, `Dropbox auth failed: ${error}`));
  if (!code) return res.status(400).send(popupPage(origin, 'dropbox-auth-error:missing code', 'Missing authorization code.'));

  try {
    const { appKey, appSecret } = getAppCreds();
    const db = getDropbox();
    const redirectUri = db._pendingRedirectUri;
    if (!redirectUri) return res.status(400).send(popupPage(origin, 'dropbox-auth-error:no session', 'No pending auth session.'));
    if (!db._pendingState || state !== db._pendingState) {
      return res.status(400).send(popupPage(origin, 'dropbox-auth-error:invalid state', 'Invalid authorization state.'));
    }

    const body = new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });
    const tokenRes = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + Buffer.from(`${appKey}:${appSecret}`).toString('base64'),
      },
      body: body.toString(),
    });
    const data = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(data.error_description || data.error || 'Token exchange failed');

    // Get account display name
    let displayName = data.account_id || '';
    try {
      const meRes = await fetch(`${API}/users/get_current_account`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${data.access_token}`, 'Content-Type': 'application/json' },
        body: 'null',
      });
      const me = await meRes.json();
      displayName = me.name?.display_name || me.email || displayName;
    } catch {}

    const targetOrigin = (() => { try { return new URL(redirectUri).origin; } catch { return origin; } })();

    saveDropbox({
      connected: true,
      displayName,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenExpiry: Date.now() + (data.expires_in || 14400) * 1000,
      _pendingRedirectUri: null,
      _pendingState: null,
    });

    // Close the popup and signal success to the opener (specific origin, escaped)
    res.send(popupPage(targetOrigin, 'dropbox-auth-ok', 'Connected! You can close this window.'));
  } catch (err) {
    res.status(500).send(popupPage(origin, `dropbox-auth-error:${err.message}`, `Error: ${err.message}`));
  }
});

// POST /api/dropbox/auth/disconnect
router.post('/auth/disconnect', (req, res) => {
  saveDropbox({ connected: false, displayName: '', accessToken: '', refreshToken: '', tokenExpiry: 0 });
  res.json({ ok: true });
});

// GET /api/dropbox/status
router.get('/status', (req, res) => {
  const db = getDropbox();
  res.json({ connected: !!db.connected && !!db.refreshToken, displayName: db.displayName || '' });
});

// POST /api/dropbox/backup/:jobId — manual trigger
router.post('/backup/:jobId', async (req, res) => {
  try {
    const { runJob } = require('../backup-scheduler');
    const settings = readSettings();
    const job = (settings.backupJobs || []).find((j) => j.id === req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    await runJob(job);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports.router = router;
