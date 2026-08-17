import { z } from 'zod';
import { LitigationRisk, LitigationRole, LitigationStatus, HearingType } from '@prisma/client';

export const litigationCaseSchema = z.object({
  title: z.string().min(3, 'Title is required').max(200),
  category: z.string(),
  riskLevel: z.nativeEnum(LitigationRisk).default('MEDIUM'),
  bankRole: z.nativeEnum(LitigationRole).default('DEFENDANT'),
  opposingParty: z.string().min(2, 'Opposing party is required'),
  court: z.string().optional(),
  description: z.string().optional(),
  exposureAmount: z.coerce.number().optional(),
  currency: z.string().default('ETB'),
  filedDate: z.string().optional().transform((v) => (v ? new Date(v) : undefined)),
  requestingDepartmentId: z.string().optional(),
  assignedOfficerId: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export type LitigationCaseFormData = z.infer<typeof litigationCaseSchema>;

export const litigationCaseUpdateSchema = litigationCaseSchema.partial().extend({
  status: z.nativeEnum(LitigationStatus).optional(),
  outcome: z.string().optional(),
  closedDate: z.string().optional().transform((v) => (v ? new Date(v) : undefined)),
});

export const litigationHearingSchema = z.object({
  type: z.nativeEnum(HearingType).default('HEARING'),
  scheduledAt: z.string().min(1, 'Date/time is required').transform((v) => new Date(v)),
  location: z.string().optional(),
  notes: z.string().optional(),
});
