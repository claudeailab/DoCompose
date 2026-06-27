# DoCompose

**DoCompose** is a self-hosted web app for managing Docker Compose projects from your browser.

![DoCompose Dashboard](docs/screenshot.png)

---

## Features

- **Live service dashboard** — See all containers at a glance with real-time status, health indicators, and resource usage (CPU, memory, network).
- **Per-container controls** — Start, stop, restart, and recreate individual containers with a single click.
- **Update detection** — Check for new image versions without pulling; apply updates manually when you're ready.
- **Integrated logs viewer** — Stream container logs in real time directly from the browser.
- **Built-in terminal** — Open an interactive shell inside any running container.
- **YAML configuration editor** — Edit `docker-compose.yml` per service with validation before saving.
- **Environment variable editor** — View and edit `.env` files alongside your Compose configuration.
- **Search** — Search across services, ports, volumes, and environment variables instantly.
- **Health indicators** — Visual healthcheck status on every service card and in the sidebar.
- **Mobile-friendly** — Fully functional on phone and tablet, not just desktop.
- **Dark / light mode** — Automatically follows your system preference; manually toggleable.

---

## Getting Started

Add DoCompose to your `docker-compose.yml`:

```yaml
services:

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
      - /var/run/docker.sock:/var/run/docker.sock
      - /path/to/your/compose/projects:/compose
    healthcheck:
      test:
        - CMD
        - wget
        - -q
        - -O
        - /dev/null
        - http://localhost:8094/api/health
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
```

Start it:

```bash
docker compose up -d docompose
```

Open `http://your-host:8094` in your browser.

---

## Updating

```bash
docker compose pull docompose && docker compose up -d docompose
```

