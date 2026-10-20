import { StorefrontMetricEvent } from '@prisma/client';
import { z } from 'zod';

export const recordStorefrontMetricSchema = z.object({
  event: z.enum(StorefrontMetricEvent),
  target: z.string().trim().max(120).optional().default(''),
}).strict();

export const storefrontMetricsRangeSchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(30),
});