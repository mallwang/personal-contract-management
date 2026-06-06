---

description: "Task list for Docker packaging feature"
---

# Tasks: Docker Packaging for Homeserver Hosting

**Input**: Design documents from `/specs/012-docker-packaging/`

**Prerequisites**: [plan.md](plan.md) · [spec.md](spec.md) · [research.md](research.md) · [data-model.md](data-model.md) · [contracts/deployment-contract.md](contracts/deployment-contract.md) · [quickstart.md](quickstart.md)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

## Path Conventions

This is a pnpm monorepo with `packages/backend`, `packages/frontend`, `packages/shared` under the repo root. Infrastructure files live at the repo root.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the one new backend dependency before any implementation begins.

- [ ] T001 Add `@fastify/static` to `packages/backend/package.json` dependencies and run `pnpm install` to update `pnpm-lock.yaml`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Write the failing integration test for static file serving **before** any implementation. The test must fail at this point (Red phase of TDD).

**⚠️ CRITICAL**: No US1 implementation work begins until this test exists and demonstrably fails. This is required by the project constitution.

- [ ] T002 Write failing integration test for static file serving in `packages/backend/tests/integration/static.route.test.ts` — test must cover: (a) `GET /` returns fixture `index.html`, (b) `GET /dashboard` returns `index.html` (SPA fallback), (c) `GET /api/contracts` returns JSON array (API routes not intercepted). Use `buildServer(createDb(':memory:'), { staticDir: tmpDir })` pattern consistent with existing integration tests.

**Checkpoint**: T002 test file exists and all three assertions fail — implementation can now begin

---

## Phase 3: User Story 1 — Deploy on Homeserver (Priority: P1) 🎯 MVP

**Goal**: The application can be started with a single `docker compose up -d` command and is accessible in a browser.

**Independent Test**: Run `docker build -t pcm . && docker compose up -d` on a clean checkout; verify `curl http://localhost:3001` returns the React app HTML and `curl http://localhost:3001/api/contracts` returns a JSON array.

### Implementation for User Story 1

- [ ] T003 [US1] Implement `@fastify/static` registration and SPA not-found handler in `packages/backend/src/server.ts` — add optional `options: { staticDir?: string }` parameter to `buildServer`, register the plugin when `staticDir` is set or `NODE_ENV=production`, set `setNotFoundHandler` to serve `index.html` for all non-API 404s. T002 test must pass green after this task.
- [ ] T004 [P] [US1] Write `Dockerfile` at repo root — two-stage build: (1) builder stage installs pnpm 11.5.1, runs `pnpm install --frozen-lockfile`, runs `pnpm build`; (2) runtime stage copies `packages/backend/dist`, `packages/shared/dist`, `packages/frontend/dist` → `packages/backend/dist/public`, `packages/backend/src/db/schema.sql` → `packages/backend/dist/db/schema.sql`, installs production-only deps, sets `NODE_ENV=production`, exposes port 3000, runs `node packages/backend/dist/index.js`
- [ ] T005 [P] [US1] Write `.dockerignore` at repo root — exclude `node_modules`, `**/node_modules`, `**/dist`, `.git`, `data/`, `specs/`, `.specify/`, `.claude/`, `*.db`, `*.db-shm`, `*.db-wal`
- [ ] T006 [US1] Write `docker-compose.yml` at repo root — define `app` service with `build: .`, `image: pcm`, `ports: "3001:3000"`, `environment: NODE_ENV=production, DATABASE_PATH=/data/contracts.db`, `volumes: ./data:/data`, `restart: unless-stopped`
- [ ] T007 [US1] Verify image builds successfully: run `docker build -t pcm .` and confirm it completes without errors and the final image is under 400 MB (`docker image ls pcm`)
- [ ] T008 [US1] Verify full startup: run `docker compose up -d`, wait for container to be healthy, confirm `curl -s http://localhost:3001/api/contracts` returns HTTP 200 JSON, and `curl -s http://localhost:3001/` returns HTML containing `<div id="root">`

**Checkpoint**: US1 complete — single-command deploy works, app is accessible in browser

---

## Phase 4: User Story 2 — External Database Location (Priority: P1)

**Goal**: The database is written to the configured host path and survives container removal and recreation.

**Independent Test**: Run quickstart.md Scenario 2 (restart) and Scenario 3 (external path): stop container, confirm `data/contracts.db` exists on host, remove container, restart with same volume path, verify previously added contract is still present.

### Implementation for User Story 2

- [ ] T009 [US2] Validate volume persistence: follow quickstart.md Scenario 2 — add a contract via `curl -X POST`, run `docker compose down`, run `docker compose up -d`, confirm the contract is still returned by `GET /api/contracts`
- [ ] T010 [P] [US2] Add `data/` to `.gitignore` at repo root if not already present (the SQLite files `*.db`, `*.db-shm`, `*.db-wal` must not be committed); verify `git status` does not show `data/contracts.db` as untracked
- [ ] T011 [US2] Validate external path mounting: follow quickstart.md Scenario 3 — configure a non-default volume path in `docker-compose.yml` (e.g., `/tmp/pcm-test-data:/data`), start container, confirm `contracts.db` is created at the custom host path, stop and remove container, restart with same path, confirm data persists

