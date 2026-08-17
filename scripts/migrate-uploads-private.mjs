/**
 * One-off migration: move attachments out of the publicly-served `public/uploads`
 * directory into the private `storage/uploads` directory, and repoint every
 * stored fileUrl from `/uploads/...` to `/api/files/...`.
 *
 * Safe to re-run: files already moved are skipped, and the DB update only
 * touches rows still carrying the old prefix.
 *
 *   node scripts/migrate-uploads-private.mjs
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';
import { readdir, mkdir, rename, stat } from 'fs/promises';
import path from 'path';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
const OLD_ROOT = path.join(process.cwd(), 'public', 'uploads');
const NEW_ROOT = path.join(process.cwd(), 'storage', 'uploads');
const OLD_PREFIX = '/uploads/';
const NEW_PREFIX = '/api/files/';

async function exists(p) {
  try { await stat(p); return true; } catch { return false; }
}

async function walk(dir) {
  const out = [];
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

async function moveFiles() {
  if (!(await exists(OLD_ROOT))) {
    console.log('· No public/uploads directory — nothing to move.');
    return 0;
  }
  const files = await walk(OLD_ROOT);
  let moved = 0;
  for (const src of files) {
    const rel = path.relative(OLD_ROOT, src);
    const dest = path.join(NEW_ROOT, rel);
    if (await exists(dest)) { console.log(`· skip (already moved): ${rel}`); continue; }
    await mkdir(path.dirname(dest), { recursive: true });
    await rename(src, dest);
    console.log(`✓ moved ${rel}`);
    moved++;
  }
  return moved;
}

/** Repoint one model's URL column. */
async function repoint(label, findMany, update, field) {
  const rows = await findMany();
  let n = 0;
  for (const row of rows) {
    const value = row[field];
    if (typeof value !== 'string' || !value.startsWith(OLD_PREFIX)) continue;
    const next = NEW_PREFIX + value.slice(OLD_PREFIX.length);
    await update(row.id, next);
    n++;
  }
  if (n) console.log(`✓ ${label}: repointed ${n} ${field} value(s)`);
  return n;
}

async function main() {
  console.log('— Migrating attachments to private storage —\n');

  const moved = await moveFiles();
  console.log(`\nFiles moved: ${moved}\n`);

  let updated = 0;

  updated += await repoint(
    'ContractVersion',
    () => prisma.contractVersion.findMany({ select: { id: true, fileUrl: true } }),
    (id, fileUrl) => prisma.contractVersion.update({ where: { id }, data: { fileUrl } }),
    'fileUrl',
  );

  updated += await repoint(
    'LegalAttachment',
    () => prisma.legalAttachment.findMany({ select: { id: true, fileUrl: true } }),
    (id, fileUrl) => prisma.legalAttachment.update({ where: { id }, data: { fileUrl } }),
    'fileUrl',
  );

  updated += await repoint(
    'KnowledgeVersion',
    () => prisma.knowledgeVersion.findMany({ select: { id: true, fileUrl: true } }),
    (id, fileUrl) => prisma.knowledgeVersion.update({ where: { id }, data: { fileUrl } }),
    'fileUrl',
  );

  updated += await repoint(
    'KnowledgeAttachment',
    () => prisma.knowledgeAttachment.findMany({ select: { id: true, fileUrl: true } }),
    (id, fileUrl) => prisma.knowledgeAttachment.update({ where: { id }, data: { fileUrl } }),
    'fileUrl',
  );

  // Cover images are stored on the document itself.
  const docs = await prisma.knowledgeDocument.findMany({ select: { id: true, coverImageUrl: true } });
  let covers = 0;
  for (const d of docs) {
    if (typeof d.coverImageUrl === 'string' && d.coverImageUrl.startsWith(OLD_PREFIX)) {
      await prisma.knowledgeDocument.update({
        where: { id: d.id },
        data: { coverImageUrl: NEW_PREFIX + d.coverImageUrl.slice(OLD_PREFIX.length) },
      });
      covers++;
    }
  }
  if (covers) console.log(`✓ KnowledgeDocument: repointed ${covers} coverImageUrl value(s)`);
  updated += covers;

  console.log(`\nDone. ${moved} file(s) moved, ${updated} URL(s) repointed.`);
}

main()
  .catch((e) => { console.error('Migration failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
