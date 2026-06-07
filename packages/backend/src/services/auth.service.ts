import { randomBytes } from 'node:crypto';
import type Database from 'better-sqlite3';
import type { SessionUser } from '@pcm/shared';
import type { UserRow, SessionRow } from '../db/client.js';
import { hashPassword, verifyPassword } from './password.js';

const LOCKOUT_THRESHOLD = 5;
const BASE_LOCKOUT_MINUTES = 1;
const MAX_LOCKOUT_MINUTES = 60;

export const SESSION_INACTIVITY_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000;
export const SESSION_MAX_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;

/** Name of the HTTP-only cookie carrying the opaque session token (research.md §1). */
export const SESSION_COOKIE_NAME = 'session_id';

/** Maps a stored user row to the public, credential-free shape sent to clients. */
export function toSessionUser(user: UserRow): SessionUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    role: user.role as SessionUser['role'],
  };
}

export type SignInResult =
  | { outcome: 'success'; user: UserRow; session: SessionRow }
  | { outcome: 'invalid' }
  | { outcome: 'locked'; retryAt: string };

/**
 * Handles credential verification, session lifecycle, and brute-force lockout for FR-001–004,
 * FR-011, FR-015/16, and FR-018. Sessions are server-side rows (research.md §1) so that
 * sign-out, inactivity expiry, and account removal all reduce to a delete/lookup-miss.
 */
export class AuthService {
  constructor(private readonly db: Database.Database) {}

  signIn(email: string, password: string): SignInResult {
    const user = this.db
      .prepare<
        [string],
        UserRow
      >(`SELECT * FROM users WHERE email = ? COLLATE NOCASE AND status = 'ACTIVE'`)
      .get(email);

    if (!user) {
      return { outcome: 'invalid' };
    }

    if (user.locked_until && user.locked_until > new Date().toISOString()) {
      return { outcome: 'locked', retryAt: user.locked_until };
    }

    if (!verifyPassword(password, user.password_hash, user.password_salt)) {
      this.recordFailedAttempt(user);
      return { outcome: 'invalid' };
    }

    this.resetFailedAttempts(user.id);
    const session = this.createSession(user.id);
    return { outcome: 'success', user, session };
  }

  private recordFailedAttempt(user: UserRow): void {
    const failedAttempts = user.failed_attempts + 1;
    let lockedUntil: string | null = user.locked_until;
    if (failedAttempts >= LOCKOUT_THRESHOLD) {
      const minutes = Math.min(
        BASE_LOCKOUT_MINUTES * 2 ** (failedAttempts - LOCKOUT_THRESHOLD),
        MAX_LOCKOUT_MINUTES,
      );
      lockedUntil = new Date(Date.now() + minutes * 60_000).toISOString();
    }
    this.db
      .prepare(
        `UPDATE users SET failed_attempts = ?, locked_until = ?, updated_at = ? WHERE id = ?`,
      )
      .run(failedAttempts, lockedUntil, new Date().toISOString(), user.id);
  }

  private resetFailedAttempts(userId: string): void {
    this.db
      .prepare(
        `UPDATE users SET failed_attempts = 0, locked_until = NULL, updated_at = ? WHERE id = ?`,
      )
      .run(new Date().toISOString(), userId);
  }

  createSession(userId: string): SessionRow {
    const now = new Date();
    const row: SessionRow = {
      id: randomBytes(32).toString('hex'),
      user_id: userId,
      created_at: now.toISOString(),
      last_seen_at: now.toISOString(),
      expires_at: new Date(now.getTime() + SESSION_INACTIVITY_TIMEOUT_MS).toISOString(),
    };
    this.db
      .prepare(
        `INSERT INTO sessions (id, user_id, created_at, last_seen_at, expires_at)
         VALUES (@id, @user_id, @created_at, @last_seen_at, @expires_at)`,
      )
      .run(row);
    return row;
  }

  /**
   * Resolves a session token to its current, active user — refreshing the sliding
   * inactivity window (capped at the absolute maximum lifetime) on every valid lookup.
   * Deletes (and returns null for) any session that is expired, inactive too long, or
   * whose account is no longer active — this single code path is what makes FR-004
   * (inactivity expiry) and FR-011 (immediate invalidation on removal) simple lookup-misses.
   */
  resolveSession(sessionId: string): UserRow | null {
    const session = this.db
      .prepare<[string], SessionRow>(`SELECT * FROM sessions WHERE id = ?`)
      .get(sessionId);
    if (!session) return null;

    const now = Date.now();
    const lastSeen = new Date(session.last_seen_at).getTime();
    const expiresAt = new Date(session.expires_at).getTime();
    const createdAt = new Date(session.created_at).getTime();

    if (now > expiresAt || now - lastSeen > SESSION_INACTIVITY_TIMEOUT_MS) {
      this.destroySession(sessionId);
      return null;
    }

    const user = this.db
      .prepare<[string], UserRow>(`SELECT * FROM users WHERE id = ?`)
      .get(session.user_id);
    if (!user || user.status !== 'ACTIVE') {
      this.destroySession(sessionId);
      return null;
    }

    const refreshedExpiresAt = new Date(
      Math.min(now + SESSION_INACTIVITY_TIMEOUT_MS, createdAt + SESSION_MAX_LIFETIME_MS),
    ).toISOString();
    this.db
      .prepare(`UPDATE sessions SET last_seen_at = ?, expires_at = ? WHERE id = ?`)
      .run(new Date(now).toISOString(), refreshedExpiresAt, sessionId);

    return user;
  }

  destroySession(sessionId: string): void {
    this.db.prepare(`DELETE FROM sessions WHERE id = ?`).run(sessionId);
  }

  destroyOtherSessions(userId: string, keepSessionId: string): void {
    this.db
      .prepare(`DELETE FROM sessions WHERE user_id = ? AND id != ?`)
      .run(userId, keepSessionId);
  }

  changePassword(userId: string, currentPassword: string, newPassword: string): boolean {
    const user = this.db.prepare<[string], UserRow>(`SELECT * FROM users WHERE id = ?`).get(userId);
    if (!user) return false;
    if (!verifyPassword(currentPassword, user.password_hash, user.password_salt)) return false;

    const { hash, salt } = hashPassword(newPassword);
    this.db
      .prepare(`UPDATE users SET password_hash = ?, password_salt = ?, updated_at = ? WHERE id = ?`)
      .run(hash, salt, new Date().toISOString(), userId);
    return true;
  }
}
