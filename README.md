# Personal Contract Management

A personal web app for tracking contracts — subscriptions, insurance, housing, utilities, and more. Get an instant overview of your monthly spending and stay ahead of upcoming renewals.

## Features

- **Dashboard** — total active monthly spending, breakdown by category, and contracts expiring within 30 days
- More features coming soon (contract management, notifications, …)

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
