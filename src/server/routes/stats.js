'use strict';

const express = require('express');
const { execFile } = require('child_process');

const router = express.Router();

function parseBytes(str) {
  if (!str) return 0;
  const m = String(str).trim().match(/^([\d.]+)\s*(B|kB|MB|GB|TB|KiB|MiB|GiB|TiB)?/i);
  if (!m) return 0;
  const val = parseFloat(m[1]);
  const unit = (m[2] || 'B').toLowerCase();
  const map = { b: 1, kb: 1e3, kib: 1024, mb: 1e6, mib: 1048576, gb: 1e9, gib: 1073741824, tb: 1e12, tib: 1099511627776 };
  return val * (map[unit] || 1);
}

// GET /api/stats — aggregate CPU, memory, network, disk across all running containers
router.get('/', (req, res) => {
  const os = require('os');
  const cpuCores = os.cpus().length;

  execFile('docker', ['stats', '--no-stream', '--format', '{{json .}}'], { timeout: 15000 }, (err, stdout) => {
    if (err || !stdout.trim()) {
      return res.json({ cpu: 0, memUsed: 0, memTotal: 0, netIn: 0, netOut: 0, blkIn: 0, blkOut: 0, containers: 0, cpuCores });
    }

    let totalCpu = 0, totalMemUsed = 0, totalMemTotal = 0, totalNetIn = 0, totalNetOut = 0, totalBlkIn = 0, totalBlkOut = 0, count = 0;

    for (const line of stdout.trim().split('\n')) {
      try {
        const s = JSON.parse(line);
        totalCpu += parseFloat(s.CPUPerc) || 0;
        const [mu, mt] = (s.MemUsage || '').split('/');
        totalMemUsed += parseBytes(mu);
        if (totalMemTotal === 0) totalMemTotal = parseBytes(mt);
        const [ni, no] = (s.NetIO || '').split('/');
        totalNetIn  += parseBytes(ni);
        totalNetOut += parseBytes(no);
        const [bi, bo] = (s.BlockIO || '').split('/');
        totalBlkIn  += parseBytes(bi);
        totalBlkOut += parseBytes(bo);
        count++;
      } catch {}
    }

    res.json({
      cpu: Math.round((totalCpu / cpuCores) * 10) / 10,
      cpuCores,
      memUsed: totalMemUsed,
      memTotal: totalMemTotal,
      netIn: totalNetIn,
      netOut: totalNetOut,
      blkIn: totalBlkIn,
      blkOut: totalBlkOut,
      containers: count,
    });
  });
});

module.exports = router;
