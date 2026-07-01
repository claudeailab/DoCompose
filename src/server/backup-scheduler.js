'use strict';

const cron = require('node-cron');
const path = require('path');
const { readSettings, writeSettings } = require('./routes/settings');

const activeTasks = new Map();

async function runJob(job) {
  console.log(`[Backup] Running job "${job.label || job.id}" for ${job.containerName}`);
  const settings = readSettings();
  const destination = job.destination || 'onedrive';
  const folderPath = (settings.backupFolderPath || 'DoCompose Backups').replace(/^\/|\/$/g, '');

  let getValidToken, uploadFile, listFolder, deleteItem, isFolder;

  if (destination === 'dropbox') {
    ({ getValidToken, uploadFile, listFolder, deleteItem } = require('./routes/dropbox'));
    isFolder = (item) => item['.tag'] === 'folder';
  } else {
    ({ getValidToken, uploadFile, listFolder, deleteItem } = require('./routes/onedrive'));
    isFolder = (item) => item.folder;
  }

  const updateJobStatus = (status) => {
    const s = readSettings();
    const jobs = s.backupJobs || [];
    const idx = jobs.findIndex((j) => j.id === job.id);
    if (idx !== -1) {
      jobs[idx].lastStatus = status;
      jobs[idx].lastRun = new Date().toISOString();
      s.backupJobs = jobs;
      writeSettings(s);
    }
  };

  try {
    const token = await getValidToken();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
    const snapshotBase = `${folderPath}/${job.containerName}/${timestamp}`;

    for (const localBase of (job.paths || [])) {
      const { walkDir } = require('./routes/onedrive');
      const files = walkDir(localBase, localBase);
      const isFile = files.length === 1 && files[0].local === localBase;
      const baseName = path.basename(localBase.replace(/\/$/, ''));

      for (const { local, relative } of files) {
        const remotePath = isFile
          ? `${snapshotBase}/${relative}`
          : `${snapshotBase}/${baseName}/${relative}`;
        try {
          await uploadFile(token, local, remotePath);
        } catch (err) {
          console.warn(`[Backup] Failed to upload ${local}: ${err.message}`);
        }
      }
    }

    // Rotation
    const keepCount = job.keepCount || 10;
    try {
      const containerFolder = `${folderPath}/${job.containerName}`;
      const children = await listFolder(token, containerFolder);
      const snapshots = children
        .filter(isFolder)
        .sort((a, b) => a.name.localeCompare(b.name));

      if (snapshots.length > keepCount) {
        const toDelete = snapshots.slice(0, snapshots.length - keepCount);
        for (const item of toDelete) {
          // OneDrive uses item.id; Dropbox uses item.path_lower
          await deleteItem(token, item.id || item.path_lower);
          console.log(`[Backup] Rotated old snapshot: ${item.name}`);
        }
      }
    } catch (err) {
      console.warn(`[Backup] Rotation failed: ${err.message}`);
    }

    updateJobStatus('ok');
    console.log(`[Backup] Job "${job.label || job.id}" completed`);
  } catch (err) {
    console.error(`[Backup] Job "${job.label || job.id}" failed: ${err.message}`);
    updateJobStatus('error: ' + err.message);
    throw err;
  }
}
module.exports.runJob = runJob;

function scheduleJobs() {
  for (const task of activeTasks.values()) {
    try { task.stop(); } catch {}
  }
  activeTasks.clear();

  const settings = readSettings();

  for (const job of (settings.backupJobs || [])) {
    if (!job.enabled || !job.schedule) continue;
    if (!cron.validate(job.schedule)) {
      console.warn(`[Backup] Invalid cron for job "${job.id}": ${job.schedule}`);
      continue;
    }
    const task = cron.schedule(job.schedule, () => runJob(job).catch(() => {}));
    activeTasks.set(job.id, task);
    console.log(`[Backup] Scheduled job "${job.label || job.id}" (${job.schedule})`);
  }
}
module.exports.scheduleJobs = scheduleJobs;

function reschedule() { scheduleJobs(); }
module.exports.reschedule = reschedule;

function init() { scheduleJobs(); }
module.exports.init = init;
