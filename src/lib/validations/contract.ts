import { z } from 'zod';
import { ContractCategory } from '@prisma/client';

export const contractSchema = z.object({
  title: z.string().min(3, 'Title is required').max(200),
  category: z.nativeEnum(ContractCategory),
  requestingDepartment: z.string().min(1, 'Department is required'),
  counterparty: z.string().min(2, 'Vendor/Counterparty is required'),
  description: z.string().optional(),
  value: z.coerce.number().optional(),
  currency: z.string().default('ETB'),
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  expiryDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  renewalAlertDays: z.coerce.number().default(30),
  tags: z.array(z.string()).default([]),
});

export type ContractFormData = z.infer<typeof contractSchema>;
