'use strict';

const express = require('express');
const YAML = require('yaml');
const { readCompose, writeCompose, validateCompose, readEnv, writeEnv, listProjects, getComposePath, normalizeCompose, serializeCompose } = require('../compose');

const router = express.Router();

// GET /api/files/projects
router.get('/projects', (req, res) => {
  try {
    const projects = listProjects();
    res.json({ projects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/files/compose?project=<dir>
router.get('/compose', (req, res) => {
  try {
    const { raw, parsed, filePath } = readCompose(req.query.project || '');
    res.json({ content: raw, parsed, filePath });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// POST /api/files/compose?project=<dir>
router.post('/compose', async (req, res) => {
  try {
    const { content, validate = true } = req.body;
    if (!content) return res.status(400).json({ error: 'content is required' });
    const projectDir = req.query.project || '';

    if (validate) {
      // Write to temp file to validate
      const fs = require('fs');
      const os = require('os');
      const path = require('path');
      const tmpFile = path.join(os.tmpdir(), `docompose-validate-${Date.now()}.yml`);
      fs.writeFileSync(tmpFile, content, 'utf8');
      const result = await validateCompose(tmpFile);
      fs.unlinkSync(tmpFile);
      if (!result.valid) {
        return res.status(422).json({ error: result.error, valid: false });
      }
    }

    const { filePath } = writeCompose(projectDir, content);
    res.json({ ok: true, filePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/files/validate?project=<dir>
router.post('/validate', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'content is required' });

    const fs = require('fs');
    const os = require('os');
    const path = require('path');
    const tmpFile = path.join(os.tmpdir(), `docompose-validate-${Date.now()}.yml`);
    fs.writeFileSync(tmpFile, content, 'utf8');
    const result = await validateCompose(tmpFile);
    fs.unlinkSync(tmpFile);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/files/env?project=<dir>
router.get('/env', (req, res) => {
  try {
    const { raw, filePath } = readEnv(req.query.project || '');
    res.json({ content: raw, filePath });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// POST /api/files/env?project=<dir>
router.post('/env', (req, res) => {
  try {
    const { content } = req.body;
    if (content === undefined) return res.status(400).json({ error: 'content is required' });
    const { filePath } = writeEnv(req.query.project || '', content);
    res.json({ ok: true, filePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/files/service/:name?project=<dir>  — returns YAML for a single service block
router.get('/service/:name', (req, res) => {
  try {
    const { parsed } = readCompose(req.query.project || '');
    const services = (parsed && parsed.services) || {};
    const svc = services[req.params.name];
    if (!svc) return res.status(404).json({ error: `Service "${req.params.name}" not found` });
    const yaml = YAML.stringify({ [req.params.name]: svc }, { indent: 2, lineWidth: 0 });
    res.json({ name: req.params.name, yaml });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/files/service/:name?project=<dir>  — update a single service's block
router.post('/service/:name', (req, res) => {
  try {
    const { yaml } = req.body;
    if (!yaml) return res.status(400).json({ error: 'yaml is required' });

    const projectDir = req.query.project || '';
    const { parsed } = readCompose(projectDir);
    const parsed2 = YAML.parse(yaml);

    // Accept either `{ serviceName: {...} }` or just the service object
    let serviceData = parsed2;
    if (parsed2 && parsed2[req.params.name]) {
      serviceData = parsed2[req.params.name];
    }

    if (!parsed.services) parsed.services = {};
    parsed.services[req.params.name] = serviceData;

    const normalized = normalizeCompose(parsed);
    const content = serializeCompose(normalized);
    writeCompose(projectDir, content);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/files/service/:name/env — returns environment vars as KEY=VALUE text
router.get('/service/:name/env', (req, res) => {
  try {
    const { parsed } = readCompose(req.query.project || '');
    const svc = ((parsed && parsed.services) || {})[req.params.name];
    if (!svc) return res.status(404).json({ error: `Service "${req.params.name}" not found` });
    const env = svc.environment || {};
    let lines;
    if (Array.isArray(env)) {
      lines = env.map((e) => String(e));
    } else {
      lines = Object.entries(env).map(([k, v]) => (v === null || v === undefined ? k : `${k}=${v}`));
    }
    res.json({ content: lines.join('\n') });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/files/service/:name/env — save environment vars from KEY=VALUE text
router.post('/service/:name/env', (req, res) => {
  try {
    const { content } = req.body;
    if (content === undefined) return res.status(400).json({ error: 'content is required' });
    const projectDir = req.query.project || '';
    const { parsed } = readCompose(projectDir);
    if (!parsed.services || !parsed.services[req.params.name]) {
      return res.status(404).json({ error: `Service "${req.params.name}" not found` });
    }
    const envObj = {};
    for (const line of String(content).split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq === -1) { envObj[t] = null; } else { envObj[t.slice(0, eq)] = t.slice(eq + 1); }
    }
    parsed.services[req.params.name].environment = envObj;
    const normalized = normalizeCompose(parsed);
    writeCompose(projectDir, serializeCompose(normalized));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
