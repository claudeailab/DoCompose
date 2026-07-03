'use strict';

const express = require('express');
const { spawn } = require('child_process');
const { listContainers } = require('../docker');

const router = express.Router();

// GET /api/logs/:containerName — SSE stream
router.get('/:containerName', async (req, res) => {
  const containerName = req.params.containerName;
  const tailParam = req.query.tail;
  const tail = tailParam === 'all' ? 'all' : String(Math.max(1, parseInt(tailParam, 10) || 100));

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (res.socket) res.socket.setNoDelay(true);
  res.flushHeaders();

  // Guarded writer — never throws if the client already disconnected.
  const safeWrite = (s) => { if (res.writableEnded) return false; try { res.write(s); return true; } catch { return false; } };

  safeWrite(': connected\n\n');

  const send = (line) => {
    const t = String(line || '').trimEnd();
    if (!t) return;
    safeWrite(`data: ${JSON.stringify(t)}\n\n`);
  };

  try {
    // Resolve container name → actual Docker container name/ID
    const containers = await listContainers();
    const found =
      containers.find((c) => c.Names && c.Names.some((n) => n.replace(/^\//, '') === containerName)) ||
      containers.find((c) => (c.Labels || {})['com.docker.compose.service'] === containerName);

    if (!found) {
      send(`[DoCompose] container "${containerName}" not found`);
      safeWrite('event: close\ndata: "stream ended"\n\n');
      if (!res.writableEnded) res.end();
      return;
    }

    const actualName = (found.Names || [])[0]
      ? found.Names[0].replace(/^\//, '')
      : found.Id;

    const proc = spawn('docker', ['logs', '-f', '--tail', tail, '-t', actualName]);

    const cleanup = () => { try { proc.kill(); } catch {} };
    req.on('close', cleanup);

    let buf = '';
    const handleChunk = (chunk) => {
      buf += chunk.toString('utf8');
      const lines = buf.split('\n');
      buf = lines.pop(); // keep incomplete last line
      lines.forEach(send);
    };

    proc.stdout.on('data', handleChunk);
    proc.stderr.on('data', handleChunk);

    proc.on('close', () => {
      if (buf) send(buf);
      safeWrite('event: close\ndata: "stream ended"\n\n');
      if (!res.writableEnded) { try { res.end(); } catch {} }
    });

    proc.on('error', (err) => {
      send(`[DoCompose] docker error: ${err.message}`);
      safeWrite('event: close\ndata: "stream ended"\n\n');
      if (!res.writableEnded) { try { res.end(); } catch {} }
    });

  } catch (err) {
    send(`[DoCompose] error: ${err.message}`);
    safeWrite('event: close\ndata: "stream ended"\n\n');
    if (!res.writableEnded) { try { res.end(); } catch {} }
  }
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
