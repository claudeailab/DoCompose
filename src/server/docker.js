'use strict';

const Dockerode = require('dockerode');

const docker = new Dockerode({ socketPath: '/var/run/docker.sock' });

/**
 * Get all containers with their status.
 */
async function listContainers() {
  const containers = await docker.listContainers({ all: true });
  return containers;
}

/**
 * Get a container by name or id.
 */
function getContainer(nameOrId) {
  return docker.getContainer(nameOrId);
}

/**
 * Find container by service name (matches container name or label).
 */
async function findContainerByService(serviceName) {
  const containers = await docker.listContainers({ all: true });
  const match = containers.find((c) => {
    const names = c.Names || [];
    return names.some((n) => n.replace(/^\//, '') === serviceName);
  });
  if (!match) return null;
  return docker.getContainer(match.Id);
}

/**
 * Pull an image and stream progress via callback.
 */
async function pullImage(imageName, onProgress) {
  return new Promise((resolve, reject) => {
    docker.pull(imageName, (err, stream) => {
      if (err) return reject(err);
      docker.modem.followProgress(stream, (err2, output) => {
        if (err2) return reject(err2);
        resolve(output);
      }, onProgress);
    });
  });
}

/**
 * Stream container logs to a writable/callback.
 */
async function streamLogs(containerId, { tail = 100, since = 0 } = {}, onData, onEnd) {
  const container = docker.getContainer(containerId);
  const stream = await container.logs({
    stdout: true,
    stderr: true,
    follow: true,
    tail,
    since,
    timestamps: true,
  });

  stream.on('data', (chunk) => {
    // Docker multiplexed stream: 8-byte header then payload
    try {
      let offset = 0;
      while (offset < chunk.length) {
        if (chunk.length < offset + 8) break;
        const size = chunk.readUInt32BE(offset + 4);
        const payload = chunk.slice(offset + 8, offset + 8 + size);
        onData(payload.toString('utf8'));
        offset += 8 + size;
      }
    } catch {
      onData(chunk.toString('utf8'));
    }
  });

  stream.on('end', () => { if (onEnd) onEnd(); });
  stream.on('error', (err) => { if (onEnd) onEnd(err); });

  return stream;
}

/**
 * Get container inspect info.
 */
async function inspectContainer(nameOrId) {
  const container = docker.getContainer(nameOrId);
  return container.inspect();
}

module.exports = { docker, listContainers, getContainer, findContainerByService, pullImage, streamLogs, inspectContainer };
