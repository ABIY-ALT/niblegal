export function buildKnowledgeDocumentWhere(searchParams: URLSearchParams): Record<string, unknown> {
  const where: Record<string, unknown> = {};

  const search = searchParams.get('search');
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { documentNumber: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { lawName: { contains: search, mode: 'insensitive' } },
      { articleNumber: { contains: search, mode: 'insensitive' } },
      { keywords: { has: search } },
    ];
  }

  const status = searchParams.get('status');
  if (status) where.status = status;
  const confidentiality = searchParams.get('confidentiality');
  if (confidentiality) where.confidentiality = confidentiality;
  const categoryId = searchParams.get('categoryId');
  if (categoryId) where.categoryId = categoryId;
  const categoryCodes = searchParams.get('categoryCodes');
  if (categoryCodes) where.category = { code: { in: categoryCodes.split(',') } };
  const authorId = searchParams.get('authorId');
  if (authorId) where.authorId = authorId;
  const bookmarkedBy = searchParams.get('bookmarkedBy');
  if (bookmarkedBy) where.bookmarks = { some: { userId: bookmarkedBy } };
  const ids = searchParams.get('ids');
  if (ids) where.id = { in: ids.split(',') };

  return where;
}
