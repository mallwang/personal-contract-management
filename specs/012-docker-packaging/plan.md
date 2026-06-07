# Implementation Plan: Docker Packaging for Homeserver Hosting

**Branch**: `012-docker-packaging` | **Date**: 2026-06-06 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/012-docker-packaging/spec.md`

## Summary

Package the personal contract management application as a single Docker container that serves both the Fastify API and the React frontend, with the SQLite database stored at an operator-chosen host path via a bind mount. The backend already supports `DATABASE_PATH` and `PORT` env vars; the only code change is registering `@fastify/static` in `buildServer` when `NODE_ENV=production`. All other work is infrastructure files (`Dockerfile`, `docker-compose.yml`, `.dockerignore`) and a backend integration test for the static-serving behaviour.

## Technical Context

**Language/Version**: TypeScript 5.5, Node.js 22 LTS (Alpine)

**Primary Dependencies**: Fastify 5, better-sqlite3 12, `@fastify/static` (new), pnpm 11.5.1 workspaces (builder stage)

**Storage**: SQLite via better-sqlite3; database path injected via `DATABASE_PATH` env var; bind-mounted from host at `/data`

**Testing**: Vitest (unit + integration); existing pattern: `buildServer(createDb(':memory:'))` — extended with `buildServer(db, { staticDir: tmpDir })`

**Target Platform**: Linux (Docker), Node.js 22 Alpine runtime image

**Project Type**: Web application — monorepo with `packages/backend` (Fastify API + static serving in production) and `packages/frontend` (React/Vite SPA)

**Performance Goals**: Standard homeserver expectations; startup under 60 s (SC-004)

**Constraints**: Single container, no TLS, no multi-user auth, offline-capable after image pull

**Scale/Scope**: Single-operator personal use; no horizontal scaling

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I — Test-First (NON-NEGOTIABLE) ✅

**Backend code change** (`buildServer` static-serving option): A failing integration test MUST be written before implementing the `@fastify/static` registration. The test will:
1. Create a temp directory with a fixture `index.html`
2. Call `buildServer(db, { staticDir: tmpDir })`
3. Assert `GET /` returns the fixture HTML (static serving works)
4. Assert `GET /some-spa-route` returns the fixture HTML (SPA fallback works)
5. Assert `GET /api/contracts` returns JSON (API routes take priority)

**Infrastructure files** (`Dockerfile`, `docker-compose.yml`, `.dockerignore`): Docker configuration files have no meaningful unit test. The end-to-end behaviour they enable is fully covered by the integration tests above and the quickstart validation scenarios. This is documented as an acceptable gap — configuration-as-code files are validated by running them, not by unit tests.

*Constitution compliant: implementation code has tests; infrastructure config is self-validating.*

### Principle II — Type Safety (NON-NEGOTIABLE) ✅

- `@fastify/static` ships TypeScript types (`@types/fastify-static` is included via the package itself)
- `buildServer` signature will be updated with a typed `options` parameter: `{ staticDir?: string }`
- No `any` types introduced
- `strict: true` already enabled in `packages/backend/tsconfig.json`

### Principle III — Simplicity (YAGNI) ✅

- Single container — no nginx sidecar, no multi-service compose
- No new abstractions: `staticDir` is passed directly to `fastify.register(fastifyStatic, { root: staticDir })`
- `STATIC_DIR` env var is added only for test injection; it is not exposed in the deployment contract
- Dockerfile is a straightforward two-stage build; no custom base images or scripts

*No Complexity Tracking entries required.*

## Project Structure

### Documentation (this feature)

```text
specs/012-docker-packaging/
├── plan.md                          # This file
├── research.md                      # Phase 0 — architecture decisions
├── data-model.md                    # Phase 1 — config/volume model
├── quickstart.md                    # Phase 1 — validation guide
├── contracts/
│   └── deployment-contract.md       # Phase 1 — env vars, volumes, ports
├── checklists/
│   └── requirements.md              # Spec quality checklist
└── tasks.md                         # Phase 2 — /speckit-tasks output (not yet created)
```

### Source Code Changes

```text
# New infrastructure files (repository root)
Dockerfile
docker-compose.yml
.dockerignore

# Modified backend files
packages/backend/package.json                   # add @fastify/static dependency
packages/backend/src/server.ts                  # register static plugin + SPA not-found handler

# New backend test
packages/backend/tests/integration/static.route.test.ts
```

**Structure Decision**: Web application layout (Option 2). The monorepo structure (`packages/backend`, `packages/frontend`, `packages/shared`) is unchanged. Docker adds a build step that outputs `packages/frontend/dist/` and copies it into the runtime image as `dist/public/` relative to the backend compiled output.

## Implementation Approach

### 1. Backend: `@fastify/static` Integration

Add to `packages/backend/src/server.ts`:

```typescript
// New import
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// New options parameter
export async function buildServer(
  db: Database.Database,
  options: { staticDir?: string } = {},
): Promise<FastifyInstance> {
  // ...existing code...

  // Static file serving for production / test injection
  const staticDir =
    options.staticDir ??
    (process.env['NODE_ENV'] === 'production'
      ? join(dirname(fileURLToPath(import.meta.url)), 'public')
      : undefined);

  if (staticDir) {
    await fastify.register(fastifyStatic, { root: staticDir, prefix: '/' });
    fastify.setNotFoundHandler((_request, reply) => {
      void reply.sendFile('index.html');
    });
  }

  // ...register API routes BEFORE static plugin to ensure priority...
}
```

> Note on route ordering: Fastify resolves routes by specificity, not registration order. All API routes are registered under `/api/`, which is a distinct prefix from the static prefix `/`. There is no ambiguity.

### 2. Dockerfile (Multi-Stage)

```dockerfile
# ---- Stage 1: Builder ----
FROM node:22-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@11.5.1
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# ---- Stage 2: Runtime ----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN npm install -g pnpm@11.5.1
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/backend/package.json ./packages/backend/
RUN pnpm install --frozen-lockfile --prod
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/frontend/dist ./packages/backend/dist/public
COPY --from=builder /app/packages/backend/src/db/schema.sql ./packages/backend/dist/db/schema.sql
EXPOSE 3000
CMD ["node", "packages/backend/dist/index.js"]
```

> The frontend build is copied to `packages/backend/dist/public` so that `join(__dirname, 'public')` in the compiled `server.js` resolves correctly (`__dirname` = `packages/backend/dist` inside the container at `/app`).

### 3. docker-compose.yml

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

### 4. .dockerignore

```
node_modules
**/node_modules
**/dist
.git
.gitignore
*.md
specs/
data/
.specify/
.claude/
```

### 5. Integration Test: `static.route.test.ts`

Test outline (TDD — write this first, before implementing `@fastify/static` changes):

```typescript
// 1. Create a temp dir with index.html
// 2. buildServer(db, { staticDir: tmpDir })
// 3. GET / → 200, body contains fixture HTML
// 4. GET /dashboard → 200, body contains fixture HTML (SPA fallback)
// 5. GET /api/contracts → 200, body is JSON array (API not intercepted)
// 6. Cleanup temp dir
```

## Complexity Tracking

> No constitution violations — table omitted.
