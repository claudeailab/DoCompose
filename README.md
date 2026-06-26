# DoCompose

**DoCompose** is a self-hosted web application for managing Docker Compose projects through an intuitive browser-based interface.

Running as its own Docker container, DoCompose mounts the Docker host's Compose project directory and provides a structured interface for editing, validating, and maintaining `docker-compose.yml` and `.env` files.

Rather than treating the Compose file as plain text, DoCompose understands each service as an individual managed entity. Users can modify service configuration through a graphical interface while preserving a clean, consistent, and predictable Compose file.

---

## Features

- **Interactive Compose editor** — Edit `docker-compose.yml` through a graphical interface without touching raw YAML directly.
- **Native `.env` management** — View and edit environment variable files alongside your Compose configuration.
- **Integrated web terminal** — Run Docker and shell commands directly from the browser.
- **Service-centric interface** — Each container is a first-class entity with its own view and controls.
- **Automatic rebuild & redeploy** — Apply configuration changes instantly without leaving the UI.
- **Validation before saving** — Docker Compose validation runs before any file is written to disk.
- **YAML formatting & normalization** — Keeps your Compose file clean and consistently formatted.
- **Alphabetical service sorting** — Services are always sorted A–Z for easy navigation.
- **Consistent key ordering** — Keys within every service follow a predefined order.
- **Comment preservation** — Inline and block comments are retained wherever possible.
- **Change detection** — Highlights configuration drift since the last known good state.
- **One-click backup & restore** — Snapshot your Compose files and roll back at any time.
- **Live Docker status monitoring** — Real-time health and status indicators for all services.
- **Container logs viewer** — Stream and browse logs for any container from the browser.
- **Per-service controls** — Start, stop, restart, recreate, pull, and rebuild individual services.
- **Docker Compose profiles support** — Activate and manage named profiles from the UI.
- **Read-only mode** — Monitor installations without the ability to make changes.
- **Built-in search** — Search across services, volumes, networks, ports, and environment variables.

---

## Smart Organization

DoCompose automatically maintains a clean Compose file by:

- Sorting services alphabetically
- Keeping keys in a consistent predefined order
- Removing duplicate entries where applicable
- Standardizing indentation and formatting
- Grouping related configuration together
- Maintaining a predictable file structure regardless of who edits it

The result is a Compose file that remains easy to read and maintain, even as it grows to hundreds of services.

---

## Web Interface

The web interface is designed for large Compose projects and includes:

- Service list with health and status indicators
- Expandable service editor
- YAML editor with syntax highlighting
- Environment variable editor
- Interactive terminal
- Container logs viewer
- File browser for Compose project files
- Change preview before saving
- Validation errors displayed inline

By default, DoCompose is available on **port 8094**.

---

## Architecture

DoCompose runs as a Docker container with access to:

- Docker Engine (`/var/run/docker.sock`)
- Compose project directory
- `docker-compose.yml`
- `.env`
- Optional override files

Changes are written directly to the Compose project and can be immediately applied using Docker Compose.

---

## Getting Started

Add the following to your `docker-compose.yml`:

```yaml
docompose:
  image: ghcr.io/claudeailab/docompose
  container_name: docompose
  hostname: docompose
  restart: unless-stopped
  user: "0"
  environment:
    TZ: ${TZ}
  ports:
    - 8094:8094
  volumes:
    - ./config/docompose:/data
    - /var/run/docker.sock:/var/run/docker.sock
    - /path/to/your/compose/projects:/compose
```

Then start the container:

```bash
docker compose up -d docompose
```

Open your browser and navigate to `http://your-host:8094`.

---

## Updating

```bash
docker compose pull docompose && docker compose up -d docompose
```

---

## Design Goals

DoCompose is built around four principles:

- **Consistency** — every Compose file follows the same structure.
- **Safety** — validate changes before deployment and support rollback.
- **Simplicity** — manage complex Compose projects without manually editing YAML.
- **Transparency** — every change is visible, predictable, and reversible.

---

## Future Features

- Version history with rollback
- Git integration for configuration tracking
- Scheduled backups
- Secrets management
- Visual dependency graph (`depends_on`)
- Network and volume visualization
- Template library for common services
- Multi-project dashboard
- Health check monitoring
- Update notifications for container images
- Image tag comparison
- Environment variable inheritance
- Compose file linting
- Dark mode
- User authentication and role-based permissions
- REST API
- Webhooks for automation
- Plugin system
- Import existing Compose projects automatically
- Diff viewer before deployment
- Dry-run mode to preview changes
