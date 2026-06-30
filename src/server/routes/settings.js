'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const router = express.Router();

const SETTINGS_PATH = path.join(process.env.COMPOSE_DIR || '/compose', '.docompose-settings.json');

function readSettings() {
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function writeSettings(data) {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// GET /api/settings
router.get('/', (req, res) => {
  res.json(readSettings());
});

// POST /api/settings
router.post('/', (req, res) => {
  try {
    const existing = readSettings();
    const merged = Object.assign({}, existing, req.body);
    writeSettings(merged);
    try { require('../backup-scheduler').reschedule(); } catch {}
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/settings/test-registry — test registry authentication via docker login
router.post('/test-registry', (req, res) => {
  const { server, username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ ok: false, error: 'Username and password are required' });
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
