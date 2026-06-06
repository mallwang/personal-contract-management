# Quickstart Validation Guide: Docker Deployment

**Feature**: 012-docker-packaging  
**Date**: 2026-06-06  
**Validates**: All user stories and success criteria from [spec.md](spec.md)

---

## Prerequisites

- Docker Engine ≥ 24 and Docker Compose plugin (or standalone `docker-compose` v2) installed on the host
- The repository cloned to the host (or just `Dockerfile` and `docker-compose.yml` copied to a directory)
- No process already bound to host port `3001`

---

## Setup — Build the Image

From the repository root:

```bash
docker build -t pcm .
```

Expected: Build completes without errors. Final image size should be under 400 MB.

---

## Scenario 1 — First-Time Deployment (User Story 1, P1)

```bash
# Start in detached mode
docker compose up -d

# Verify the container is running
docker compose ps
```

**Expected**: `app` service is in `running` state.

```bash
# Verify the application is accessible
curl -s http://localhost:3001/api/contracts | head -c 100
```

**Expected**: JSON response (an array, possibly empty). HTTP 200.

Open `http://localhost:3001` in a browser — the contract management UI should load and be fully functional.

**Validates**: SC-001 (deploy in one session), SC-004 (accessible within 60 s of start).

---

## Scenario 2 — Data Persistence Across Container Restarts (User Story 1 + 2)

```bash
# Add a contract via the UI at http://localhost:3001
# (or via API)
curl -s -X POST http://localhost:3001/api/contracts \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test Contract","category":"SUBSCRIPTIONS","amount":9.99,"billing_interval":"MONTHLY","status":"ACTIVE"}'

# Stop and remove the container
docker compose down

# Restart
docker compose up -d

# Verify the contract still exists
curl -s http://localhost:3001/api/contracts | grep "Test Contract"
```

**Expected**: The contract appears in the response after restart.

**Validates**: SC-002 (zero data loss), FR-006 (data survives container removal).

---

## Scenario 3 — External Database Location (User Story 2, P1)

```bash
# Stop existing container
docker compose down

# Edit docker-compose.yml: change volume to a custom host path
# e.g., replace  ./data:/data  with  /mnt/nas/pcm-data:/data

# Start with the new path
docker compose up -d

# Verify database file is created at the custom location
ls /mnt/nas/pcm-data/contracts.db
```

**Expected**: `contracts.db` file exists at the specified host path.

```bash
# Stop and remove the container
docker compose down

# Point compose back at the same custom path and restart
docker compose up -d

# Verify previous data is still there
curl -s http://localhost:3001/api/contracts | grep "Test Contract"
```

**Expected**: Data from before the container removal is accessible.

**Validates**: SC-002, SC-005, FR-003, FR-006 (external volume, data portability).

---

## Scenario 4 — Port Customization (User Story 3, P2)

```bash
# Stop the container
docker compose down

# Edit the single ports line in docker-compose.yml:
# Change  "3001:3000"  to  "9090:3000"

docker compose up -d

# Verify application is accessible on the new port
curl -s http://localhost:9090/api/contracts | head -c 100
```

**Expected**: HTTP 200 on port `9090`. Port `3001` should refuse connection.

**Validates**: SC-003 (one-line port change), FR-004, FR-008.

---

## Scenario 5 — SPA Client-Side Routing

```bash
# Navigate directly to a deep route in the browser
open http://localhost:3001/contracts/some-uuid
```

**Expected**: The application loads (shows the UI), not a 404 error page. React Router handles the route client-side.

**Validates**: FR-001 (self-contained, fully functional frontend in container).

---

## Scenario 6 — Detached Mode / Background Operation

```bash
# Ensure container survives terminal close
docker compose up -d
exit   # close the terminal session

# In a new terminal
docker compose ps
```

**Expected**: `app` service still running.

**Validates**: FR-005 (daemon/detached mode).

---

## Scenario 7 — Missing Database Directory (Edge Case)

```bash
# Remove the data directory entirely
docker compose down
rm -rf ./data

# Start fresh
docker compose up -d

# Verify it created the directory and database automatically
ls ./data/contracts.db
```

**Expected**: `contracts.db` created automatically. No error in container logs.

**Validates**: Edge case: "specified external database path does not exist yet".

---

## Cleanup

```bash
docker compose down
docker rmi pcm
```
