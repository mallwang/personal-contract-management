**English** · [Deutsch](README.de.md)

# Personal Contract Management

A personal web app for tracking contracts — subscriptions, insurance, housing, utilities, and more. Get an instant overview of your monthly spending and stay ahead of upcoming renewals.

## Features

- **Dashboard** — total active monthly spending, category breakdown, upcoming renewals (within 30 days), and expired contracts
- **Contract list** — sortable table with provider logos and category icons
- **Create / edit / delete** contracts with 14 fields including cancellation notice periods
- **Export** — download all contracts as JSON or Excel (.xlsx)
- **Import** — upload JSON or Excel with intelligent column auto-mapping
- **Anonymization** — hide real contract names globally or per contract using deterministic fantasy names
- **Localization** — English and German with locale-aware currency and date formatting

For a full walkthrough of the UI, see [docs/user-guide.md](docs/user-guide.md).

## Tech stack

| Layer | Technology |
|-------|-----------|
| Backend | Fastify + TypeScript + SQLite (better-sqlite3) |
| Frontend | React + TypeScript + Vite + TanStack Query |
| Styling | Tailwind CSS v4 + shadcn-style components |
| Testing | Vitest (unit + integration), Playwright (e2e) |
| Monorepo | pnpm workspaces |

## Prerequisites

- Node.js 22+
- pnpm 9+

## Getting started

```bash
# Install dependencies
pnpm install

# Set up the database and load sample data
pnpm --filter backend db:migrate
pnpm --filter backend db:seed

# Start both servers
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173).

The backend API runs at [http://localhost:3000](http://localhost:3000).

## Running tests

```bash
# All unit and integration tests
pnpm test

# End-to-end tests (requires running app)
pnpm --filter frontend test:e2e
```

## Project structure

```
packages/
├── shared/       # Shared TypeScript types and Zod schemas
├── backend/      # Fastify API server
│   ├── src/db/           # SQLite schema, client, migrations, seed
│   ├── src/routes/       # Route handlers
│   └── src/services/     # Business logic
└── frontend/     # React + Vite SPA
    ├── src/components/   # UI components
    ├── src/pages/        # Page components
    └── src/services/     # API hooks (TanStack Query)
```

## Database scripts

```bash
pnpm --filter backend db:migrate   # Apply schema
pnpm --filter backend db:seed      # Load sample contracts
pnpm --filter backend db:reset     # Drop and recreate schema
```

## Development workflow

Features are developed using [Spec Kit](https://github.com/specstory/spec-kit) following a spec → plan → tasks → implement flow. Each feature lives on its own branch and is merged to `main` via pull request after CI passes.
