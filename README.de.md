[English](README.md) · **Deutsch**

# Personal Contract Management

Eine persönliche Web-App zum Verwalten von Verträgen — Abonnements, Versicherungen, Wohnen, Nebenkosten und mehr. Behalte einen sofortigen Überblick über deine monatlichen Ausgaben und verpasse keine anstehenden Verlängerungen.

## Funktionen

- **Dashboard** — gesamte monatliche Ausgaben aktiver Verträge, Aufschlüsselung nach Kategorie, anstehende Verlängerungen (innerhalb von 30 Tagen) und abgelaufene Verträge
- **Vertragsliste** — sortierbare Tabelle mit Anbieter-Logos und Kategorie-Icons
- **Erstellen / Bearbeiten / Löschen** von Verträgen mit 14 Feldern einschließlich Kündigungsfristen
- **Export** — alle Verträge als JSON oder Excel (.xlsx) herunterladen
- **Import** — JSON oder Excel hochladen mit intelligenter Spaltenzuordnung
- **Anonymisierung** — echte Vertragsnamen global oder pro Vertrag mit deterministischen Fantasienamen verbergen
- **Lokalisierung** — Englisch und Deutsch mit gebietsschemaabhängiger Währungs- und Datumsformatierung

Eine vollständige Anleitung zur Benutzeroberfläche findest du unter [docs/user-guide.de.md](docs/user-guide.de.md).

## Tech-Stack

| Schicht | Technologie |
|---------|-------------|
| Backend | Fastify + TypeScript + SQLite (better-sqlite3) |
| Frontend | React + TypeScript + Vite + TanStack Query |
| Styling | Tailwind CSS v4 + shadcn-style components |
| Testing | Vitest (Unit + Integration), Playwright (E2E) |
| Monorepo | pnpm workspaces |

## Voraussetzungen

- Node.js 22+
- pnpm 9+

## Erste Schritte

```bash
# Abhängigkeiten installieren
pnpm install

# Datenbank einrichten und Beispieldaten laden
pnpm --filter backend db:migrate
pnpm --filter backend db:seed

# Beide Server starten
pnpm dev
```

Öffne [http://localhost:5173](http://localhost:5173).

Die Backend-API läuft unter [http://localhost:3000](http://localhost:3000).

## Tests ausführen

```bash
# Alle Unit- und Integrationstests
pnpm test

# End-to-End-Tests (laufende App erforderlich)
pnpm --filter frontend test:e2e
```

## Projektstruktur

```
packages/
├── shared/       # Gemeinsame TypeScript-Typen und Zod-Schemas
├── backend/      # Fastify-API-Server
│   ├── src/db/           # SQLite-Schema, Client, Migrationen, Seed
│   ├── src/routes/       # Route-Handler
│   └── src/services/     # Geschäftslogik
└── frontend/     # React + Vite SPA
    ├── src/components/   # UI-Komponenten
    ├── src/pages/        # Seitenkomponenten
    └── src/services/     # API-Hooks (TanStack Query)
```

## Datenbankskripte

```bash
pnpm --filter backend db:migrate   # Schema anwenden
pnpm --filter backend db:seed      # Beispielverträge laden
pnpm --filter backend db:reset     # Schema löschen und neu erstellen
```

## Entwicklungsworkflow

Features werden mit [Spec Kit](https://github.com/specstory/spec-kit) nach dem Ablauf Spec → Plan → Tasks → Implementierung entwickelt. Jedes Feature lebt auf einem eigenen Branch und wird über einen Pull Request nach bestandener CI in `main` gemergt.
