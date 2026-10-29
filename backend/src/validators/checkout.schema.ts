import { z } from 'zod';

export const checkoutSchema = z.object({
  orderId: z.string().uuid(),
  customerEmail: z.email(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
