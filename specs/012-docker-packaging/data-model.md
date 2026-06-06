# Data Model: Docker Packaging

**Phase**: 1 — Design  
**Branch**: `012-docker-packaging`  
**Date**: 2026-06-06

---

## Overview

This feature introduces no new data entities. All contract data continues to be stored in the existing SQLite schema (see `packages/backend/src/db/schema.sql`). The only data-layer concern for this feature is **where** the database file lives at runtime and how that location is communicated to the application.

---

## Runtime Configuration Model

The container is configured entirely through environment variables and a volume mount. The following table describes each configuration value:

| Name            | Type   | Default (container) | Required | Description |
|-----------------|--------|---------------------|----------|-------------|
| `DATABASE_PATH` | string | `/data/contracts.db` | Yes (set in compose) | Absolute path to the SQLite database file inside the container. Must resolve to a location that is bind-mounted to the host. |
| `PORT`          | string | `3000`               | No       | TCP port the Fastify server listens on inside the container. The compose file maps this to the host port. |
| `NODE_ENV`      | string | `production`         | No       | When set to `production`, the server registers static file serving for the frontend build. |
| `STATIC_DIR`    | string | `<dist>/public`      | No (test-only) | Override for the frontend static files directory. Used in integration tests to inject a temporary fixture directory without a real frontend build. |

---

## Volume Contract

| Container Path | Purpose | Mount Type |
|----------------|---------|------------|
| `/data`        | Directory containing the SQLite database file and WAL files (`contracts.db`, `contracts.db-shm`, `contracts.db-wal`) | Bind mount to a host directory chosen by the operator |

The container starts successfully even if the `/data` directory is empty: `db/client.ts` already calls `mkdirSync(dirname(dbPath), { recursive: true })` before opening the database, so the file is created automatically on first run.

---

## No Schema Changes

The SQLite schema (`packages/backend/src/db/schema.sql`) and all migrations in `packages/backend/src/db/client.ts` are unchanged. Existing databases mounted from a previous installation are loaded and migrated automatically on startup (existing migration logic handles all known schema versions).
