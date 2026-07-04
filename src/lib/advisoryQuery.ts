export function buildLegalRequestWhere(searchParams: URLSearchParams): Record<string, unknown> {
  const where: Record<string, unknown> = {};

  const search = searchParams.get('search');
  if (search) {
    where.OR = [
      { subject: { contains: search, mode: 'insensitive' } },
      { requestNumber: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const statusIn = searchParams.get('statusIn');
  const status = searchParams.get('status');
  if (searchParams.get('excludeClosed') === '1') {
    where.status = { notIn: ['CLOSED', 'ARCHIVED', 'REJECTED'] };
  } else if (statusIn) {
    where.status = { in: statusIn.split(',') };
  } else if (status) {
    where.status = status;
  }

  const categoryId = searchParams.get('categoryId');
  if (categoryId) where.categoryId = categoryId;
  const priority = searchParams.get('priority');
  if (priority) where.priority = priority;
  const requesterId = searchParams.get('requesterId');
  if (requesterId) where.requesterId = requesterId;
  const assigneeId = searchParams.get('assigneeId');
  if (assigneeId) where.assigneeId = assigneeId;
  const ids = searchParams.get('ids');
  if (ids) where.id = { in: ids.split(',') };

  return where;
}
