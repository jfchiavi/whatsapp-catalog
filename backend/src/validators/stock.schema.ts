import { z } from 'zod';

export const adjustStockSchema = z.object({
  variantId: z.string().uuid(),
  branchId: z.string().uuid(),
  quantity: z.number().int(),
});

export const transferStockSchema = z.object({
  variantId: z.string().uuid(),
  fromBranchId: z.string().uuid(),
  toBranchId: z.string().uuid(),
  quantity: z.number().int().positive(),
});
