'use strict';

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const YAML = require('yaml');

const COMPOSE_DIR = process.env.COMPOSE_DIR || '/compose';
const COMPOSE_FILE = process.env.COMPOSE_FILE || null; // null = auto-detect
const COMPOSE_FILENAMES = ['docker-compose.yml', 'docker-compose.yaml', 'compose.yml', 'compose.yaml'];

// Key ordering for service blocks
const SERVICE_KEY_ORDER = [
  'image', 'container_name', 'hostname', 'restart', 'user',
  'environment', 'ports', 'volumes', 'networks', 'depends_on',
];

function findComposeFile(dir) {
  if (COMPOSE_FILE) {
    return path.join(dir, COMPOSE_FILE);
  }
  for (const name of COMPOSE_FILENAMES) {
    const p = path.join(dir, name);
    if (fs.existsSync(p)) return p;
  }
  return path.join(dir, 'docker-compose.yml'); // fallback for writes
}

// Resolve a project directory and guarantee it stays within COMPOSE_DIR.
// Prevents path-traversal via the `project` query parameter (e.g. ?project=../../etc).
function safeProjectDir(projectDir) {
  const base = path.resolve(COMPOSE_DIR);
  const target = path.resolve(base, projectDir || '');
  if (target !== base && !target.startsWith(base + path.sep)) {
    throw new Error('Invalid project path');
  }
  return target;
}

function getComposePath(projectDir) {
  return findComposeFile(safeProjectDir(projectDir));
}

function getEnvPath(projectDir) {
  return path.join(safeProjectDir(projectDir), '.env');
}

/**
 * List all compose projects (subdirectories containing a compose file).
 */
function listProjects() {
  const results = [];
  // Check root
  const rootFile = findComposeFile(COMPOSE_DIR);
  if (fs.existsSync(rootFile)) {
    results.push({ name: '(root)', dir: '', file: rootFile });
  }
  // Check subdirs
  try {
    const entries = fs.readdirSync(COMPOSE_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const composeFile = findComposeFile(path.join(COMPOSE_DIR, entry.name));
      if (fs.existsSync(composeFile)) {
        results.push({ name: entry.name, dir: entry.name, file: composeFile });
      }
    }
  } catch {
    // COMPOSE_DIR may not exist
  }
  return results;
}

/**
 * Read and parse a compose file, returning raw text + parsed object.
 */
function readCompose(projectDir) {
  const filePath = getComposePath(projectDir);
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = YAML.parse(raw);
  return { raw, parsed, filePath };
}

/**
 * Sort service keys in the canonical order.
 */
function sortServiceKeys(serviceObj) {
  const ordered = {};
  for (const key of SERVICE_KEY_ORDER) {
    if (key in serviceObj) ordered[key] = serviceObj[key];
  }
  // Remaining keys alphabetically
  const remaining = Object.keys(serviceObj)
    .filter((k) => !SERVICE_KEY_ORDER.includes(k))
    .sort();
  for (const key of remaining) {
    ordered[key] = serviceObj[key];
  }
  return ordered;
}

/**
 * Normalize a parsed compose document: sort services alphabetically,
 * sort keys within each service, remove duplicate keys.
 */
function normalizeCompose(parsed) {
  if (!parsed || typeof parsed !== 'object') return parsed;
  const result = { ...parsed };
  if (result.services && typeof result.services === 'object') {
    const sortedServices = {};
    const serviceNames = Object.keys(result.services).sort((a, b) => a.localeCompare(b));
    for (const name of serviceNames) {
      sortedServices[name] = sortServiceKeys(result.services[name] || {});
    }
    result.services = sortedServices;
  }
  return result;
}

/**
 * Add a blank line between service blocks in a YAML string for readability.
 */
function addServiceSpacing(yaml) {
  const lines = yaml.split('\n');
  const out = [];
  let inServices = false;
  for (const line of lines) {
    if (/^services:\s*$/.test(line)) { inServices = true; out.push(line); continue; }
    if (inServices && /^[^ ]/.test(line)) inServices = false;
    if (inServices && /^  \S/.test(line) && out.length && out[out.length - 1] !== '') {
      out.push('');
    }
    out.push(line);
  }
  return out.join('\n');
}

/**
 * Serialize a compose object to YAML string.
 * Adds a blank line between service blocks for readability.
 */
function serializeCompose(obj) {
  const raw = YAML.stringify(obj, {
    indent: 2,
    lineWidth: 0,
    defaultKeyType: 'PLAIN',
  });
  return addServiceSpacing(raw);
}

/**
 * Write a compose file. Accepts raw YAML string or parsed object.
 */
function writeCompose(projectDir, contentOrObj) {
  const filePath = getComposePath(projectDir);
  let content;
  if (typeof contentOrObj === 'string') {
    YAML.parse(contentOrObj); // validate
    content = addServiceSpacing(contentOrObj);
  } else {
    const normalized = normalizeCompose(contentOrObj);
    content = serializeCompose(normalized);
  }
  fs.writeFileSync(filePath, content, 'utf8');
  return { filePath, content };
}

/**
 * Validate a compose file using docker compose config.
 */
function validateCompose(filePath) {
  return new Promise((resolve) => {
    const cwd = path.dirname(filePath);
    execFile('docker', ['compose', '-f', filePath, 'config'], { timeout: 15000, cwd }, (err, stdout, stderr) => {
      if (err) {
        resolve({ valid: false, error: stderr || err.message });
      } else {
        resolve({ valid: true, output: stdout });
      }
    });
  });
}

/**
 * Read the .env file as raw text.
 */
function readEnv(projectDir) {
  const filePath = getEnvPath(projectDir);
  if (!fs.existsSync(filePath)) return { raw: '', filePath };
  const raw = fs.readFileSync(filePath, 'utf8');
  return { raw, filePath };
}

/**
 * Write the .env file.
 */
function writeEnv(projectDir, content) {
  const filePath = getEnvPath(projectDir);
  fs.writeFileSync(filePath, content, 'utf8');
  return { filePath };
}

module.exports = {
  COMPOSE_DIR,
  listProjects,
  readCompose,
  writeCompose,
  validateCompose,
  readEnv,
  writeEnv,
  normalizeCompose,
  serializeCompose,
  getComposePath,
};
