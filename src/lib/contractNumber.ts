import prisma from '@/lib/prisma';

/** Auto-generated unique contract identifier, e.g. NIB-CMS-2026-00042 (BR-CMS-03). */
export async function generateContractNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.contract.count();
  return `NIB-CMS-${year}-${String(count + 1).padStart(5, '0')}`;
}
