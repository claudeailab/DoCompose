'use strict';

const express = require('express');
const fs = require('fs');
const router = express.Router();

const API = 'https://api.dropboxapi.com/2';
const CONTENT_API = 'https://content.dropboxapi.com/2';
const TOKEN_URL = 'https://api.dropboxapi.com/oauth2/token';
const AUTH_URL = 'https://www.dropbox.com/oauth2/authorize';

const { readSettings, writeSettings } = require('./settings');

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
async function uploadFile(token, localPath, remotePath) {
  const content = fs.readFileSync(localPath);
  const res = await fetch(`${CONTENT_API}/files/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
      'Dropbox-API-Arg': JSON.stringify({
        path: remotePath.startsWith('/') ? remotePath : '/' + remotePath,
        mode: 'overwrite',
        autorename: false,
        mute: true,
      }),
    },
    body: content,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error_summary || `Upload failed: HTTP ${res.status}`);
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

  // Store redirect URI so callback can use it
  saveDropbox({ _pendingRedirectUri: redirectUri });

  const url = `${AUTH_URL}?` + new URLSearchParams({
    client_id: appKey,
    redirect_uri: redirectUri,
    response_type: 'code',
    token_access_type: 'offline',
  });
  res.json({ url });
});

// GET /api/dropbox/callback — Dropbox redirects here after auth
router.get('/callback', async (req, res) => {
  const { code, error } = req.query;
  if (error) return res.status(400).send(`<h3>Dropbox auth failed: ${error}</h3><script>window.close()</script>`);
  if (!code) return res.status(400).send('<h3>Missing code</h3>');

  try {
    const { appKey, appSecret } = getAppCreds();
    const db = getDropbox();
    const redirectUri = db._pendingRedirectUri;
    if (!redirectUri) return res.status(400).send('<h3>No pending auth session</h3>');

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

    saveDropbox({
      connected: true,
      displayName,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenExpiry: Date.now() + (data.expires_in || 14400) * 1000,
      _pendingRedirectUri: null,
    });

    // Close the popup and signal success to the opener
    res.send(`<!doctype html><html><body><script>
      if (window.opener) { window.opener.postMessage('dropbox-auth-ok', '*'); window.close(); }
      else { document.body.innerHTML = '<p>Connected! You can close this tab.</p>'; }
    </script></body></html>`);
  } catch (err) {
    res.status(500).send(`<h3>Error: ${err.message}</h3><script>if(window.opener){window.opener.postMessage('dropbox-auth-error:${err.message}','*');window.close();}</script>`);
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
