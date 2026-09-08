import { z } from 'zod';

export const registerTenantSchema = z.object({
  tenantName: z.string().min(2),
  adminName: z.string().min(2),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(6),
});
