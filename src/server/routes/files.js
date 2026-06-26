'use strict';

const express = require('express');
const { readCompose, writeCompose, validateCompose, readEnv, writeEnv, listProjects, getComposePath } = require('../compose');

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

module.exports = router;
