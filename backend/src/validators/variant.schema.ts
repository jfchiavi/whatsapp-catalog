import { z } from 'zod';

export const createVariantSchema = z.object({
  productId: z.string().min(1),
  sku: z.string().min(3),
  price: z.number().positive(),
  cost: z.number().nonnegative(),
  codigoProductoSin: z.string().min(1).max(32).nullish(),
  attributes: z.record(z.string(), z.unknown()).default({}),
});

export const updateVariantSchema = z.object({
  sku: z.string().min(3).optional(),
  price: z.number().positive().optional(),
  cost: z.number().nonnegative().optional(),
  codigoProductoSin: z.string().min(1).max(32).nullish(),
  attributes: z.record(z.string(), z.unknown()).optional(),
});
