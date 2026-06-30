'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const SCOPES = 'Files.ReadWrite offline_access User.Read';
const GRAPH = 'https://graph.microsoft.com/v1.0';

function getOdConfig() {
  const s = require('./settings').readSettings();
  const od = s.onedrive || {};
  const clientId = process.env.ONEDRIVE_CLIENT_ID || od.clientId || '';
  const tenant = od.tenant || 'common';
  const base = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0`;
  return { clientId, tenant, tokenUrl: `${base}/token`, deviceCodeUrl: `${base}/devicecode` };
}

// ── Settings helpers ─────────────────────────────────────────────────────────
const { readSettings, writeSettings } = require('./settings');

function getOnedrive() { return readSettings().onedrive || {}; }
function saveOnedrive(data) {
  const s = readSettings();
  s.onedrive = Object.assign({}, s.onedrive || {}, data);
  writeSettings(s);
}

// ── Token management ─────────────────────────────────────────────────────────
async function getValidToken() {
  const od = getOnedrive();
  if (!od.refreshToken) throw new Error('OneDrive not connected');

  if (od.accessToken && od.tokenExpiry && Date.now() < od.tokenExpiry - 60000) {
    return od.accessToken;
  }

  const { clientId, tokenUrl } = getOdConfig();
  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: 'refresh_token',
    refresh_token: od.refreshToken,
    scope: SCOPES,
  });

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.error || 'Token refresh failed');

  saveOnedrive({
    accessToken: data.access_token,
    refreshToken: data.refresh_token || od.refreshToken,
    tokenExpiry: Date.now() + data.expires_in * 1000,
  });
  return data.access_token;
}
module.exports.getValidToken = getValidToken;

async function graphGet(path_, token) {
  const res = await fetch(`${GRAPH}${path_}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `Graph error ${res.status}`);
  return data;
}

// Upload a single file (simple PUT, suitable for any size we'd encounter in config dirs)
async function uploadFile(token, localPath, remoteItemPath) {
  const content = fs.readFileSync(localPath);
  const encoded = encodeURIComponent(remoteItemPath).replace(/%2F/g, '/');
  // Use upload session for reliability
  const sessionRes = await fetch(`${GRAPH}/me/drive/root:${encoded}:/createUploadSession`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ item: { '@microsoft.graph.conflictBehavior': 'replace' } }),
  });
  const session = await sessionRes.json();
  if (!sessionRes.ok) throw new Error(session.error?.message || 'Failed to create upload session');

  const uploadRes = await fetch(session.uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Length': String(content.length),
      'Content-Range': `bytes 0-${content.length - 1}/${content.length}`,
    },
    body: content,
  });
  if (!uploadRes.ok) {
    const err = await uploadRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Upload failed: HTTP ${uploadRes.status}`);
  }
}
module.exports.uploadFile = uploadFile;

// Walk directory and return all file paths with their relative counterparts
function walkDir(dir, baseDir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const stat = fs.statSync(dir);
  if (stat.isFile()) {
    results.push({ local: dir, relative: path.basename(dir) });
    return results;
  }
  function walk(current, rel) {
    for (const entry of fs.readdirSync(current)) {
      const full = path.join(current, entry);
      const relPath = rel ? `${rel}/${entry}` : entry;
      const s = fs.statSync(full);
      if (s.isDirectory()) walk(full, relPath);
      else results.push({ local: full, relative: relPath });
    }
  }
  walk(dir, '');
  return results;
}
module.exports.walkDir = walkDir;

// List children of a OneDrive folder path
async function listFolder(token, folderPath) {
  const encoded = encodeURIComponent(folderPath).replace(/%2F/g, '/');
  try {
    const data = await graphGet(`/me/drive/root:${encoded}:/children?$orderby=name&$top=200`, token);
    return data.value || [];
  } catch (err) {
    if (err.message.includes('itemNotFound') || err.message.includes('404')) return [];
    throw err;
  }
}
module.exports.listFolder = listFolder;

async function deleteItem(token, itemId) {
  const res = await fetch(`${GRAPH}/me/drive/items/${itemId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 404) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Delete failed: HTTP ${res.status}`);
  }
}
module.exports.deleteItem = deleteItem;

// ── Routes ───────────────────────────────────────────────────────────────────

// POST /api/onedrive/auth/start
router.post('/auth/start', async (req, res) => {
  try {
    const { clientId, deviceCodeUrl } = getOdConfig();
    if (!clientId) return res.status(400).json({ error: 'No Azure App Client ID configured. Add your Client ID in the OneDrive settings first.' });
    const body = new URLSearchParams({ client_id: clientId, scope: SCOPES });
    const r = await fetch(deviceCodeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    const data = await r.json();
    if (!r.ok) return res.status(400).json({ error: data.error_description || data.error });

    // Store device_code temporarily so poll endpoint can use it
    saveOnedrive({ _deviceCode: data.device_code, _pollInterval: data.interval || 5 });
    res.json({ userCode: data.user_code, verificationUrl: data.verification_uri, expiresIn: data.expires_in });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/onedrive/auth/poll — called repeatedly by client until success or timeout
router.post('/auth/poll', async (req, res) => {
  try {
    const od = getOnedrive();
    if (!od._deviceCode) return res.status(400).json({ error: 'No pending auth' });

    const { clientId, tokenUrl } = getOdConfig();
    const body = new URLSearchParams({
      client_id: clientId,
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      device_code: od._deviceCode,
    });
    const r = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    const data = await r.json();

    if (data.error === 'authorization_pending') return res.json({ pending: true });
    if (data.error === 'authorization_declined') return res.json({ error: 'Authorization declined' });
    if (data.error === 'expired_token') return res.json({ error: 'Code expired — please start again' });
    if (data.error) return res.json({ error: data.error_description || data.error });

    // Success — get display name
    let displayName = '';
    try {
      const meRes = await fetch(`${GRAPH}/me`, {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      const me = await meRes.json();
      displayName = me.displayName || me.userPrincipalName || '';
    } catch {}

    saveOnedrive({
      connected: true,
      displayName,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenExpiry: Date.now() + data.expires_in * 1000,
      _deviceCode: null,
      _pollInterval: null,
    });

    res.json({ ok: true, displayName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/onedrive/auth/disconnect
router.post('/auth/disconnect', (req, res) => {
  saveOnedrive({ connected: false, displayName: '', accessToken: '', refreshToken: '', tokenExpiry: 0, _deviceCode: null });
  res.json({ ok: true });
});

// GET /api/onedrive/status
router.get('/status', (req, res) => {
  const od = getOnedrive();
  res.json({ connected: !!od.connected && !!od.refreshToken, displayName: od.displayName || '' });
});

// GET /api/onedrive/folders — list root folders for picker
router.get('/folders', async (req, res) => {
  try {
    const token = await getValidToken();
    const data = await graphGet('/me/drive/root/children?$filter=folder ne null&$top=100', token);
    const folders = (data.value || []).filter((i) => i.folder).map((i) => i.name).sort();
    res.json({ folders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/onedrive/backup/:jobId — manual trigger
router.post('/backup/:jobId', async (req, res) => {
  try {
    const { runJob } = require('../backup-scheduler');
    const settings = readSettings();
    const jobs = settings.backupJobs || [];
    const job = jobs.find((j) => j.id === req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    await runJob(job);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports.router = router;
