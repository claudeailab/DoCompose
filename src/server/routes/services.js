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

function getContainerName(projectDir, serviceName) {
  try {
    const { parsed } = readCompose(projectDir);
    const svc = parsed && parsed.services && parsed.services[serviceName];
    return (svc && svc.container_name) || serviceName;
  } catch {
    return serviceName;
  }
}

function runDocker(args) {
  return new Promise((resolve, reject) => {
    execFile('docker', args, { timeout: 60000 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      resolve({ stdout, stderr });
    });
  });
}

// POST /api/services/:name/start
router.post('/:name/start', async (req, res) => {
  try {
    const containerName = getContainerName(req.query.project || '', req.params.name);
    const { stdout, stderr } = await runDocker(['start', containerName]);
    res.json({ ok: true, stdout, stderr });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/services/:name/stop
// Use `docker stop` (not `docker compose stop`) so that restart:unless-stopped
// is properly honoured — compose stop doesn't always set the manual-stop flag.
router.post('/:name/stop', async (req, res) => {
  try {
    const containerName = getContainerName(req.query.project || '', req.params.name);
    const { stdout, stderr } = await runDocker(['stop', containerName]);
    res.json({ ok: true, stdout, stderr });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/services/:name/restart
router.post('/:name/restart', async (req, res) => {
  try {
    const containerName = getContainerName(req.query.project || '', req.params.name);
    const { stdout, stderr } = await runDocker(['restart', containerName]);
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

// GET /api/services/:name/check-update
// Compares local RepoDigest against the registry manifest — no image pull required.
router.get('/:name/check-update', async (req, res) => {
  try {
    const projectDir = req.query.project || '';
    const { parsed } = readCompose(projectDir);
    const svc = parsed && parsed.services && parsed.services[req.params.name];
    if (!svc || !svc.image) return res.status(404).json({ error: 'No image configured for this service' });

    const image = svc.image;

    // Digest-pinned or local build — nothing to compare
    if (image.includes('@sha256:') || image.startsWith('sha256:')) {
      return res.json({ hasUpdate: false, image, reason: 'digest-pinned' });
    }

    // Local digest from image inspect (instant, no network)
    const getLocalDigest = () => new Promise((resolve) => {
      execFile('docker', ['image', 'inspect', image, '--format', '{{index .RepoDigests 0}}'], (err, stdout) => {
        resolve(err ? null : (stdout.trim() || null));
      });
    });

    // Remote digest via Docker Engine distribution API — just a registry manifest HEAD, no layer download
    const getRemoteDigest = (img) => new Promise((resolve) => {
      const http = require('http');
      const req = http.request({
        socketPath: '/var/run/docker.sock',
        path: `/distribution/${encodeURIComponent(img)}/json`,
        method: 'GET',
      }, (resp) => {
        let data = '';
        resp.on('data', (d) => { data += d; });
        resp.on('end', () => {
          try { resolve((JSON.parse(data).Descriptor || {}).digest || null); }
          catch { resolve(null); }
        });
      });
      req.setTimeout(15000, () => { req.destroy(); resolve(null); });
      req.on('error', () => resolve(null));
      req.end();
    });

    const [localRepoDigest, remoteDigest] = await Promise.all([getLocalDigest(), getRemoteDigest(image)]);

    if (!remoteDigest) return res.json({ hasUpdate: false, image, reason: 'registry-unreachable' });

    // localRepoDigest format: "nginx@sha256:abc…" — extract the hash part
    const localDigest = localRepoDigest ? localRepoDigest.split('@')[1] : null;
    const hasUpdate = !localDigest || localDigest !== remoteDigest;

    res.json({ hasUpdate, image });
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
