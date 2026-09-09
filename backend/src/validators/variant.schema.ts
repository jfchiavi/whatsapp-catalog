import { z } from 'zod';

export const createVariantSchema = z.object({
  productId: z.string().min(1),
  sku: z.string().min(3),
  price: z.number().positive(),
  cost: z.number().nonnegative(),
  attributes: z.record(z.string(), z.unknown()).default({}),
});

export const updateVariantSchema = z.object({
  sku: z.string().min(3).optional(),
  price: z.number().positive().optional(),
  cost: z.number().nonnegative().optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
});