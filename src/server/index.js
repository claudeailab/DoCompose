'use strict';

const express = require('express');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');

const servicesRouter = require('./routes/services');
const filesRouter = require('./routes/files');
const logsRouter = require('./routes/logs');
const backupsRouter = require('./routes/backups');
const searchRouter = require('./routes/search');
const statsRouter = require('./routes/stats');
const settingsRouter = require('./routes/settings');
const { router: onedriveRouter } = require('./routes/onedrive');
const { router: dropboxRouter } = require('./routes/dropbox');
const imagesRouter = require('./routes/images');
const backupScheduler = require('./backup-scheduler');
const updateScheduler = require('./update-scheduler');
const { handleTerminal } = require('./terminal');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws/terminal' });

const PORT = process.env.PORT || 8094;
const PUBLIC_DIR = path.join(__dirname, '../public');

app.use(express.json({ limit: '10mb' }));
app.use(express.static(PUBLIC_DIR));

// API routes
app.use('/api/services', servicesRouter);
app.use('/api/stats', statsRouter);
app.use('/api/files', filesRouter);
app.use('/api/logs', logsRouter);
app.use('/api/backups', backupsRouter);
app.use('/api/search', searchRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/onedrive', onedriveRouter);
app.use('/api/dropbox', dropboxRouter);
app.use('/api/images', imagesRouter);

// Version endpoint
app.get('/api/version', (req, res) => {
  const pkg = require('../../package.json');
  res.json({ version: pkg.version });
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// WebSocket terminal
wss.on('connection', handleTerminal);

server.listen(PORT, () => {
  console.log(`DoCompose listening on port ${PORT}`);
  console.log(`COMPOSE_DIR: ${process.env.COMPOSE_DIR || '/compose'}`);
  backupScheduler.init();
  updateScheduler.init();
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

// Keep the process alive through stray async failures (SSE/backup paths) instead
// of crashing the whole app.
process.on('unhandledRejection', (err) => console.error('Unhandled promise rejection:', err));
process.on('uncaughtException', (err) => console.error('Uncaught exception:', err));
