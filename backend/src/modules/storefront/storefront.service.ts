import { Prisma, type TenantHomePage } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import { normalizeTenantHomeContent } from '@/validators/tenant.schema';

export type TenantHomeContent = ReturnType<typeof normalizeTenantHomeContent>;

const getDefaultContent = (tenant: { name: string; description: string | null }): TenantHomeContent => ({
  version: 2,
  industry: 'other',
  sections: [{
    id: 'hero-main',
    type: 'hero',
    enabled: true,
    title: tenant.name,
    description: tenant.description ?? '',
    imageUrl: null,
    ctaLabel: 'Ver catálogo',
  }],
});

const validateTenantReferences = async (
  client: Prisma.TransactionClient | typeof prisma,
  tenantId: string,
  content: TenantHomeContent
) => {
  const requestedProductIds = [...new Set(content.sections
    .filter((section) => section.type === 'featuredProducts')
    .flatMap((section) => section.productIds))];

  if (requestedProductIds.length > 0) {
    const activeProducts = await client.product.findMany({
      where: { tenantId, active: true, id: { in: requestedProductIds } },
      select: { id: true },
    });
    if (activeProducts.length !== requestedProductIds.length) {
      throw new AppError('Featured products must be active products from this tenant', 400, 'INVALID_STOREFRONT_REFERENCE');
    }
  }

  const categorySections = content.sections.filter((section) => section.type === 'categories');
  const requestedCategories = categorySections
    .filter((section) => section.type === 'categories')
    .flatMap((section) => section.items);

  if (categorySections.some((section) => section.items.length === 0)) {
    throw new AppError('Category sections must contain at least one category link', 400, 'INVALID_STOREFRONT_REFERENCE');
  }

  const benefitsSections = content.sections.filter((section) => section.type === 'benefits');
  if (benefitsSections.some((section) => section.items.length === 0)) {
    throw new AppError('Benefits sections must contain at least one benefit', 400, 'INVALID_STOREFRONT_CONTENT');
  }

  const contactSections = content.sections.filter((section) => section.type === 'contact');
  if (contactSections.some((section) => !section.address && !section.hours && !section.phone && !section.email)) {
    throw new AppError('Contact sections must contain at least one contact detail', 400, 'INVALID_STOREFRONT_CONTENT');
  }

  if (requestedCategories.length > 0) {
    const activeProducts = await client.product.findMany({
      where: { tenantId, active: true },
      select: { baseAttributes: true },
    });
    const availableValues = new Set<string>();
    activeProducts.forEach((product) => {
      if (!product.baseAttributes || typeof product.baseAttributes !== 'object' || Array.isArray(product.baseAttributes)) return;
      for (const [key, value] of Object.entries(product.baseAttributes)) {
        if (typeof value === 'string' || typeof value === 'number') {
          availableValues.add(`${key}\u0000${String(value).trim()}`);
        }
      }
    });

    if (requestedCategories.some((item) => !availableValues.has(`${item.attributeKey}\u0000${item.attributeValue}`))) {
      throw new AppError('Categories must reference existing product attributes from this tenant', 400, 'INVALID_STOREFRONT_REFERENCE');
    }
  }
};

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

  let draftContent: TenantHomeContent;
  try {
    draftContent = normalizeTenantHomeContent(page.draftContent);
  } catch {
    throw new AppError('Stored tenant home draft is invalid', 500, 'INVALID_STOREFRONT_CONTENT');
  }

  return { tenant, page, draftContent };
};

export const saveTenantHomeDraft = async (tenantId: string, content: unknown) => {
  const { tenant } = await getOrCreateTenantHomePage(tenantId);
  const normalizedContent = normalizeTenantHomeContent(content);
  await validateTenantReferences(prisma, tenantId, normalizedContent);

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

    let draftContent: TenantHomeContent;
    try {
      draftContent = normalizeTenantHomeContent(page.draftContent);
    } catch {
      throw new AppError('Stored tenant home draft is invalid', 500, 'INVALID_STOREFRONT_CONTENT');
    }

    await validateTenantReferences(transaction, tenantId, draftContent);
    const revision = page.revision + 1;
    const publishedAt = new Date();
    const updatedPage = await transaction.tenantHomePage.update({
      where: { tenantId },
      data: {
        publishedContent: draftContent as Prisma.InputJsonValue,
        publishedAt,
        revision,
      },
    });

    await transaction.tenantHomePublication.create({
      data: {
        tenantId,
        revision,
        content: draftContent as Prisma.InputJsonValue,
        publishedAt,
      },
    });
    return updatedPage;
  });
};

export const getTenantHomePublicationHistory = async (tenantId: string) => {
  return prisma.tenantHomePublication.findMany({
    where: { tenantId },
    orderBy: { revision: 'desc' },
    take: 50,
    select: { id: true, revision: true, publishedAt: true },
  });
};

export const restoreTenantHomePublicationToDraft = async (tenantId: string, revision: number) => {
  const publication = await prisma.tenantHomePublication.findFirst({
    where: { tenantId, revision },
    select: { content: true },
  });
  if (!publication) {
    throw new AppError('Publication not found', 404, 'STOREFRONT_PUBLICATION_NOT_FOUND');
  }

  const content = normalizeTenantHomeContent(publication.content);
  await validateTenantReferences(prisma, tenantId, content);
  const page = await prisma.tenantHomePage.update({
    where: { tenantId },
    data: { draftContent: content as Prisma.InputJsonValue },
  });
  return { page, draftContent: content };
};

export const getPublishedTenantHome = async (slug: string) => {
  const tenant = await prisma.tenant.findFirst({
    where: { slug, active: true },
    select: {
      homePage: {
        select: { publishedContent: true, publishedAt: true, revision: true },
      },
    },
  });

  if (!tenant?.homePage?.publishedContent) {
    return null;
  }

  let content: TenantHomeContent;
  try {
    content = normalizeTenantHomeContent(tenant.homePage.publishedContent);
  } catch {
    throw new AppError('Published tenant home content is invalid', 500, 'INVALID_STOREFRONT_CONTENT');
  }

  return {
    content,
    publishedAt: tenant.homePage.publishedAt,
    revision: tenant.homePage.revision,
  };
};