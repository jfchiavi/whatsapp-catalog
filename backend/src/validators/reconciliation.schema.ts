import { z } from 'zod';

export const reconciliationQuerySchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ReconciliationQueryInput = z.infer<typeof reconciliationQuerySchema>;
