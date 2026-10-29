import { z } from 'zod';

export const checkoutSchema = z.object({
  orderId: z.string().uuid(),
  customerEmail: z.email(),
  customerNit: z
    .string()
    .min(5)
    .max(20)
    .regex(/^[0-9a-zA-Z-]+$/, 'Invalid document number')
    .optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
