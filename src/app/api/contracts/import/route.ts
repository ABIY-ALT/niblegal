import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { hasAccess } from '@/lib/access';
import { generateContractNumber } from '@/lib/contractNumber';
import { withUniqueRetry } from '@/lib/sequence';
import { logContractActivity } from '@/lib/contractHistory';
// import { ContractCategory } from '@prisma/client';
interface ImportRow {
  title?: string;
  category?: string;
  counterparty?: string;
  requestingDepartmentId?: string;
  value?: number | string;
}

/**
 * Bulk-import legacy contracts as DRAFTs (§3.6 digitization / migration). Accepts
 * a parsed `rows` array so any CSV/XLSX parser can feed it. Managers/admins only.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasAccess(user, { permission: 'contract.create', roles: ['manager', 'admin_assistant'] })) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { rows } = (await req.json()) as { rows: ImportRow[] };
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'Provide a non-empty "rows" array' }, { status: 400 });
    }
    if (rows.length > 1000) {
      return NextResponse.json({ error: 'Import is limited to 1000 rows per batch' }, { status: 400 });
    }

    let imported = 0;
    const skipped: string[] = [];

    for (const row of rows) {
      const title = row.title?.trim();
      if (!title) { skipped.push('(row missing title)'); continue; }

      const category = (row.category && row.category.trim() !== '' ? row.category : 'OTHER');
      const value = row.value != null && row.value !== '' ? Number(String(row.value).replace(/[^0-9.]/g, '')) : null;

      const contract = await withUniqueRetry(async () =>
        prisma.contract.create({
          data: {
            contractNumber: await generateContractNumber(),
            title,
            category,
            counterparty: row.counterparty?.trim() || '—',
            status: 'DRAFT',
            value: Number.isFinite(value) ? value : null,
            requesterId: user.id,
            requestingDepartmentId: row.requestingDepartmentId || user.departmentId || null,
            tags: ['imported'],
          },
        }),
      );
      await logContractActivity({
        contractId: contract.id,
        actorId: user.id,
        action: 'IMPORTED',
        description: `Contract ${contract.contractNumber} imported as draft by ${user.name}`,
        toValue: 'DRAFT',
      });
      imported++;
    }

    return NextResponse.json({ data: { imported, skipped: skipped.length, total: rows.length } }, { status: 201 });
  } catch (error) {
    console.error('Contract import failed:', error);
    return NextResponse.json({ error: 'Import failed' }, { status: 400 });
  }
}
