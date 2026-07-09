'use strict';

const cron = require('node-cron');
const { readSettings, writeSettings } = require('./routes/settings');

const activeTasks = new Map();

async function runUpdateJob(key, serviceName, project) {
  console.log(`[UpdateScheduler] Running scheduled update for "${serviceName}" (project: ${project || 'default'})`);

  const { recreateContainerViaApi, getContainerName } = require('./routes/services');

  const updateJobStatus = (status) => {
    const s = readSettings();
    const schedules = s.updateSchedules || {};
    if (schedules[key]) {
      schedules[key].lastStatus = status;
      schedules[key].lastRun = new Date().toISOString();
      s.updateSchedules = schedules;
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
  const schedules = settings.updateSchedules || {};
  const tz = settings.timezone || process.env.TZ || 'UTC';

  for (const [key, entry] of Object.entries(schedules)) {
    if (!entry.enabled || !entry.schedule) continue;
    if (!cron.validate(entry.schedule)) {
      console.warn(`[UpdateScheduler] Invalid cron for "${key}": ${entry.schedule}`);
      continue;
    }
    const sepIdx = key.indexOf('::');
    const project = key.slice(0, sepIdx);
    const serviceName = key.slice(sepIdx + 2);

    const task = cron.schedule(
      entry.schedule,
      () => runUpdateJob(key, serviceName, project).catch(() => {}),
      { timezone: tz }
    );
    activeTasks.set(key, task);
    console.log(`[UpdateScheduler] Scheduled "${serviceName}" (${entry.schedule}) tz=${tz}`);
  }
}
module.exports.scheduleJobs = scheduleJobs;

function reschedule() { scheduleJobs(); }
module.exports.reschedule = reschedule;

function init() { scheduleJobs(); }
module.exports.init = init;
