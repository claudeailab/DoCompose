# CLAUDE.md — Project Guidelines

## Build & CI

- Always build the project package after any changes.
- Every time a change is complete, trigger the GitHub Actions workflow to build.
- Always push to `main`, merge branches and pull requests, then run the build action.
- The web app is always built as a Docker container targeting **both x86 (amd64) and ARM (arm64)**.
- The Docker image is always hosted on the **GitHub Container Registry (ghcr.io)**.

## Branches

- Only `main` should exist. No other long-lived branches.
- Merge all changes into `main` promptly and delete the source branch after merging.

## Versioning

- Always display a discreet version number in the web app UI (e.g. footer or corner badge).
- Bump the version number with every push/release.

## UI / UX

- The interface must be modern, intuitive, and easy on the eyes.
- The web app must be fully functional and intuitive on both **desktop and mobile**.

## Docker Compose Template

Use the following as the template for `docker-compose.yml`, replacing `${project_name}` with the actual project name. Port is specified per project.

```yaml
${project_name}:
  image: ghcr.io/${account_name}/${project_name}
  container_name: ${project_name}
  hostname: ${project_name}
  restart: unless-stopped
  user: "0"
  environment:
    TZ: ${TZ}
  ports:
    - ${port}:${port}
  volumes:
    - ./config/${project_name}:/data
```

## README Requirements

- Include a **Features** section with bullet points and a short description of each feature.
- Include an **Updating** section with the following command (replace `${project_name}` with the actual project name):

```bash
docker compose pull ${project_name} && docker compose up -d ${project_name}
```
