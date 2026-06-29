'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');

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
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.readSettings = readSettings;
