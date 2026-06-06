# Research: Docker Packaging for Homeserver Hosting

**Phase**: 0 — Research  
**Branch**: `012-docker-packaging`  
**Date**: 2026-06-06

---

## Decision 1: Single-Container vs Multi-Container Architecture

**Decision**: Single container — Fastify serves both the API and the React frontend static files in production.

**Rationale**: The spec calls for the simplest possible deployment. A single container means one service to start, one log stream to read, one image to update. There is no horizontal scaling requirement and no need for an independent static-file server. Adding nginx as a second service would be YAGNI.

**Alternatives Considered**:
- *nginx + backend API (two services)*: Separate concerns cleanly, but doubles the number of containers an operator must manage. Rejected — complexity not justified for a personal-use homeserver app.
- *Caddy sidecar for TLS*: Operator is responsible for TLS termination (noted in spec Assumptions). Out of scope.

---

## Decision 2: Multi-Stage Docker Build

**Decision**: Two-stage Dockerfile: a `builder` stage that compiles all packages, and a `runtime` stage that only carries production artifacts.

**Rationale**: The builder needs pnpm, TypeScript compiler, tsx, and all dev dependencies. The runtime needs only the compiled JS, the production `node_modules`, and the built frontend HTML/CSS/JS. A single-stage image would be 600–900 MB; a two-stage image is ~250 MB.

**Alternatives Considered**:
- *Single-stage build*: Simpler Dockerfile, but ~3× larger image with build tooling exposed at runtime. Rejected.
- *Distroless/scratch base*: Smallest image, but requires native binaries for `better-sqlite3`. The Alpine-based Node image is a good balance.

---

## Decision 3: Serving Frontend Static Files from Fastify

**Decision**: Register `@fastify/static` in `buildServer` when a `staticDir` option is provided (or `NODE_ENV=production`). Add a not-found handler that returns `index.html` for non-API 404s (SPA client-side routing support).

**Rationale**: The existing `buildServer` function accepts a `db` instance; adding an optional `staticDir` option follows the same testability pattern and keeps the static-serving logic encapsulated. Using an injected path makes the feature fully testable without a real frontend build.

**Alternatives Considered**:
- *Serve via environment variable only*: No code change path — but `process.env['STATIC_DIR']` reads are implicit and hard to test. Using an explicit `options.staticDir` parameter is more transparent.
- *Express static middleware*: Not in scope; project uses Fastify.

---

## Decision 4: Database Volume Path

**Decision**: Default container-internal database path is `/data/contracts.db`. The `data/` volume is mounted at `/data` in the container. Operators set `DATABASE_PATH=/data/contracts.db` via the compose environment block.

**Rationale**: The backend `db/client.ts` already reads `process.env['DATABASE_PATH']` with a fallback to a workspace-relative path. No code change is needed — only the compose file sets the env var. The `/data` mount point is conventional and clean.

**Alternatives Considered**:
- *Named Docker volume*: Managed by Docker rather than the operator. Harder to back up, harder to migrate to a NAS. Rejected in favour of a bind mount to a user-controlled host path.
- *Embedding the database inside the container image*: Data lost on container removal. Non-starter.

---

## Decision 5: Default Exposed Port

**Decision**: Container-internal port stays at `3000` (the existing default). The `docker-compose.yml` maps host port `3001` to container port `3000` by default.

**Rationale**: No code change required. Operators customise the host port by editing the single `ports:` line in `docker-compose.yml` (satisfies SC-003). Port `3001` is used as the default host port to avoid clashing with local dev environments that typically run on `3000`.

**Alternatives Considered**:
- *Change internal default to 3001*: Requires a code change and breaks the existing dev default. Rejected.
- *Use `HOST_PORT` env var in compose*: Adds indirection. The spec only requires one-line port changes; directly editing the compose `ports:` line is simpler.

---

## Decision 6: pnpm Version in Docker

**Decision**: Install pnpm `11.5.1` (current project version) explicitly in the builder stage via `npm install -g pnpm@11.5.1`.

**Rationale**: Pins the builder to the exact version used in development. Avoids silent breakage if pnpm introduces a non-backward-compatible change in a patch release. The project has no `packageManager` field in `package.json`, so corepack cannot infer the version.

**Alternatives Considered**:
- *`corepack enable pnpm`*: Resolves the version from `package.json#packageManager`, which is not set. Would install latest, making builds non-deterministic.
- *`pnpm@latest`*: Non-deterministic. Rejected.
