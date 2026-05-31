import { z } from 'zod';

export const createSaleSchema = z.object({
  branchId: z.string().uuid().optional(),
  items: z.array(
    z.object({
      variantId: z.string().uuid(),
      quantity: z.number().int().positive(),
    })
  ).min(1),
}).refine(
  (data) => {
    // If branchId is provided, it must be a valid UUID
    // If branchId is not provided, it will be validated in the service layer
    return true;
  }
);