'use strict';

const express = require('express');
const { execFile } = require('child_process');
const { listContainers, inspectContainer } = require('../docker');
const { readCompose, getComposePath } = require('../compose');

const router = express.Router();

function runCompose(projectDir, args) {
  return new Promise((resolve, reject) => {
    const { getComposePath } = require('../compose');
    const filePath = getComposePath(projectDir);
    execFile('docker', ['compose', '-f', filePath, ...args], { timeout: 120000 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      resolve({ stdout, stderr });
    });
  });
}

// GET /api/services?project=<dir>
router.get('/', async (req, res) => {
  try {
    const projectDir = req.query.project || '';
    let parsed = null;
    try {
      const { parsed: p } = readCompose(projectDir);
      parsed = p;
    } catch {}

    const allContainers = await listContainers();
    const services = [];

    if (parsed && parsed.services) {
      for (const [name, config] of Object.entries(parsed.services)) {
        const containerName = (config && config.container_name) || name;
        const container = allContainers.find((c) =>
          c.Names && c.Names.some((n) => n.replace(/^\//, '') === containerName)
        );
        let health = null;
        if (container && container.Status) {
          if (/\(healthy\)/.test(container.Status)) health = 'healthy';
          else if (/\(unhealthy\)/.test(container.Status)) health = 'unhealthy';
          else if (/health: starting/.test(container.Status)) health = 'starting';
        }
        services.push({
          name,
          containerName,
          image: config && config.image,
          ports: config && config.ports,
          status: container ? container.Status : 'not created',
          state: container ? container.State : 'absent',
          health,
          id: container ? container.Id : null,
        });
      }
    }

    res.json({ services });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/services/:name/start
router.post('/:name/start', async (req, res) => {
  try {
    const { stdout, stderr } = await runCompose(req.query.project || '', ['start', req.params.name]);
    res.json({ ok: true, stdout, stderr });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/services/:name/stop
router.post('/:name/stop', async (req, res) => {
  try {
    const { stdout, stderr } = await runCompose(req.query.project || '', ['stop', req.params.name]);
    res.json({ ok: true, stdout, stderr });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/services/:name/restart
router.post('/:name/restart', async (req, res) => {
  try {
    const { stdout, stderr } = await runCompose(req.query.project || '', ['restart', req.params.name]);
    res.json({ ok: true, stdout, stderr });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/services/:name/recreate
router.post('/:name/recreate', async (req, res) => {
  try {
    const project = req.query.project || '';
    const name = req.params.name;
    await runCompose(project, ['rm', '-sf', name]);
    const { stdout, stderr } = await runCompose(project, ['up', '-d', name]);
    res.json({ ok: true, stdout, stderr });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/services/:name/pull
router.post('/:name/pull', async (req, res) => {
  try {
    const { stdout, stderr } = await runCompose(req.query.project || '', ['pull', req.params.name]);
    res.json({ ok: true, stdout, stderr });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/services/:name/rebuild
router.post('/:name/rebuild', async (req, res) => {
  try {
    const { stdout: s1, stderr: e1 } = await runCompose(req.query.project || '', ['build', req.params.name]);
    const { stdout: s2, stderr: e2 } = await runCompose(req.query.project || '', ['up', '-d', req.params.name]);
    res.json({ ok: true, stdout: s1 + s2, stderr: e1 + e2 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/services/:name/check-update — pull image and report if a new digest was fetched
router.get('/:name/check-update', async (req, res) => {
  try {
    const projectDir = req.query.project || '';
    const { parsed } = readCompose(projectDir);
    const svc = parsed && parsed.services && parsed.services[req.params.name];
    if (!svc || !svc.image) return res.status(404).json({ error: 'No image configured for this service' });

    const getDigest = (image) => new Promise((resolve) => {
      execFile('docker', ['image', 'inspect', image, '--format', '{{.Id}}'], (err, stdout) => {
        resolve(err ? null : stdout.trim());
      });
    });

    const before = await getDigest(svc.image);
    await runCompose(projectDir, ['pull', req.params.name]);
    const after = await getDigest(svc.image);

    res.json({ hasUpdate: after !== null && before !== after, image: svc.image });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/services/:name/inspect
router.get('/:name/inspect', async (req, res) => {
  try {
    const info = await inspectContainer(req.params.name);
    res.json(info);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
