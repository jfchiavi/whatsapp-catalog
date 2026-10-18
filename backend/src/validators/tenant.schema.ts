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

const tenantIndustrySchema = z.enum([
  'construction',
  'electronics',
  'beauty',
  'fashion',
  'home',
  'food',
  'sports',
  'pets',
  'other',
]);

const tenantHomeV1Schema = z.object({
  version: z.literal(1),
  industry: z.enum(['construction', 'electronics', 'beauty', 'fashion', 'other']),
  hero: z.object({
    title: z.string().trim().min(2).max(100),
    description: z.string().trim().max(500),
    imageUrl: imageUrlSchema.nullable(),
    ctaLabel: z.string().trim().min(2).max(40),
  }).strict(),
}).strict();

const sectionBaseSchema = z.object({
  id: z.string().min(1).max(60),
  enabled: z.boolean(),
});

const sectionImageUrlSchema = imageUrlSchema.nullable();

const tenantHomeSectionSchema = z.discriminatedUnion('type', [
  sectionBaseSchema.extend({
    type: z.literal('hero'),
    title: z.string().trim().min(2).max(100),
    description: z.string().trim().max(500),
    imageUrl: sectionImageUrlSchema,
    ctaLabel: z.string().trim().min(2).max(40),
  }).strict(),
  sectionBaseSchema.extend({
    type: z.literal('categories'),
    title: z.string().trim().min(2).max(100),
    items: z.array(z.object({
      label: z.string().trim().min(1).max(60),
      attributeKey: z.string().trim().min(1).max(80),
      attributeValue: z.string().trim().min(1).max(120),
    }).strict()).max(16),
  }).strict(),
  sectionBaseSchema.extend({
    type: z.literal('featuredProducts'),
    title: z.string().trim().min(2).max(100),
    productIds: z.array(z.string().uuid()).max(12),
  }).strict(),
  sectionBaseSchema.extend({
    type: z.literal('promotion'),
    title: z.string().trim().min(2).max(100),
    description: z.string().trim().max(500),
    imageUrl: sectionImageUrlSchema,
    ctaLabel: z.string().trim().min(2).max(40),
    startsAt: z.string().datetime().nullable(),
    endsAt: z.string().datetime().nullable(),
  }).strict().superRefine((section, context) => {
    if (section.startsAt && section.endsAt && Date.parse(section.endsAt) <= Date.parse(section.startsAt)) {
      context.addIssue({ code: 'custom', path: ['endsAt'], message: 'Promotion end must be after its start' });
    }
  }),
  sectionBaseSchema.extend({
    type: z.literal('benefits'),
    title: z.string().trim().min(2).max(100),
    items: z.array(z.object({
      title: z.string().trim().min(2).max(80),
      description: z.string().trim().max(240),
    }).strict()).max(8),
  }).strict(),
  sectionBaseSchema.extend({
    type: z.literal('contact'),
    title: z.string().trim().min(2).max(100),
    address: z.string().trim().max(200),
    hours: z.string().trim().max(200),
    phone: z.string().trim().max(40),
    email: z.union([z.email(), z.literal('')]),
  }).strict(),
]);

export const tenantHomeV2Schema = z.object({
  version: z.literal(2),
  industry: tenantIndustrySchema,
  sections: z.array(tenantHomeSectionSchema).max(12),
}).strict().superRefine((content, context) => {
  const sectionIds = content.sections.map((section) => section.id);
  if (new Set(sectionIds).size !== sectionIds.length) {
    context.addIssue({ code: 'custom', path: ['sections'], message: 'Section IDs must be unique' });
  }
});

export const tenantHomeContentSchema = z.union([tenantHomeV1Schema, tenantHomeV2Schema]);

export const normalizeTenantHomeContent = (input: unknown) => {
  const parsed = tenantHomeContentSchema.parse(input);
  if (parsed.version === 2) return parsed;

  return tenantHomeV2Schema.parse({
    version: 2,
    industry: parsed.industry,
    sections: [{
      id: 'hero-main',
      type: 'hero',
      enabled: true,
      ...parsed.hero,
    }],
  });
};

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
