import { NextResponse } from 'next/server';
import { format } from 'date-fns';
import prisma from '@/lib/prisma';

const NAMED_CODES = [
  'CONTRACT_TEMPLATES', 'LEGAL_OPINION_TEMPLATES', 'LEGAL_OPINIONS', 'POLICIES',
  'NBE_DIRECTIVES', 'LAWS_REGULATIONS', 'LEGAL_RESEARCH', 'ARTICLES', 'FAQ',
];

const LIST_INCLUDE = {
  category: { select: { id: true, name: true } },
  author: { select: { id: true, firstName: true, lastName: true } },
};

export async function GET() {
  try {
    const [
      total,
      namedCategories,
      recentlyAdded,
      recentlyUpdated,
      mostDownloaded,
      pendingApprovals,
      byCategoryRaw,
      downloadsByCategoryRaw,
      recentForGrowth,
      recentHistory,
      popularByBookmarksRaw,
    ] = await Promise.all([
      prisma.knowledgeDocument.count(),
      prisma.knowledgeCategory.findMany({
        where: { code: { in: NAMED_CODES } },
        include: { _count: { select: { documents: true } } },
      }),
      prisma.knowledgeDocument.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: LIST_INCLUDE }),
      prisma.knowledgeDocument.findMany({ orderBy: { updatedAt: 'desc' }, take: 5, include: LIST_INCLUDE }),
      prisma.knowledgeDocument.findMany({ orderBy: { downloads: 'desc' }, take: 5, include: LIST_INCLUDE }),
      prisma.knowledgeDocument.findMany({
        where: { status: { in: ['UNDER_REVIEW', 'APPROVED'] } },
        orderBy: { updatedAt: 'asc' },
        take: 5,
        include: LIST_INCLUDE,
      }),
      prisma.knowledgeDocument.groupBy({ by: ['categoryId'], _count: true }),
      prisma.knowledgeDocument.groupBy({ by: ['categoryId'], _sum: { downloads: true } }),
      prisma.knowledgeDocument.findMany({ select: { createdAt: true }, orderBy: { createdAt: 'desc' }, take: 500 }),
      prisma.knowledgeHistory.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { actor: { select: { firstName: true, lastName: true } }, document: { select: { id: true, documentNumber: true, title: true } } },
      }),
      prisma.knowledgeBookmark.groupBy({ by: ['documentId'], _count: true, orderBy: { _count: { documentId: 'desc' } }, take: 5 }),
    ]);

    const countsByCode: Record<string, number> = {};
    for (const c of namedCategories) {
      if (c.code) countsByCode[c.code] = c._count.documents;
    }

    const categoryIds = byCategoryRaw.map((c) => c.categoryId);
    const categories = await prisma.knowledgeCategory.findMany({ where: { id: { in: categoryIds } } });
    const categoryDistribution = byCategoryRaw.map((c) => ({
      name: categories.find((x) => x.id === c.categoryId)?.name ?? 'Unknown',
      count: c._count,
    }));

    const downloadsByCategory = downloadsByCategoryRaw
      .filter((c) => (c._sum.downloads ?? 0) > 0)
      .map((c) => ({
        name: categories.find((x) => x.id === c.categoryId)?.name ?? 'Unknown',
        downloads: c._sum.downloads ?? 0,
      }));

    const monthCounts = new Map<string, number>();
    for (const r of recentForGrowth) {
      const key = format(r.createdAt, 'yyyy-MM');
      monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
    }
    const monthlyUploads = Array.from(monthCounts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([month, count]) => ({ month, count }));

    const popularIds = popularByBookmarksRaw.map((p) => p.documentId);
    const popularDocs = await prisma.knowledgeDocument.findMany({ where: { id: { in: popularIds } }, include: LIST_INCLUDE });
    const popularDocuments = popularByBookmarksRaw.map((p) => ({
      ...popularDocs.find((d) => d.id === p.documentId),
      bookmarkCount: p._count,
    }));

    return NextResponse.json({
      summary: {
        total,
        contractTemplates: countsByCode.CONTRACT_TEMPLATES ?? 0,
        legalOpinionTemplates: countsByCode.LEGAL_OPINION_TEMPLATES ?? 0,
        legalOpinions: countsByCode.LEGAL_OPINIONS ?? 0,
        policies: countsByCode.POLICIES ?? 0,
        nbeDirectives: countsByCode.NBE_DIRECTIVES ?? 0,
        lawsRegulations: countsByCode.LAWS_REGULATIONS ?? 0,
        researchPapers: countsByCode.LEGAL_RESEARCH ?? 0,
        articles: countsByCode.ARTICLES ?? 0,
        faqs: countsByCode.FAQ ?? 0,
      },
      recentlyAdded,
      recentlyUpdated,
      mostDownloaded,
      pendingApprovals,
      categoryDistribution,
      downloadsByCategory,
      monthlyUploads,
      recentHistory,
      popularDocuments,
    });
  } catch (error) {
    console.error('Failed to compute knowledge stats:', error);
    return NextResponse.json({ error: 'Failed to compute stats' }, { status: 500 });
  }
}
