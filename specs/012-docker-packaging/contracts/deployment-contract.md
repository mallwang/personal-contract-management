# Deployment Contract: Docker Configuration

**Feature**: 012-docker-packaging  
**Date**: 2026-06-06

This document defines the authoritative interface for deploying the application via Docker. Any change to an environment variable name, volume path, or default value is a breaking change that requires updating both this contract and the `docker-compose.yml`.

---

## Environment Variables

```
DATABASE_PATH   string   /data/contracts.db   Path to SQLite file inside container
PORT            string   3000                 Internal HTTP port Fastify listens on
NODE_ENV        string   production           Enables static file serving
```

### Rules

- `DATABASE_PATH` MUST resolve to a path inside the `/data` volume mount so the file persists on the host.
- `PORT` changes the internal container port; the `docker-compose.yml` host mapping must be updated in sync.
- `NODE_ENV=production` is required for the frontend to be served from the container. Any other value disables static file serving (API-only mode).

---

## Volume Mount

```
Host path (operator-chosen)  →  /data  (container)
```

The bind-mount path on the host is left to the operator. The recommended default in `docker-compose.yml` is `./data:/data` (a `data/` subdirectory relative to where compose runs).

The application creates `contracts.db` inside this directory on first start. The directory does not need to pre-exist.

---

## Port Mapping (docker-compose.yml)

```
HOST_PORT : 3001  →  CONTAINER_PORT : 3000
```

To change the host port, edit the `ports:` line in `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"   # change 3001 to any available host port
```

The container port (`3000`) does not need to change unless `PORT` is overridden in the environment block.

---

## Image

The container image is built from the repository root using:

```
docker build -t pcm .
```

or pulled from a registry (if published). There is no required image name — operators may tag and push the image under any name they choose.

---

## Compose Reference (canonical)

```yaml
services:
  app:
    image: pcm
    build: .
    ports:
      - "3001:3000"
    environment:
      NODE_ENV: production
      DATABASE_PATH: /data/contracts.db
    volumes:
      - ./data:/data
    restart: unless-stopped
```
