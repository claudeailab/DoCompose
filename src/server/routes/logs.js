'use strict';

const express = require('express');
const { docker, listContainers } = require('../docker');

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

  const sendLine = (text) => {
    const t = String(text || '');
    if (!t.trim()) return;
    res.write(`data: ${JSON.stringify(t)}\n\n`);
  };

  let logStream = null;

  req.on('close', () => {
    if (logStream) { try { logStream.destroy(); } catch {} logStream = null; }
  });

  try {
    // Find the container — try by exact name, then by compose service label
    const containers = await listContainers();
    const found = containers.find((c) =>
      c.Names && c.Names.some((n) => n.replace(/^\//, '') === containerName)
    ) || containers.find((c) => {
      const labels = c.Labels || {};
      return labels['com.docker.compose.service'] === containerName;
    });

    if (!found) {
      sendLine(`Error: container "${containerName}" not found`);
      res.end();
      return;
    }

    const container = docker.getContainer(found.Id);
    const info = await container.inspect();
    const isTTY = info && info.Config && info.Config.Tty;

    logStream = await container.logs({
      stdout: true,
      stderr: true,
      follow: true,
      tail,
      timestamps: true,
    });

    let buf = '';
    logStream.on('data', (chunk) => {
      let text = '';
      if (isTTY) {
        text = chunk.toString('utf8');
      } else {
        // Demultiplex Docker attach stream (8-byte header: [stream_type, 0, 0, 0, size(4 bytes)])
        try {
          let offset = 0;
          const parts = [];
          while (offset < chunk.length) {
            if (offset + 8 > chunk.length) break;
            const size = chunk.readUInt32BE(offset + 4);
            if (offset + 8 + size > chunk.length) {
              // Incomplete frame — fall back to raw string for the remainder
              parts.push(chunk.slice(offset).toString('utf8'));
              break;
            }
            parts.push(chunk.slice(offset + 8, offset + 8 + size).toString('utf8'));
            offset += 8 + size;
          }
          text = parts.join('');
        } catch {
          text = chunk.toString('utf8');
        }
      }

      buf += text;
      const lines = buf.split('\n');
      buf = lines.pop(); // keep incomplete trailing line in buffer
      lines.forEach(sendLine);
    });

    logStream.on('end', () => {
      if (buf) sendLine(buf);
      res.write('event: close\ndata: "stream ended"\n\n');
      res.end();
    });

    logStream.on('error', (err) => {
      sendLine(`Stream error: ${err.message}`);
      res.end();
    });

  } catch (err) {
    sendLine(`Error: ${err.message}`);
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
