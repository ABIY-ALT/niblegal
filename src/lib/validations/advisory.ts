import { z } from 'zod';
import {
  RequestType,
  Priority,
  ConfidentialityLevel,
  AssignmentAction,
  ApprovalStage,
  ApprovalDecision,
} from '@prisma/client';

export const legalRequestSchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200),
  categoryId: z.string().min(1, 'Category is required'),
  requestingDepartmentId: z.string().min(1, 'Requesting department is required'),
  requestType: z.nativeEnum(RequestType).default('LEGAL_OPINION'),
  priority: z.nativeEnum(Priority).default('MEDIUM'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  relatedContractId: z.string().optional().nullable(),
  dueDate: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  confidentiality: z.nativeEnum(ConfidentialityLevel).default('PUBLIC_INTERNAL'),
  tags: z.array(z.string()).default([]),
});
export type LegalRequestFormData = z.infer<typeof legalRequestSchema>;
export type LegalRequestFormInput = z.input<typeof legalRequestSchema>;

export const assignmentSchema = z.object({
  action: z.nativeEnum(AssignmentAction),
  officerId: z.string().optional().nullable(),
  priority: z.nativeEnum(Priority).optional(),
  slaHours: z.coerce.number().int().positive().optional(),
  notes: z.string().optional(),
});
export type AssignmentFormData = z.infer<typeof assignmentSchema>;

export const approvalSchema = z.object({
  stage: z.nativeEnum(ApprovalStage),
  decision: z.nativeEnum(ApprovalDecision),
  comments: z.string().optional(),
  delegatedToId: z.string().optional().nullable(),
});
export type ApprovalFormData = z.infer<typeof approvalSchema>;

export const opinionSaveSchema = z.object({
  content: z.string().min(1, 'Opinion content cannot be empty'),
  changeNote: z.string().optional(),
});
export type OpinionSaveFormData = z.infer<typeof opinionSaveSchema>;

export const commentSchema = z.object({
  text: z.string().min(1, 'Comment cannot be empty').max(4000),
  isInternal: z.boolean().default(true),
});
export type CommentFormData = z.infer<typeof commentSchema>;

export const dispatchSchema = z.object({
  recipientName: z.string().min(1, 'Recipient is required'),
  recipientEmail: z.string().email().optional().or(z.literal('')),
  notes: z.string().optional(),
});
export type DispatchFormData = z.infer<typeof dispatchSchema>;
