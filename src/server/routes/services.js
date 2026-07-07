'use strict';

const express = require('express');
const { execFile } = require('child_process');
const { listContainers, inspectContainer } = require('../docker');
const { readCompose } = require('../compose');

const router = express.Router();

// Reject unsafe service names before they reach docker argv (a leading '-'
// would be parsed as a flag; only compose-legal characters are allowed).
router.param('name', (req, res, next, name) => {
  if (typeof name !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name)) {
    return res.status(400).json({ error: 'Invalid service name' });
  }
  next();
});


async function runCompose(projectDir, args) {
  const { getComposePath } = require('../compose');
  const path = require('path');
  const cwd = path.dirname(getComposePath(projectDir));
  return new Promise((resolve, reject) => {
    execFile('docker', ['compose', ...args], { timeout: 120000, cwd }, (err, stdout, stderr) => {
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
      // Collect running container IDs so we can batch-inspect for health
      const containerMap = {};
      for (const [name, config] of Object.entries(parsed.services)) {
        const configName = config && config.container_name;
        // Find container: first by explicit container_name, then by compose service label
        let container = configName
          ? allContainers.find((c) => c.Names && c.Names.some((n) => n.replace(/^\//, '') === configName))
          : null;
        if (!container) {
          container = allContainers.find((c) => {
            const labels = c.Labels || {};
            return labels['com.docker.compose.service'] === name;
          });
        }
        // Use the actual Docker container name (reliable for docker logs, stop, etc.)
        const containerName = container
          ? container.Names[0].replace(/^\//, '')
          : configName || name;
        containerMap[name] = { name, config, containerName, container };
      }

      // Batch inspect running containers to get reliable health status
      const runningEntries = Object.values(containerMap).filter((e) => e.container && e.container.State === 'running');
      const inspectResults = await Promise.all(
        runningEntries.map(async (e) => {
          try {
            const info = await inspectContainer(e.container.Id);
            return { name: e.name, info };
          } catch {
            return { name: e.name, info: null };
          }
        })
      );
      const healthByName = {};
      for (const { name, info } of inspectResults) {
        const hs = info && info.State && info.State.Health && info.State.Health.Status;
        healthByName[name] = (hs && hs !== 'none') ? hs : null;
      }

      for (const [name, { config, containerName, container }] of Object.entries(containerMap)) {
        services.push({
          name,
          containerName,
          image: config && config.image,
          isCustom: !!(config && config.build),
          ports: config && config.ports,
          status: container ? container.Status : 'not created',
          state: container ? container.State : 'absent',
          health: healthByName[name] ?? null,
          id: container ? container.Id : null,
        });
      }
    }

    res.json({ services });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function getContainerName(projectDir, serviceName) {
  try {
    const { parsed } = readCompose(projectDir);
    const svc = parsed && parsed.services && parsed.services[serviceName];
    if (svc && svc.container_name) return svc.container_name;
  } catch {}
  // Fall back to finding via compose service label on running containers
  try {
    const containers = await listContainers();
    const found = containers.find((c) => {
      const labels = c.Labels || {};
      return labels['com.docker.compose.service'] === serviceName;
    });
    if (found) return found.Names[0].replace(/^\//, '');
  } catch {}
  return serviceName;
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
    const containerName = await getContainerName(req.query.project || '', req.params.name);
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
    const containerName = await getContainerName(req.query.project || '', req.params.name);
    const { stdout, stderr } = await runDocker(['stop', containerName]);
    res.json({ ok: true, stdout, stderr });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/services/:name/restart
router.post('/:name/restart', async (req, res) => {
  try {
    const containerName = await getContainerName(req.query.project || '', req.params.name);
    const { stdout, stderr } = await runDocker(['restart', containerName]);
    res.json({ ok: true, stdout, stderr });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/services/:name/recreate
// Use --force-recreate so compose manages the full stop/remove/create cycle itself,
// keeping its internal tracking labels correct. Manual docker rm -f bypasses compose
// tracking and causes "container name already in use" conflicts on the next compose up.
router.post('/:name/recreate', async (req, res) => {
  try {
    const project = req.query.project || '';
    const name = req.params.name;
    const { stdout, stderr } = await runCompose(project, ['up', '-d', '--force-recreate', '--no-deps', name]);
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

// POST /api/services/:name/update — pull then force-recreate via compose
router.post('/:name/update', async (req, res) => {
  try {
    const project = req.query.project || '';
    const name = req.params.name;
    await runCompose(project, ['pull', name]);
    const { stdout, stderr } = await runCompose(project, ['up', '-d', '--force-recreate', '--no-deps', name]);
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

    // Services using a local build without an image tag can't be checked against a registry
    if (svc && svc.build && !svc.image) {
      return res.json({ hasUpdate: false, image: null, reason: 'custom-build' });
    }

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

    // Remote digest via Docker Engine distribution API — just a registry manifest HEAD, no layer download.
    // For private registries the daemon requires an explicit X-Registry-Auth header; build it from
    // stored DoCompose registry credentials when the image's registry matches one.
    const getRemoteDigest = (img) => new Promise((resolve) => {
      const http = require('http');
      let xRegistryAuth = '';
      try {
        const { readSettings } = require('../routes/settings');
        const settings = readSettings();
        const registries = (settings && settings.registries) || [];
        const imgParts = img.split('/');
        const registryHost = imgParts.length > 1 && (imgParts[0].includes('.') || imgParts[0].includes(':'))
          ? imgParts[0] : '';
        if (registryHost) {
          const reg = registries.find((r) =>
            r.server === registryHost ||
            r.server === `https://${registryHost}` ||
            r.server === `http://${registryHost}`
          );
          if (reg && reg.username && reg.password) {
            xRegistryAuth = Buffer.from(JSON.stringify({
              username: reg.username, password: reg.password, serveraddress: registryHost,
            })).toString('base64');
          }
        }
      } catch {}
      const headers = xRegistryAuth ? { 'X-Registry-Auth': xRegistryAuth } : {};
      const req = http.request({
        socketPath: '/var/run/docker.sock',
        path: `/distribution/${encodeURIComponent(img)}/json`,
        method: 'GET',
        headers,
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

// POST /api/services?project=<dir>
// Body: { name, image, containerName, restart, ports, volumes, environment, start }
router.post('/', async (req, res) => {
  try {
    const { readCompose, writeCompose } = require('../compose');
    const project = req.query.project || '';
    const { name, image, containerName, hostname, restart, ports, volumes, environment, start } = req.body || {};

    if (!name || !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name)) {
      return res.status(400).json({ error: 'Invalid service name' });
    }
    if (!image) {
      return res.status(400).json({ error: 'Image is required' });
    }

    let parsed;
    try {
      ({ parsed } = readCompose(project));
    } catch {
      parsed = {};
    }
    if (!parsed) parsed = {};
    if (!parsed.services) parsed.services = {};
    if (parsed.services[name]) {
      return res.status(409).json({ error: `Service "${name}" already exists` });
    }

    const svcConfig = { image };
    if (containerName) svcConfig.container_name = containerName;
    if (hostname) svcConfig.hostname = hostname;
    if (restart) svcConfig.restart = restart;
    if (Array.isArray(ports) && ports.length) svcConfig.ports = ports;
    if (Array.isArray(volumes) && volumes.length) svcConfig.volumes = volumes;
    if (Array.isArray(environment) && environment.length) svcConfig.environment = environment;

    parsed.services[name] = svcConfig;
    writeCompose(project, parsed);

    if (start) {
      try {
        await runCompose(project, ['up', '-d', '--no-deps', name]);
      } catch (err) {
        return res.json({ ok: true, started: false, startError: err.message });
      }
    }

    res.json({ ok: true, started: !!start });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/services/:name?project=<dir>
router.delete('/:name', async (req, res) => {
  try {
    const { readCompose, writeCompose } = require('../compose');
    const project = req.query.project || '';
    const name = req.params.name;

    // Stop and remove the container if it exists
    try {
      const containerName = await getContainerName(project, name);
      await runDocker(['stop', containerName]).catch(() => {});
      await runDocker(['rm', '-f', containerName]).catch(() => {});
    } catch {}

    // Remove from compose file
    const { parsed } = readCompose(project);
    if (parsed && parsed.services) {
      delete parsed.services[name];
      writeCompose(project, parsed);
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
