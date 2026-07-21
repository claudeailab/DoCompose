'use strict';

const cron = require('node-cron');
const { readSettings, writeSettings } = require('./routes/settings');

const activeTasks = new Map();

// Convert GUI schedule fields to a cron expression
function toCron(entry) {
  const h = parseInt(entry.hour || 0, 10);
  const m = parseInt(entry.minute || 0, 10);
  switch (entry.frequency) {
    case 'once':     return `${m} ${h} * * *`; // fires daily at time; auto-disabled after first run
    case 'hourly':   return `${m} * * * *`;
    case 'every6h':  return `${m} */6 * * *`;
    case 'every12h': return `${m} */12 * * *`;
    case 'daily':    return `${m} ${h} * * *`;
    case 'weekly': {
      const wd = parseInt(entry.weekday || 0, 10);
      return `${m} ${h} * * ${wd}`;
    }
    default: return null;
  }
}
module.exports.toCron = toCron;

async function runUpdateJob(entry) {
  const { serviceName, project = '', id } = entry;
  console.log(`[UpdateScheduler] Running scheduled update for "${serviceName}" (project: ${project || 'default'})`);

  const { recreateContainerViaApi, getContainerName } = require('./routes/services');

  const updateJobStatus = (status) => {
    const s = readSettings();
    const jobs = s.updateSchedules || [];
    const idx = jobs.findIndex((j) => j.id === id);
    if (idx !== -1) {
      const runAt = new Date().toISOString();
      jobs[idx].lastStatus = status;
      jobs[idx].lastRun = runAt;
      // Append to run history (cap at 20 entries, newest first)
      const hist = jobs[idx].history || [];
      hist.unshift({ runAt, status });
      if (hist.length > 20) hist.length = 20;
      jobs[idx].history = hist;
      // Once-off: disable after first run
      if (jobs[idx].frequency === 'once') {
        jobs[idx].enabled = false;
        const task = activeTasks.get(id);
        if (task) { try { task.stop(); } catch {} activeTasks.delete(id); }
      }
      s.updateSchedules = jobs;
      writeSettings(s);
    }
  };

  try {
    const containerName = await getContainerName(project, serviceName);
    await recreateContainerViaApi(containerName, true);
    updateJobStatus('ok');
    console.log(`[UpdateScheduler] Update complete for "${serviceName}"`);
  } catch (err) {
    console.error(`[UpdateScheduler] Update failed for "${serviceName}": ${err.message}`);
    updateJobStatus('error: ' + err.message);
  }
}
module.exports.runUpdateJob = runUpdateJob;

function scheduleJobs() {
  for (const task of activeTasks.values()) {
    try { task.stop(); } catch {}
  }
  activeTasks.clear();

  const settings = readSettings();
  const jobs = settings.updateSchedules || [];
  const tz = settings.timezone || process.env.TZ || 'UTC';

  for (const entry of jobs) {
    if (!entry.enabled || !entry.frequency) continue;
    const expression = toCron(entry);
    if (!expression || !cron.validate(expression)) {
      console.warn(`[UpdateScheduler] Invalid schedule for "${entry.serviceName}": ${expression}`);
      continue;
    }
    const task = cron.schedule(
      expression,
      () => runUpdateJob(entry).catch(() => {}),
      { timezone: tz }
    );
    activeTasks.set(entry.id, task);
    console.log(`[UpdateScheduler] Scheduled "${entry.serviceName}" (${expression}) tz=${tz}`);
  }
}
module.exports.scheduleJobs = scheduleJobs;

function reschedule() { scheduleJobs(); }
module.exports.reschedule = reschedule;

function init() { scheduleJobs(); }
module.exports.init = init;
