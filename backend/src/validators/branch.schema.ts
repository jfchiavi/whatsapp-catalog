import { z } from 'zod';

export const createBranchSchema = z.object({
  name: z.string().min(2),
  type: z.enum(['physical', 'virtual']),
  address: z.string().optional(),
  hours: z.string().optional(),
});

export const updateBranchSchema = z.object({
  name: z.string().min(2).optional(),
  type: z.enum(['physical', 'virtual']).optional(),
  address: z.string().optional(),
  hours: z.string().optional(),
});
