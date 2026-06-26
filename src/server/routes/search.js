'use strict';

const express = require('express');
const { readCompose } = require('../compose');

const router = express.Router();

// GET /api/search?q=<query>&project=<dir>
router.get('/', (req, res) => {
  const q = (req.query.q || '').toLowerCase().trim();
  const projectDir = req.query.project || '';

  if (!q) return res.json({ results: [] });

  let parsed;
  try {
    ({ parsed } = readCompose(projectDir));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  const results = [];

  if (!parsed || !parsed.services) {
    return res.json({ results });
  }

  for (const [serviceName, config] of Object.entries(parsed.services)) {
    if (!config) continue;

    const matches = [];

    // Match service name
    if (serviceName.toLowerCase().includes(q)) {
      matches.push({ field: 'service', value: serviceName });
    }

    // Match image
    if (config.image && String(config.image).toLowerCase().includes(q)) {
      matches.push({ field: 'image', value: config.image });
    }

    // Match ports
    if (Array.isArray(config.ports)) {
      for (const p of config.ports) {
        if (String(p).toLowerCase().includes(q)) {
          matches.push({ field: 'port', value: String(p) });
        }
      }
    }

    // Match volumes
    if (Array.isArray(config.volumes)) {
      for (const v of config.volumes) {
        if (String(v).toLowerCase().includes(q)) {
          matches.push({ field: 'volume', value: String(v) });
        }
      }
    }

    // Match networks
    if (config.networks) {
      const nets = Array.isArray(config.networks) ? config.networks : Object.keys(config.networks);
      for (const n of nets) {
        if (String(n).toLowerCase().includes(q)) {
          matches.push({ field: 'network', value: String(n) });
        }
      }
    }

    // Match environment
    if (config.environment) {
      const envs = Array.isArray(config.environment)
        ? config.environment
        : Object.entries(config.environment).map(([k, v]) => `${k}=${v}`);
      for (const e of envs) {
        if (String(e).toLowerCase().includes(q)) {
          matches.push({ field: 'env', value: String(e) });
        }
      }
    }

    if (matches.length > 0) {
      results.push({ service: serviceName, matches });
    }
  }

  res.json({ results });
});

module.exports = router;
