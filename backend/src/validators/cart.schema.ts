import { z } from 'zod';

export const addToCartSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0),
});

export const setCartBranchSchema = z.object({
  branchId: z.string().uuid(),
});

export const submitCartSchema = z.object({
  customerName: z.string().min(2),
  customerPhone: z.string().min(6),
  customerNotes: z.string().optional(),
});
