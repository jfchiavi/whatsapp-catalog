import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2),
  imageUrl: z.string().url().optional(),
  batch: z.string().optional(),
  expirationDate: z.date().optional(),
  baseAttributes: z.record(z.unknown()).default({}),
  active: z.boolean().optional().default(true),
});

export const updateProductSchema = z.object({
  name: z.string().min(2).optional(),
  imageUrl: z.string().url().optional(),
  batch: z.string().optional(),
  expirationDate: z.date().optional(),
  baseAttributes: z.record(z.unknown()).optional(),
  active: z.boolean().optional(),
});