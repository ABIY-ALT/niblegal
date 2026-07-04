import { z } from 'zod';
import { ConfidentialityLevel, KnowledgeApprovalStage, ApprovalDecision } from '@prisma/client';

export const knowledgeDocumentSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  categoryId: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  tagNames: z.array(z.string()).default([]),
  confidentiality: z.nativeEnum(ConfidentialityLevel).default('PUBLIC_INTERNAL'),
  relatedContractId: z.string().optional().nullable(),
  relatedLegalRequestId: z.string().optional().nullable(),
  relatedDepartmentId: z.string().optional().nullable(),
  effectiveDate: z.string().optional().transform((v) => (v ? new Date(v) : undefined)),
  reviewDate: z.string().optional().transform((v) => (v ? new Date(v) : undefined)),
  expiryDate: z.string().optional().transform((v) => (v ? new Date(v) : undefined)),
  lawName: z.string().optional(),
  articleNumber: z.string().optional(),
  sectionNumber: z.string().optional(),
  content: z.string().optional(), // for authored templates/clauses/memos
});
export type KnowledgeDocumentFormData = z.infer<typeof knowledgeDocumentSchema>;
export type KnowledgeDocumentFormInput = z.input<typeof knowledgeDocumentSchema>;

export const knowledgeApprovalSchema = z.object({
  stage: z.nativeEnum(KnowledgeApprovalStage),
  decision: z.nativeEnum(ApprovalDecision),
  comments: z.string().optional(),
});
export type KnowledgeApprovalFormData = z.infer<typeof knowledgeApprovalSchema>;

export const knowledgeCommentSchema = z.object({
  text: z.string().min(1, 'Comment cannot be empty').max(4000),
  isInternal: z.boolean().default(true),
});
export type KnowledgeCommentFormData = z.infer<typeof knowledgeCommentSchema>;
