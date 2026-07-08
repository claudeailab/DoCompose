'use strict';

const express = require('express');
const { execFile } = require('child_process');
const router = express.Router();

function runDocker(args) {
  return new Promise((resolve, reject) => {
    execFile('docker', args, { timeout: 60000 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      resolve(stdout.trim());
    });
  });
}

// GET /api/images — list all images with used/unused status
router.get('/', async (req, res) => {
  try {
    const Docker = require('dockerode');
    const docker = new Docker({ socketPath: '/var/run/docker.sock' });

    // Get all images and all containers in parallel
    const [images, containers] = await Promise.all([
      docker.listImages({ all: false }),
      docker.listContainers({ all: true }),
    ]);

    // Build set of image IDs and repo:tag refs currently in use
    const usedIds = new Set();
    const usedRefs = new Set();
    for (const c of containers) {
      if (c.ImageID) usedIds.add(c.ImageID.replace(/^sha256:/, ''));
      if (c.Image) usedRefs.add(c.Image);
    }

    const result = images.map((img) => {
      const id = (img.Id || '').replace(/^sha256:/, '');
      const tags = img.RepoTags || [];
      const digests = img.RepoDigests || [];

      const inUse = usedIds.has(id) || tags.some((t) => usedRefs.has(t));

      return {
        id,
        shortId: id.slice(0, 12),
        tags: tags.filter((t) => t !== '<none>:<none>'),
        digests,
        size: img.Size || 0,
        created: img.Created || 0,
        inUse,
        // Dangling = no tag and no digest reference
        dangling: tags.every((t) => t === '<none>:<none>') && digests.length === 0,
      };
    });

    // Sort: in-use first, then by size desc
    result.sort((a, b) => {
      if (a.inUse !== b.inUse) return a.inUse ? -1 : 1;
      return b.size - a.size;
    });

    res.json({ images: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/images/:id — remove an image
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    // Basic safety: reject if it looks like a flag
    if (!/^[a-f0-9]{12,64}$/.test(id) && !/^[a-zA-Z0-9]/.test(id)) {
      return res.status(400).json({ error: 'Invalid image id' });
    }
    await runDocker(['rmi', id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/images — prune all unused images
router.delete('/', async (req, res) => {
  try {
    const out = await runDocker(['image', 'prune', '-f']);
    res.json({ ok: true, output: out });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
