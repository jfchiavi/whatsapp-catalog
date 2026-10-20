import { z } from 'zod';
import { DiscountType } from '@prisma/client';

const dateRangeRefine = (data: { startDate: Date; endDate: Date }) => data.endDate > data.startDate;

export const createDiscountSchema = z
  .object({
    name: z.string().min(2).max(120),
    type: z.enum(DiscountType),
    value: z.number().positive(),
    productId: z.string().uuid().nullish(),
    variantId: z.string().uuid().nullish(),
    active: z.boolean().optional().default(true),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine(dateRangeRefine, { message: 'endDate must be after startDate', path: ['endDate'] })
  .refine((data) => data.type !== 'PERCENTAGE' || data.value <= 100, {
    message: 'PERCENTAGE value must be at most 100',
    path: ['value'],
  });

export const updateDiscountSchema = z
  .object({
    name: z.string().min(2).max(120).optional(),
    type: z.enum(DiscountType).optional(),
    value: z.number().positive().optional(),
    productId: z.string().uuid().nullish(),
    variantId: z.string().uuid().nullish(),
    active: z.boolean().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  })
  .refine((data) => !data.startDate || !data.endDate || data.endDate > data.startDate, {
    message: 'endDate must be after startDate',
    path: ['endDate'],
  })
  .refine(
    (data) => data.type !== 'PERCENTAGE' || data.value === undefined || data.value <= 100,
    { message: 'PERCENTAGE value must be at most 100', path: ['value'] }
  );

export const discountQuerySchema = z.object({
  active: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
});
