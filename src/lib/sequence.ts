/**
 * Sequential reference-number generation.
 *
 * The generators used to be `count() + 1`, which had three defects:
 *
 *   1. **Not per-year.** The count spans every row ever created, so the first
 *      contract of 2027 came out as NIB-CMS-2027-00501 rather than -00001,
 *      despite the year being in the format.
 *   2. **Deletions caused collisions.** Removing a row lowered the count, so the
 *      next number duplicated an existing one and failed the unique index.
 *   3. **Races.** Two concurrent creates read the same count and generated the
 *      same number; the second insert failed.
 *
 * Deriving from the highest existing number *for the current year* fixes (1)
 * and (2) outright. For (3), the unique index is the backstop — it turns a race
 * into a failed insert rather than duplicate data — and `withUniqueRetry` turns
 * that failed insert into a transparent retry.
 */

/** Highest sequence already issued for a prefix, or 0 if none. */
export function highestSequence(existing: string[], prefix: string): number {
  let max = 0;
  for (const value of existing) {
    if (!value?.startsWith(prefix)) continue;
    const tail = value.slice(prefix.length);
    // Only the numeric suffix counts; ignore anything hand-edited or foreign.
    if (!/^\d+$/.test(tail)) continue;
    const n = Number(tail);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max;
}

/** Format `prefix` + zero-padded sequence. */
export function formatSequence(prefix: string, sequence: number, width: number): string {
  return `${prefix}${String(sequence).padStart(width, '0')}`;
}

/** Prisma unique-constraint violation. */
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: string }).code === 'P2002'
  );
}

/**
 * Run `attempt` and retry if it fails on a unique-constraint violation, which
 * is how a reference-number race surfaces. Each retry re-runs the generator, so
 * it picks up the number the winning insert just took.
 *
 * @throws the original error if it is not a unique violation, or if the retry
 *   budget is exhausted.
 */
export async function withUniqueRetry<T>(attempt: () => Promise<T>, retries = 5): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      return await attempt();
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      lastError = error;
      // Small stagger so simultaneous writers don't lock-step into each other.
      await new Promise((r) => setTimeout(r, 25 * (i + 1)));
    }
  }
  throw lastError;
}
