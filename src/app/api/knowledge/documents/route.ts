import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { knowledgeDocumentSchema } from '@/lib/validations/knowledge';
import { generateDocumentNumber } from '@/lib/documentNumber';
import { saveKnowledgeFile, UploadError } from '@/lib/uploadKnowledge';
import { logKnowledgeActivity } from '@/lib/knowledgeHistory';
import { buildKnowledgeDocumentWhere } from '@/lib/knowledgeQuery';

const LIST_INCLUDE = {
  category: { select: { id: true, name: true } },
  tags: { select: { id: true, name: true } },
  author: { select: { id: true, firstName: true, lastName: true, email: true } },
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const skip = (page - 1) * limit;
    const where = buildKnowledgeDocumentWhere(searchParams);

    const [data, total] = await Promise.all([
      prisma.knowledgeDocument.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: LIST_INCLUDE }),
      prisma.knowledgeDocument.count({ where }),
    ]);

    return NextResponse.json({
      data,
      meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    console.error('Failed to fetch knowledge documents:', error);
    return NextResponse.json({ error: 'Failed to fetch knowledge documents' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role === 'requesting_organ') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await req.formData();
    const submit = formData.get('submit') === 'true';

    const getStr = (key: string) => {
      const v = formData.get(key);
      return typeof v === 'string' && v.length > 0 ? v : undefined;
    };
    const getJson = <T,>(key: string, fallback: T): T => {
      const v = formData.get(key);
      if (typeof v !== 'string' || !v) return fallback;
      try {
        return JSON.parse(v) as T;
      } catch {
        return fallback;
      }
    };

    const payload = {
      title: getStr('title') ?? '',
      categoryId: getStr('categoryId') ?? '',
      description: getStr('description'),
      keywords: getJson<string[]>('keywords', []),
      tagNames: getJson<string[]>('tagNames', []),
      confidentiality: getStr('confidentiality') ?? 'PUBLIC_INTERNAL',
      relatedContractId: getStr('relatedContractId'),
      relatedLegalRequestId: getStr('relatedLegalRequestId'),
      relatedDepartmentId: getStr('relatedDepartmentId'),
      effectiveDate: getStr('effectiveDate'),
      reviewDate: getStr('reviewDate'),
      expiryDate: getStr('expiryDate'),
      lawName: getStr('lawName'),
      articleNumber: getStr('articleNumber'),
      sectionNumber: getStr('sectionNumber'),
      content: getStr('content'),
    };

    const validated = knowledgeDocumentSchema.parse(payload);
    const documentNumber = await generateDocumentNumber();
    const status = submit ? 'UNDER_REVIEW' : 'DRAFT';

    const tagConnections = await Promise.all(
      validated.tagNames.map(async (name) => {
        const tag = await prisma.knowledgeTag.upsert({ where: { name }, update: {}, create: { name } });
        return { id: tag.id };
      }),
    );

    const doc = await prisma.knowledgeDocument.create({
      data: {
        documentNumber,
        title: validated.title,
        description: validated.description,
        categoryId: validated.categoryId,
        keywords: validated.keywords,
        confidentiality: validated.confidentiality,
        relatedContractId: validated.relatedContractId || null,
        relatedLegalRequestId: validated.relatedLegalRequestId || null,
        relatedDepartmentId: validated.relatedDepartmentId || null,
        effectiveDate: validated.effectiveDate ?? null,
        reviewDate: validated.reviewDate ?? null,
        expiryDate: validated.expiryDate ?? null,
        lawName: validated.lawName,
        articleNumber: validated.articleNumber,
        sectionNumber: validated.sectionNumber,
        content: validated.content,
        status,
        authorId: user.id,
        tags: { connect: tagConnections },
      },
      include: LIST_INCLUDE,
    });

    const file = formData.get('file');
    if (file instanceof File && file.size > 0) {
      const saved = await saveKnowledgeFile(doc.id, file);
      await prisma.knowledgeVersion.create({
        data: { documentId: doc.id, versionNumber: 1, ...saved, uploadedById: user.id },
      });
    }

    const coverImage = formData.get('coverImage');
    if (coverImage instanceof File && coverImage.size > 0) {
      const savedCover = await saveKnowledgeFile(doc.id, coverImage);
      await prisma.knowledgeDocument.update({ where: { id: doc.id }, data: { coverImageUrl: savedCover.fileUrl } });
    }

    await logKnowledgeActivity({
      documentId: doc.id,
      actorId: user.id,
      action: submit ? 'SUBMITTED' : 'CREATED',
      description: submit
        ? `Document ${documentNumber} submitted for review by ${user.name}`
        : `Document ${documentNumber} saved as draft by ${user.name}`,
    });

    return NextResponse.json({ data: doc }, { status: 201 });
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Failed to create knowledge document:', error);
    return NextResponse.json({ error: 'Validation or server error' }, { status: 400 });
  }
}
