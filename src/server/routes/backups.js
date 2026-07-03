'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');
const { readCompose, writeCompose } = require('../compose');

const router = express.Router();

const BACKUP_DIR = process.env.BACKUP_DIR || '/data/backups';

function ensureBackupDir() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function getBackupPath(filename) {
  return path.join(BACKUP_DIR, filename);
}

function safeFilename(name) {
  return name.replace(/[^a-zA-Z0-9_.\-]/g, '_');
}

// GET /api/backups?project=<dir>
router.get('/', (req, res) => {
  try {
    ensureBackupDir();
    const projectDir = req.query.project || '';
    const prefix = safeFilename(projectDir || 'root') + '_';
    const files = fs.readdirSync(BACKUP_DIR)
      .filter((f) => f.startsWith(prefix) && f.endsWith('.yml'))
      .sort()
      .reverse()
      .map((f) => {
        const stat = fs.statSync(path.join(BACKUP_DIR, f));
        return { filename: f, size: stat.size, createdAt: stat.mtime.toISOString() };
      });
    res.json({ backups: files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/backups?project=<dir> — create backup
router.post('/', (req, res) => {
  try {
    ensureBackupDir();
    const projectDir = req.query.project || '';
    const { raw } = readCompose(projectDir);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const prefix = safeFilename(projectDir || 'root');
    const filename = `${prefix}_${timestamp}.yml`;
    fs.writeFileSync(getBackupPath(filename), raw, 'utf8');
    res.json({ ok: true, filename });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/backups/:filename/restore?project=<dir>
router.post('/:filename/restore', (req, res) => {
  try {
    const filename = safeFilename(req.params.filename);
    const backupPath = getBackupPath(filename);
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ error: 'Backup not found' });
    }
    const content = fs.readFileSync(backupPath, 'utf8');
    const projectDir = req.query.project || '';
    writeCompose(projectDir, content);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/backups/:filename
router.delete('/:filename', (req, res) => {
  try {
    const filename = safeFilename(req.params.filename);
    const backupPath = getBackupPath(filename);
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ error: 'Backup not found' });
    }
    fs.unlinkSync(backupPath);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/backups/:filename/download
router.get('/:filename/download', (req, res) => {
  try {
    const filename = safeFilename(req.params.filename);
    const backupPath = getBackupPath(filename);
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ error: 'Backup not found' });
    }
    res.download(backupPath, filename);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
