import { z } from 'zod';

export const customerQuerySchema = z.object({
  search: z.string().min(1).max(120).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export const findOrCreateCustomerSchema = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().min(6).max(32),
  email: z.email().nullish(),
  notes: z.string().max(500).nullish(),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  phone: z.string().min(6).max(32).optional(),
  email: z.email().nullish(),
  notes: z.string().max(500).nullish(),
});
