# Feature Specification: Docker Packaging for Homeserver Hosting

**Feature Branch**: `012-docker-packaging`

**Created**: 2026-06-06

**Status**: Draft

**Input**: User description: "I would like to package the whole application in a way to easily host it on any system. The preferred way is to use Docker, so that I can host it on a homeserver. It must also be possible to mount the database from an external local location."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Deploy on Homeserver (Priority: P1)

A homeserver operator wants to run the personal contract management application on their home server using Docker, making it accessible from any device on the local network. They have no interest in manual setup steps, dependency installation, or environment configuration — they want a working application with a single command.

**Why this priority**: This is the core goal of the feature. Everything else depends on the application being deployable at all.

**Independent Test**: Can be fully tested by running the provided start command on a fresh Linux machine and verifying the application is accessible in a browser. Delivers a fully usable application.

**Acceptance Scenarios**:

1. **Given** a machine with Docker and Docker Compose installed, **When** the operator runs the provided start command, **Then** the application is accessible in a browser within 60 seconds.
2. **Given** a running application, **When** the operator stops and restarts it, **Then** all previously entered contract data is still present.
3. **Given** the operator has no prior knowledge of the application's internals, **When** they follow the provided setup instructions, **Then** they can complete the deployment without external help.

---

### User Story 2 - External Database Location (Priority: P1)

A homeserver operator wants to store the application's database on an external or custom location (e.g., a NAS share, an external drive, or a specific directory on the host). This allows them to manage backups independently and ensure data survives container removal or image upgrades.

**Why this priority**: Data persistence and portability are critical for self-hosted applications — losing contract data due to a container update would be a serious failure.

**Independent Test**: Can be fully tested by configuring an external volume path, adding contracts, removing the container, then recreating it with the same path and verifying data is intact.

**Acceptance Scenarios**:

1. **Given** the operator specifies a custom host path for the database, **When** the container starts, **Then** the database file is created at the specified location on the host.
2. **Given** contract data stored in an external location, **When** the container is deleted and recreated, **Then** all data is accessible without any restore steps.
3. **Given** the operator points to an existing database file from a previous installation, **When** the container starts, **Then** the existing data is loaded and usable immediately.

---

### User Story 3 - Configuration and Port Customization (Priority: P2)

A homeserver operator with multiple services running wants to configure which port the application listens on, so it does not conflict with other services on the same machine.

**Why this priority**: Port conflicts are common in homeserver environments. While the application can work on a default port, configurability avoids a hard blocker for some operators.

**Independent Test**: Can be tested by setting a non-default port in the configuration and confirming the application is accessible only on that port.

**Acceptance Scenarios**:

1. **Given** the operator sets a custom port before starting, **When** the container starts, **Then** the application is accessible on the custom port.
2. **Given** no port is specified, **When** the container starts, **Then** the application runs on a sensible default port without errors.

---

### Edge Cases

- What happens when the specified external database path does not exist yet? (Directory should be created automatically, or a clear error is shown.)
- What happens when the external path has incorrect permissions? (A clear error message is shown, not a silent failure.)
- What happens when the chosen port is already in use on the host? (Docker reports the conflict; no special handling needed beyond standard Docker behavior.)
- What happens when the operator upgrades to a newer image version while using an existing database? (The existing database is preserved and remains usable.)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application MUST be fully packaged so it can run as a self-contained container without any additional runtime dependencies installed on the host beyond Docker.
- **FR-002**: A declarative configuration file (e.g., Docker Compose) MUST be provided so the entire application stack can be started with a single command.
- **FR-003**: The database storage location MUST be configurable to any directory on the host filesystem via a volume mount.
- **FR-004**: The application MUST expose its web interface on a configurable network port.
- **FR-005**: The container MUST support running in the background (detached/daemon mode) without requiring a persistent terminal session.
- **FR-006**: All user data MUST survive container removal, image upgrades, and host restarts, as long as the external volume path remains intact.
- **FR-007**: The default configuration MUST work out of the box without any required customization, using sensible defaults for port and internal paths.
- **FR-008**: An environment variable or equivalent mechanism MUST allow the operator to override the default port without editing internal application files.
- **FR-009**: Setup instructions MUST be provided that allow an operator to deploy the application from scratch in a single session.

### Key Entities

- **Container Image**: A self-contained, runnable package of the application and all its runtime dependencies.
- **Volume Mount**: A mapping between a directory on the host machine and a path inside the container where the database is stored.
- **Compose Configuration**: The declarative file that defines the container, its settings, volume mounts, and port mappings.
- **Database File**: The persistent data store for all contract records; must survive container lifecycle events.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new operator can complete the full deployment on a fresh machine in under 10 minutes by following the provided instructions.
- **SC-002**: Contract data entered before a container removal or image upgrade is fully accessible after the container is recreated, with zero data loss.
- **SC-003**: Changing the application's host port requires editing no more than one line in the configuration file.
- **SC-004**: The application is accessible in a browser within 60 seconds of running the start command on a machine that already has the image.
- **SC-005**: The database file is written to the configured host path and can be copied, backed up, or moved independently of the container.

## Assumptions

- The host machine runs a Linux-compatible operating system with Docker and Docker Compose installed (standard for homeserver setups).
- The application's database is a single file (SQLite), making volume-based persistence straightforward.
- The application is a monorepo with a backend API and a frontend; both are bundled into a single container image for simplicity.
- No multi-user authentication or TLS termination is in scope — the operator is responsible for network-level access control and reverse proxy setup if needed.
- The default port will be chosen to avoid conflicts with common homeserver services (e.g., not 80, 443, 3000, or 8080 unless clearly documented).
- Image builds are not automated as part of this feature; the operator either builds locally or pulls a pre-built image.
