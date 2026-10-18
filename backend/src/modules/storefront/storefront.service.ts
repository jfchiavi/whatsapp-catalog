import { Prisma, type TenantHomePage } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import { tenantHomeContentSchema } from '@/validators/tenant.schema';

export type TenantHomeContent = Prisma.InputJsonObject & {
  version: 1;
  industry: 'construction' | 'electronics' | 'beauty' | 'fashion' | 'other';
  hero: {
    title: string;
    description: string;
    imageUrl: string | null;
    ctaLabel: string;
  };
};

const getDefaultContent = (tenant: { name: string; description: string | null }): TenantHomeContent => ({
  version: 1,
  industry: 'other',
  hero: {
    title: tenant.name,
    description: tenant.description ?? '',
    imageUrl: null,
    ctaLabel: 'Ver catálogo',
  },
});

export const getOrCreateTenantHomePage = async (tenantId: string) => {
  const tenant = await prisma.tenant.findFirst({
    where: { id: tenantId, active: true },
    select: { id: true, name: true, slug: true, description: true },
  });

  if (!tenant) {
    throw new AppError('Tenant not found', 404, 'TENANT_NOT_FOUND');
  }

  const page = await prisma.tenantHomePage.upsert({
    where: { tenantId },
    create: {
      tenantId,
      draftContent: getDefaultContent(tenant),
    },
    update: {},
  });

  const parsedDraft = tenantHomeContentSchema.safeParse(page.draftContent);
  if (!parsedDraft.success) {
    throw new AppError('Stored tenant home draft is invalid', 500, 'INVALID_STOREFRONT_CONTENT');
  }

  return { tenant, page, draftContent: parsedDraft.data };
};

export const saveTenantHomeDraft = async (tenantId: string, content: TenantHomeContent) => {
  const { tenant } = await getOrCreateTenantHomePage(tenantId);
  const normalizedContent = tenantHomeContentSchema.parse(content);

  const page = await prisma.tenantHomePage.update({
    where: { tenantId },
    data: { draftContent: normalizedContent as Prisma.InputJsonValue },
  });

  return { tenant, page, draftContent: normalizedContent };
};

export const publishTenantHomeDraft = async (tenantId: string): Promise<TenantHomePage> => {
  await getOrCreateTenantHomePage(tenantId);

  return prisma.$transaction(async (transaction) => {
    const page = await transaction.tenantHomePage.findUnique({ where: { tenantId } });
    if (!page) {
      throw new AppError('Tenant home draft not found', 404, 'STOREFRONT_NOT_FOUND');
    }

    const parsedDraft = tenantHomeContentSchema.safeParse(page.draftContent);
    if (!parsedDraft.success) {
      throw new AppError('Stored tenant home draft is invalid', 500, 'INVALID_STOREFRONT_CONTENT');
    }

    return transaction.tenantHomePage.update({
      where: { tenantId },
      data: {
        publishedContent: parsedDraft.data as Prisma.InputJsonValue,
        publishedAt: new Date(),
      },
    });
  });
};

export const getPublishedTenantHome = async (slug: string) => {
  const tenant = await prisma.tenant.findFirst({
    where: { slug, active: true },
    select: {
      homePage: {
        select: { publishedContent: true, publishedAt: true },
      },
    },
  });

  if (!tenant?.homePage?.publishedContent) {
    return null;
  }

  const parsedContent = tenantHomeContentSchema.safeParse(tenant.homePage.publishedContent);
  if (!parsedContent.success) {
    throw new AppError('Published tenant home content is invalid', 500, 'INVALID_STOREFRONT_CONTENT');
  }

  return {
    content: parsedContent.data,
    publishedAt: tenant.homePage.publishedAt,
  };
};