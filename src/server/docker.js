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
 * Get container inspect info.
 */
async function inspectContainer(nameOrId) {
  const container = docker.getContainer(nameOrId);
  return container.inspect();
}

module.exports = { docker, listContainers, inspectContainer };
