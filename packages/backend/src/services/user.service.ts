import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import type { Account, CreateAccountBody, Role } from '@pcm/shared';
import type { UserRow } from '../db/client.js';
import { hashPassword } from './password.js';

function rowToAccount(row: UserRow): Account {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role as Account['role'],
    status: row.status as Account['status'],
    createdAt: row.created_at,
  };
}

export type CreateAccountResult =
  | { outcome: 'created'; account: Account }
  | { outcome: 'duplicate' };
export type ArchiveResult = 'archived' | 'not-found' | 'last-admin';
export type ReactivateResult = 'reactivated' | 'not-found' | 'not-archived';
export type ChangeRoleResult = 'changed' | 'not-found' | 'last-admin';

/**
 * Account lifecycle for FR-007–013/FR-018: list/create accounts, archive (with immediate
 * session invalidation) and reactivate within the retention window, and change roles —
 * all guarded so the household can never be left without an active administrator (FR-010).
 */
export class UserService {
  constructor(private readonly db: Database.Database) {}

  list(): Account[] {
    const rows = this.db.prepare<[], UserRow>(`SELECT * FROM users ORDER BY created_at ASC`).all();
    return rows.map(rowToAccount);
  }

  create(body: CreateAccountBody): CreateAccountResult {
    const existing = this.db
      .prepare<[string], UserRow>(`SELECT * FROM users WHERE email = ? COLLATE NOCASE`)
      .get(body.email);
    if (existing) return { outcome: 'duplicate' };

    const { hash, salt } = hashPassword(body.initialPassword);
    const now = new Date().toISOString();
    const id = randomUUID();
    this.db
      .prepare(
        `INSERT INTO users (id, email, display_name, password_hash, password_salt, role, status, created_at, updated_at)
         VALUES (@id, @email, @display_name, @password_hash, @password_salt, @role, 'ACTIVE', @created_at, @updated_at)`,
      )
      .run({
        id,
        email: body.email,
        display_name: body.displayName,
        password_hash: hash,
        password_salt: salt,
        role: body.role,
        created_at: now,
        updated_at: now,
      });
    const row = this.db.prepare<[string], UserRow>(`SELECT * FROM users WHERE id = ?`).get(id)!;
    return { outcome: 'created', account: rowToAccount(row) };
  }

  archive(id: string): ArchiveResult {
    const target = this.db.prepare<[string], UserRow>(`SELECT * FROM users WHERE id = ?`).get(id);
    if (!target) return 'not-found';
    if (target.role === 'ADMIN' && target.status === 'ACTIVE' && this.activeAdminCount() <= 1) {
      return 'last-admin';
    }

    const now = new Date().toISOString();
    this.db
      .prepare(`UPDATE users SET status = 'ARCHIVED', archived_at = ?, updated_at = ? WHERE id = ?`)
      .run(now, now, id);
    this.db.prepare(`DELETE FROM sessions WHERE user_id = ?`).run(id);
    return 'archived';
  }

  reactivate(id: string): ReactivateResult {
    const target = this.db.prepare<[string], UserRow>(`SELECT * FROM users WHERE id = ?`).get(id);
    if (!target) return 'not-found';
    if (target.status !== 'ARCHIVED') return 'not-archived';

    this.db
      .prepare(
        `UPDATE users SET status = 'ACTIVE', archived_at = NULL, updated_at = ? WHERE id = ?`,
      )
      .run(new Date().toISOString(), id);
    return 'reactivated';
  }

  changeRole(id: string, role: Role): ChangeRoleResult {
    const target = this.db.prepare<[string], UserRow>(`SELECT * FROM users WHERE id = ?`).get(id);
    if (!target) return 'not-found';
    if (
      target.role === 'ADMIN' &&
      target.status === 'ACTIVE' &&
      role !== 'ADMIN' &&
      this.activeAdminCount() <= 1
    ) {
      return 'last-admin';
    }

    this.db
      .prepare(`UPDATE users SET role = ?, updated_at = ? WHERE id = ?`)
      .run(role, new Date().toISOString(), id);
    return 'changed';
  }

  private activeAdminCount(): number {
    const row = this.db
      .prepare<
        [],
        { count: number }
      >(`SELECT COUNT(*) AS count FROM users WHERE role = 'ADMIN' AND status = 'ACTIVE'`)
      .get()!;
    return row.count;
  }
}
