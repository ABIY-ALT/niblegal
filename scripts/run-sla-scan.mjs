/**
 * Scheduled runner for the SLA / expiry / renewal scan.
 *
 * The scan itself (src/lib/jobs/slaScan.ts) flips overdue contracts to EXPIRED,
 * marks contracts entering their renewal window as EXPIRING_SOON, and raises
 * in-app notifications (EXPIRY_ALERT / SLA_ALERT) for the legal team and the
 * requester. It is idempotent — alerts fire only on the transition into a
 * breached/expiring state — so it is safe to run on any cadence.
 *
 * Nothing in the app scheduled it before, which meant "automated alerts for
 * contract expiry, renewals and SLA milestones" only happened if a manager
 * clicked the button. Point Windows Task Scheduler (or any cron) at this file.
 *
 *   node scripts/run-sla-scan.mjs
 *
 * Requires CRON_SECRET in .env.local (or the environment). APP_URL defaults to
 * http://localhost:5000.
 *
 * Exit codes: 0 = scan ran, 1 = failed (so the scheduler can report it).
 */
import 'dotenv/config';
import { existsSync, readFileSync, appendFileSync, mkdirSync } from 'fs';
import path from 'path';

// dotenv/config only reads .env; the secret lives in .env.local.
function loadEnvLocal() {
  const file = path.join(process.cwd(), '.env.local');
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const [, key, rawValue] = m;
    if (process.env[key]) continue; // real environment wins
    process.env[key] = rawValue.replace(/^["']|["']$/g, '');
  }
}
loadEnvLocal();

const BASE = process.env.APP_URL ?? 'http://localhost:5000';
const SECRET = process.env.CRON_SECRET;
const LOG_DIR = path.join(process.cwd(), 'storage', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'sla-scan.log');

function log(line) {
  const stamped = `[${new Date().toISOString()}] ${line}`;
  console.log(stamped);
  try {
    mkdirSync(LOG_DIR, { recursive: true });
    appendFileSync(LOG_FILE, stamped + '\n');
  } catch {
    /* logging must never break the job */
  }
}

if (!SECRET) {
  log('ERROR: CRON_SECRET is not set — add it to .env.local. Aborting.');
  process.exit(1);
}

try {
  const res = await fetch(`${BASE}/api/system/jobs/sla-scan`, {
    method: 'POST',
    headers: { 'x-cron-secret': SECRET, 'Content-Type': 'application/json' },
  });

  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    log(`ERROR: scan returned HTTP ${res.status} — ${payload.error ?? 'no detail'}`);
    process.exit(1);
  }

  const d = payload.data ?? {};
  log(
    `OK contractsExpired=${d.contractsExpired ?? 0} ` +
      `contractsExpiring=${d.contractsExpiring ?? 0} ` +
      `contractsSlaBreached=${d.contractsSlaBreached ?? 0} ` +
      `requestsSlaBreached=${d.requestsSlaBreached ?? 0}`,
  );
  process.exit(0);
} catch (e) {
  log(`ERROR: could not reach ${BASE} — ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
}
