import { z } from 'zod';
import { ContractCategory } from '@prisma/client';

export const contractSchema = z.object({
  title: z.string().min(3, 'Title is required').max(200),
  category: z.nativeEnum(ContractCategory),
  requestingDepartmentId: z.string().optional(),
  counterparty: z.string().min(2, 'Vendor/Counterparty is required'),
  description: z.string().optional(),
  value: z.coerce.number().optional(),
  currency: z.string().default('ETB'),
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  expiryDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  renewalAlertDays: z.coerce.number().default(30),
  requiresDirectorApproval: z.boolean().optional().default(false),
  tags: z.array(z.string()).default([]),
});

export type ContractFormData = z.infer<typeof contractSchema>;

/** Editable fields for PATCH — everything optional. */
export const contractUpdateSchema = contractSchema.partial();

export const contractAssignSchema = z.object({
  assigneeId: z.string().min(1, 'Select an officer'),
  notes: z.string().optional(),
});

export const contractReviewSchema = z.object({
  decision: z.enum(['APPROVE', 'RETURN']),
  comments: z.string().optional(),
});

export const contractApprovalSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED', 'RETURNED', 'DELEGATED']),
  comments: z.string().optional(),
  delegatedToId: z.string().optional(),
});
