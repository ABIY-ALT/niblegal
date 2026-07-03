/**
 * In-memory Login Security Store
 *
 * Tracks:
 *  - failed attempt counters per email (resets on successful login)
 *  - account lock status with lockout expiry
 *  - audit log of all login events
 *
 * NOTE: In-memory only — restarts clear state. For production, move to Redis / DB.
 */

// ── Constants ────────────────────────────────────────────────────────────────

export const MAX_FAILED_ATTEMPTS = 5;         // lock after N failures
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000;  // 15 minutes
export const LOCKOUT_RESET_ON_SUCCESS = true;

// ── Types ────────────────────────────────────────────────────────────────────

export type LoginAuditEntry = {
  id: string;
  timestamp: string;           // ISO 8601
  email: string;
  event: 'SUCCESS' | 'FAILURE' | 'LOCKED' | 'MFA_SENT' | 'MFA_SUCCESS' | 'MFA_FAILURE' | 'LOGOUT';
  ipAddress: string;
  userAgent: string;
  reason?: string;             // e.g. 'Invalid password', 'Account locked'
  userId?: string;
};

type FailureRecord = {
  count: number;
  lockedUntil: number | null;  // epoch ms
  lastAttempt: number;         // epoch ms
};

// ── In-Memory Stores ─────────────────────────────────────────────────────────

// We use `global` to persist across hot-reloads in Next.js dev mode
declare global {
  // eslint-disable-next-line no-var
  var __nibLoginFailures: Map<string, FailureRecord> | undefined;
  // eslint-disable-next-line no-var
  var __nibLoginAuditLog: LoginAuditEntry[] | undefined;
}

const failureMap: Map<string, FailureRecord> = (global.__nibLoginFailures ??= new Map());
const auditLog: LoginAuditEntry[] = (global.__nibLoginAuditLog ??= []);

// ── Failure / Lock Logic ─────────────────────────────────────────────────────

export function getFailureRecord(email: string): FailureRecord {
  return failureMap.get(email.toLowerCase()) ?? { count: 0, lockedUntil: null, lastAttempt: 0 };
}

export function isAccountLocked(email: string): { locked: boolean; remainingMs: number } {
  const rec = getFailureRecord(email);
  if (rec.lockedUntil && Date.now() < rec.lockedUntil) {
    return { locked: true, remainingMs: rec.lockedUntil - Date.now() };
  }
  return { locked: false, remainingMs: 0 };
}

export function recordFailedAttempt(email: string): { attemptsLeft: number; locked: boolean } {
  const key = email.toLowerCase();
  const rec = failureMap.get(key) ?? { count: 0, lockedUntil: null, lastAttempt: 0 };

  rec.count += 1;
  rec.lastAttempt = Date.now();

  if (rec.count >= MAX_FAILED_ATTEMPTS) {
    rec.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
  }

  failureMap.set(key, rec);

  return {
    attemptsLeft: Math.max(0, MAX_FAILED_ATTEMPTS - rec.count),
    locked: rec.count >= MAX_FAILED_ATTEMPTS,
  };
}

export function clearFailedAttempts(email: string): void {
  failureMap.delete(email.toLowerCase());
}

// ── Audit Log ────────────────────────────────────────────────────────────────

const MAX_AUDIT_ENTRIES = 1000; // rolling buffer to avoid unbounded growth

export function addAuditEntry(entry: Omit<LoginAuditEntry, 'id' | 'timestamp'>): LoginAuditEntry {
  const full: LoginAuditEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    ...entry,
  };
  auditLog.unshift(full); // newest first
  if (auditLog.length > MAX_AUDIT_ENTRIES) auditLog.length = MAX_AUDIT_ENTRIES;
  return full;
}

export function getAuditLog(limit = 100): LoginAuditEntry[] {
  return auditLog.slice(0, limit);
}

export function getAuditLogForUser(email: string, limit = 50): LoginAuditEntry[] {
  return auditLog.filter(e => e.email.toLowerCase() === email.toLowerCase()).slice(0, limit);
}
