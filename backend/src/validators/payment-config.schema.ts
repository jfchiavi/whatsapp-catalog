import { z } from 'zod';

export const paymentGatewaySchema = z.enum(['LIBELULA', 'CUCU']);

export const billingProviderSchema = z.enum(['FACTELEC', 'LIBELULA_NATIVE']);

export const paymentConfigInputSchema = z.object({
  gateway: paymentGatewaySchema,
  appkey: z.string().min(8).max(512).optional(),
  isActive: z.boolean().default(true),
});

export const billingConfigInputSchema = z.object({
  provider: billingProviderSchema,
  isEnabled: z.boolean(),
  credentials: z
    .record(
      z.string().min(1).max(64),
      z.string().min(1).max(2048)
    )
    .refine((value) => Object.keys(value).length <= 20, {
      message: 'Too many credential entries',
    })
    .optional(),
});

export type PaymentConfigInput = z.infer<typeof paymentConfigInputSchema>;
export type BillingConfigInput = z.infer<typeof billingConfigInputSchema>;
