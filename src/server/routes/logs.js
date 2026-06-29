'use strict';

const express = require('express');
const http = require('http');
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

  // Immediate comment keeps the connection alive and triggers onopen in the browser
  res.write(': connected\n\n');

  const send = (line) => {
    const t = String(line || '').trimEnd();
    if (!t) return;
    try { res.write(`data: ${JSON.stringify(t)}\n\n`); } catch {}
  };

  let dockerReq = null;
  req.on('close', () => { if (dockerReq) { try { dockerReq.destroy(); } catch {} } });

  try {
    // Resolve container name → Docker ID via name match or compose service label
    const containers = await listContainers();
    const found =
      containers.find((c) => c.Names && c.Names.some((n) => n.replace(/^\//, '') === containerName)) ||
      containers.find((c) => (c.Labels || {})['com.docker.compose.service'] === containerName);

    if (!found) {
      send(`[DoCompose] container "${containerName}" not found`);
      res.end();
      return;
    }

    // Stream logs directly from Docker Engine API via Unix socket —
    // avoids Dockerode stream-timing quirks and any intermediate buffering.
    const logPath = `/containers/${encodeURIComponent(found.Id)}/logs?follow=1&stdout=1&stderr=1&tail=${tail}&timestamps=1`;

    dockerReq = http.request({ socketPath: '/var/run/docker.sock', path: logPath, method: 'GET' }, (dockerRes) => {
      if (dockerRes.statusCode !== 200) {
        send(`[DoCompose] Docker API returned HTTP ${dockerRes.statusCode}`);
        res.end();
        return;
      }

      let pending = Buffer.alloc(0);
      // Detected once from the first frame's leading byte: 0/1/2 = multiplexed, anything else = TTY raw
      let muxDetected = false;
      let isMux = false;

      dockerRes.on('data', (chunk) => {
        pending = Buffer.concat([pending, chunk]);

        if (!muxDetected && pending.length >= 1) {
          muxDetected = true;
          isMux = pending[0] === 0 || pending[0] === 1 || pending[0] === 2;
        }

        if (!isMux) {
          // TTY container — raw byte stream, no 8-byte headers
          const text = pending.toString('utf8');
          pending = Buffer.alloc(0);
          text.split('\n').forEach(send);
          return;
        }

        // Multiplexed Docker stream: [type(1), pad(3), size(4)] then payload
        while (pending.length >= 8) {
          const frameSize = pending.readUInt32BE(4);
          if (pending.length < 8 + frameSize) break; // wait for full frame
          const payload = pending.slice(8, 8 + frameSize).toString('utf8');
          pending = pending.slice(8 + frameSize);
          payload.split('\n').forEach(send);
        }
      });

      dockerRes.on('end', () => {
        if (pending.length > 0) send(pending.toString('utf8'));
        res.write('event: close\ndata: "stream ended"\n\n');
        res.end();
      });

      dockerRes.on('error', (err) => { send(`[DoCompose] stream error: ${err.message}`); res.end(); });
    });

    dockerReq.on('error', (err) => { send(`[DoCompose] docker error: ${err.message}`); res.end(); });
    dockerReq.end();

  } catch (err) {
    send(`[DoCompose] error: ${err.message}`);
    res.end();
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
