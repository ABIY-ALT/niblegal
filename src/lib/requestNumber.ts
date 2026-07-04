import prisma from '@/lib/prisma';

export async function generateRequestNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.legalRequest.count();
  return `LEG-${year}-${String(count + 1).padStart(6, '0')}`;
}

export async function generateReferenceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.legalOpinion.count({ where: { referenceNumber: { not: null } } });
  return `NIB-LGL-REF-${year}-${String(count + 1).padStart(5, '0')}`;
}
