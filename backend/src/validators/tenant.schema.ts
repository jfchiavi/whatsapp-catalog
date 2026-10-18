import { z } from 'zod';

const imageUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    if (!value) return true;
    try {
      return ['http:', 'https:'].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }, 'Image URL must use HTTP or HTTPS')
  .transform((value) => value || null);

export const tenantHomeContentSchema = z.object({
  version: z.literal(1),
  industry: z.enum(['construction', 'electronics', 'beauty', 'fashion', 'other']),
  hero: z.object({
    title: z.string().trim().min(2).max(100),
    description: z.string().trim().max(500),
    imageUrl: imageUrlSchema.nullable(),
    ctaLabel: z.string().trim().min(2).max(40),
  }).strict(),
}).strict();

export const updateTenantHomeDraftSchema = z.object({
  content: tenantHomeContentSchema,
}).strict();

export const registerTenantSchema = z.object({
  tenantName: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  adminName: z.string().min(2),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(6),
});

export const updateTenantConfigSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/).optional(),
  domain: z.string().nullable().optional(),
  logoUrl: z.string().url().nullable().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  description: z.string().nullable().optional(),
  whatsappNumber: z.string().nullable().optional(),
});
