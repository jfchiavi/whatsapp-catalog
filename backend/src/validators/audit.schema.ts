import { z } from 'zod';

export const auditQuerySchema = z.object({
  entity: z.string().min(1).max(64).optional(),
  action: z.enum(['CREATE', 'UPDATE', 'DELETE']).optional(),
  userId: z.string().uuid().optional(),
  entityId: z.string().min(1).max(64).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});