**Checkpoint**: US2 complete — database persists on host, survives container removal, mountable from any path

---

## Phase 5: User Story 3 — Port Customization (Priority: P2)

**Goal**: Changing the exposed host port requires editing one line in `docker-compose.yml`.

**Independent Test**: Edit `ports:` in `docker-compose.yml` from `3001:3000` to `9090:3000`, run `docker compose up -d`, confirm `curl http://localhost:9090/api/contracts` returns HTTP 200 and `curl http://localhost:3001/api/contracts` refuses connection.

### Implementation for User Story 3

- [ ] T012 [US3] Validate one-line port change: follow quickstart.md Scenario 4 — change `"3001:3000"` to `"9090:3000"` in `docker-compose.yml`, restart container, confirm app is reachable on port `9090` and not on `3001`; restore `docker-compose.yml` to default `3001:3000` after validation
- [ ] T013 [P] [US3] Add inline comment to `docker-compose.yml` on the `ports:` line documenting that only the host-side port (left of `:`) should be changed, e.g., `# Change 3001 to any available host port`

**Checkpoint**: US3 complete — port customisation is one-line edit, self-documented in compose file

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, documentation, and cleanup across all stories.

- [ ] T014 [P] Run full backend test suite: `pnpm --filter backend test` — all existing tests plus T002 static route test must pass with zero failures
- [ ] T015 [P] Run `pnpm build` to confirm the full monorepo build still succeeds after the `@fastify/static` addition and `server.ts` changes
- [ ] T016 Add a **Deployment** section to `README.md` with: (a) prerequisites (Docker + Docker Compose), (b) `docker build` command, (c) `docker compose up -d` command, (d) default URL `http://localhost:3001`, (e) how to change the host port (one-line edit), (f) how to point the database at a custom host path (volume line edit)
- [ ] T017 Run all seven quickstart.md validation scenarios end-to-end and confirm each expected outcome is met; clean up (`docker compose down && docker rmi pcm`) after validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (T001 must be installed before T002 imports can be verified) — BLOCKS US1 implementation
- **US1 (Phase 3)**: Depends on Phase 2 (T002 test must exist and fail) — T003 unblocks T007/T008
- **US2 (Phase 4)**: Depends on Phase 3 (requires running container from T006–T008)
- **US3 (Phase 5)**: Depends on Phase 3 (requires running container from T006–T008); independent of Phase 4
- **Polish (Phase 6)**: Depends on Phases 3–5

### User Story Dependencies

- **US1 (P1)**: Depends on Foundational only — no other story dependencies
- **US2 (P1)**: Depends on US1 (needs running container with volume mount from T006)
- **US3 (P2)**: Depends on US1 (needs running container from T006); independent of US2

### Within Each Phase

- T002 (foundational test) MUST fail before T003 implementation starts
- T004 (Dockerfile) and T005 (.dockerignore) are parallel — different files
- T007 (build verify) depends on T004 + T005
- T008 (startup verify) depends on T006 + T007

---

## Parallel Opportunities

### Phase 3 — User Story 1

```bash
# These two can run in parallel (different files):
Task: "T004 — Write Dockerfile at repo root"
Task: "T005 — Write .dockerignore at repo root"

# T003 can run in parallel with T004/T005 (different file: server.ts):
Task: "T003 — Implement @fastify/static in packages/backend/src/server.ts"
```

### Phase 4 + Phase 5 — After US1 is complete

```bash
# US2 and US3 validation tasks are independent:
Task: "T009–T011 — US2 volume persistence validation"
Task: "T012–T013 — US3 port customisation validation"
```

### Phase 6 — Polish

```bash
# These three can run in parallel:
Task: "T014 — Run backend test suite"
Task: "T015 — Run pnpm build"
Task: "T016 — Update README.md"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Add `@fastify/static` dependency
2. Complete Phase 2: Write failing test (T002)
3. Complete Phase 3: US1 implementation (T003–T008)
4. **STOP and VALIDATE**: `docker compose up -d` → app accessible at `http://localhost:3001`
5. Ship/demo — the app is deployable on a homeserver

### Incremental Delivery

1. Setup + Foundational → dependency added, test written and failing
2. US1 complete → single-command deploy works (MVP — homeserver deployment done)
3. US2 complete → database path confirmed persistent and portable
4. US3 complete → port customisation confirmed and documented
5. Polish → full validation pass, README updated

---

## Notes

- [P] tasks touch different files and have no dependency on incomplete tasks in their phase
- TDD is mandatory (constitution Principle I): T002 must demonstrably fail before T003 is written
- Infrastructure files (Dockerfile, docker-compose.yml) are not unit-tested; they are validated by T007/T008 and the quickstart.md scenarios
- `STATIC_DIR` env var is for test injection only — do not expose it in `docker-compose.yml` or README
- The `data/` directory will be created automatically by `db/client.ts` on first run; no manual setup needed
