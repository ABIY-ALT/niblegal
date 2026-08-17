'use client';

/**
 * Knowledge-module page guard. Re-exports the shared implementation so both
 * modules authorise identically — this used to be a separate copy that checked
 * only the built-in role slugs, locking out every custom role.
 */
export { RoleGuard } from '@/components/advisory/RoleGuard';
