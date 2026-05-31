import { z } from 'zod';

export const adjustStockSchema = z.object({
  productId: z.string().uuid(),
  branchId: z.string().uuid(),
  quantity: z.number().int(),
});

export const transferStockSchema = z.object({
  productId: z.string().uuid(),
  fromBranchId: z.string().uuid(),
  toBranchId: z.string().uuid(),
  quantity: z.number().int().positive(),
});
