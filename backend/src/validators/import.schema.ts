import { z } from 'zod';

export const importCsvSchema = z.object({
  csv: z.string().min(1).max(2_000_000),
});

export const exportSalesQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
