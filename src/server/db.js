'use strict';

const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || '/data';
const DB_PATH = path.join(DATA_DIR, 'settings.db');

let _db = null;

function getDb() {
  if (_db) return _db;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const Database = require('better-sqlite3');
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id   INTEGER PRIMARY KEY CHECK (id = 1),
      data TEXT    NOT NULL DEFAULT '{}'
    );
    INSERT OR IGNORE INTO settings (id, data) VALUES (1, '{}');
  `);
  return _db;
}

function readSettings() {
  try {
    const row = getDb().prepare('SELECT data FROM settings WHERE id = 1').get();
    return row ? JSON.parse(row.data) : {};
  } catch {
    return {};
  }
}

function writeSettings(data) {
  getDb().prepare('UPDATE settings SET data = ? WHERE id = 1').run(JSON.stringify(data, null, 2));
}

// On first boot, if the legacy JSON file exists and the DB is still empty, migrate it.
function maybeMigrateFromJson() {
  const { COMPOSE_DIR } = require('./compose');
  const jsonPath = path.join(COMPOSE_DIR, '.docompose-settings.json');
  if (!fs.existsSync(jsonPath)) return;
  try {
    const current = readSettings();
    if (Object.keys(current).length > 0) {
      // DB already has data — just remove the legacy file so it doesn't confuse users
      fs.renameSync(jsonPath, jsonPath + '.migrated');
      return;
    }
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    writeSettings(data);
    fs.renameSync(jsonPath, jsonPath + '.migrated');
    console.log('[DB] Migrated settings from .docompose-settings.json to SQLite');
  } catch (err) {
    console.warn('[DB] JSON migration failed (settings preserved):', err.message);
  }
}

module.exports = { getDb, readSettings, writeSettings, maybeMigrateFromJson };
