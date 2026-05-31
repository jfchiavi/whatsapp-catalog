import { z } from 'zod';

export const createBranchSchema = z.object({
  name: z.string().min(2),
  type: z.enum(['physical', 'virtual']),
});
