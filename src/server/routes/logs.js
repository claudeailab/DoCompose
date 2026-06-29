'use strict';

const express = require('express');
const { listContainers } = require('../docker');
const { execFile } = require('child_process');

const router = express.Router();

// GET /api/logs/:containerName — SSE stream
router.get('/:containerName', async (req, res) => {
  const { containerName } = req.params;
  const tailParam = req.query.tail;
  const tail = tailParam === 'all' ? 'all' : (parseInt(tailParam, 10) || 100);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const sendEvent = (data) => {
    const lines = String(data).split('\n');
    for (const line of lines) {
      res.write(`data: ${JSON.stringify(line)}\n\n`);
    }
  };

  // Use docker logs command directly — it handles multiplexing properly
  const proc = execFile('docker', ['logs', '--follow', '--tail', String(tail), '--timestamps', '--details', containerName], {
    maxBuffer: 10 * 1024 * 1024,
  });

  if (!proc.stdout || !proc.stderr) {
    res.write('event: error\ndata: "Failed to spawn docker logs"\n\n');
    res.end();
    return;
  }

  proc.stdout.on('data', sendEvent);
  proc.stderr.on('data', sendEvent);

  proc.on('close', () => {
    res.write('event: close\ndata: "stream ended"\n\n');
    res.end();
  });

  req.on('close', () => {
    try { proc.kill(); } catch {}
  });
});

// GET /api/logs — list containers
router.get('/', async (req, res) => {
  try {
    const containers = await listContainers();
    const list = containers.map((c) => ({
      id: c.Id,
      name: (c.Names || []).map((n) => n.replace(/^\//, '')).join(', '),
      state: c.State,
      status: c.Status,
    }));
    res.json({ containers: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
