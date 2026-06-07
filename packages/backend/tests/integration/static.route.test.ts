import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { FastifyInstance, InjectOptions } from 'fastify';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { createDb, runMigrations } from '../../src/db/client.js';
import { buildServer, SESSION_COOKIE_NAME } from '../../src/server.js';
import { createAuthenticatedSession } from '../helpers/auth.js';
import Database from 'better-sqlite3';

const FIXTURE_HTML = '<!doctype html><html><body><div id="root"></div></body></html>';

describe('Static file serving (production mode)', () => {
  let db: Database.Database;
  let app: FastifyInstance;
  let sessionCookie: string;

  function inject(opts: InjectOptions) {
    return app.inject({ ...opts, cookies: { [SESSION_COOKIE_NAME]: sessionCookie } });
  }
  let staticDir: string;

  beforeEach(async () => {
    staticDir = join(tmpdir(), `pcm-static-test-${randomUUID()}`);
    mkdirSync(staticDir, { recursive: true });
    writeFileSync(join(staticDir, 'index.html'), FIXTURE_HTML);

    db = createDb(':memory:');
    runMigrations(db);
    app = await buildServer(db, { staticDir });
    await app.ready();
    sessionCookie = createAuthenticatedSession(db).sessionId;
  });

  afterEach(async () => {
    await app.close();
    db.close();
    rmSync(staticDir, { recursive: true, force: true });
  });

  it('GET / returns index.html', async () => {
    const response = await inject({ method: 'GET', url: '/' });
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('<div id="root">');
  });

  it('GET /dashboard returns index.html (SPA fallback)', async () => {
    const response = await inject({ method: 'GET', url: '/dashboard' });
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('<div id="root">');
  });

  it('GET /api/contracts returns JSON array (API routes not intercepted)', async () => {
    const response = await inject({ method: 'GET', url: '/api/contracts' });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body) as unknown;
    expect(Array.isArray(body)).toBe(true);
  });
});

describe('Static file serving disabled (no staticDir)', () => {
  let db: Database.Database;
  let app: FastifyInstance;
  let sessionCookie: string;

  function inject(opts: InjectOptions) {
    return app.inject({ ...opts, cookies: { [SESSION_COOKIE_NAME]: sessionCookie } });
  }

  beforeEach(async () => {
    db = createDb(':memory:');
    runMigrations(db);
    app = await buildServer(db);
    await app.ready();
    sessionCookie = createAuthenticatedSession(db).sessionId;
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  it('GET / returns 404 when no staticDir configured', async () => {
    const response = await inject({ method: 'GET', url: '/' });
    expect(response.statusCode).toBe(404);
  });
});
