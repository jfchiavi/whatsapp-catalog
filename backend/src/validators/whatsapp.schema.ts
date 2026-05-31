import { z } from 'zod';

export const createWhatsappOrderSchema = z.object({
  customerName: z.string().min(2),
  customerPhone: z.string().min(6),
  message: z.string().min(5),
  total: z.number().positive(),
});

export const updateWhatsappStatusSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed']),
});
