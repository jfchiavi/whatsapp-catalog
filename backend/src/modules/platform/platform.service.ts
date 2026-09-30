import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errors';

export const getAllTenants = async () => {
  return prisma.tenant.findMany({
    include: {
      _count: {
        select: {
          users: true,
          products: true,
          branches: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });
};

export const getTenantById = async (id: string) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          users: true,
          products: true,
          branches: true,
        },
      },
    },
  });

  if (!tenant) {
    throw new AppError('Tenant not found', 404, 'NOT_FOUND');
  }

  return tenant;
};

export const createTenant = async (data: {
  name: string;
  slug: string;
  domain?: string;
  logoUrl?: string;
  primaryColor?: string;
  description?: string;
  whatsappNumber?: string;
}) => {
  const existing = await prisma.tenant.findFirst({
    where: { OR: [{ name: data.name }, { slug: data.slug }] },
  });

  if (existing) {
    throw new AppError('Tenant with this name or slug already exists', 409, 'TENANT_EXISTS');
  }

  return prisma.tenant.create({
    data: {
      name: data.name,
      slug: data.slug,
      domain: data.domain,
      logoUrl: data.logoUrl,
      primaryColor: data.primaryColor,
      description: data.description,
      whatsappNumber: data.whatsappNumber,
    },
  });
};

export const updateTenant = async (
  id: string,
  data: {
    name?: string;
    slug?: string;
    domain?: string;
    logoUrl?: string;
    primaryColor?: string;
    description?: string;
    whatsappNumber?: string;
  }
) => {
  const tenant = await prisma.tenant.findUnique({ where: { id } });

  if (!tenant) {
    throw new AppError('Tenant not found', 404, 'NOT_FOUND');
  }

  if (data.slug && data.slug !== tenant.slug) {
    const slugExists = await prisma.tenant.findFirst({
      where: { slug: data.slug, id: { not: id } },
    });
    if (slugExists) {
      throw new AppError('Slug already in use', 409, 'SLUG_EXISTS');
    }
  }

  return prisma.tenant.update({
    where: { id },
    data,
  });
};

export const deactivateTenant = async (id: string) => {
  const tenant = await prisma.tenant.findUnique({ where: { id } });

  if (!tenant) {
    throw new AppError('Tenant not found', 404, 'NOT_FOUND');
  }

  return prisma.tenant.delete({ where: { id } });
};

export const getPlatformStats = async () => {
  const [tenantCount, userCount, productCount, orderCount] = await Promise.all([
    prisma.tenant.count(),
    prisma.user.count(),
    prisma.product.count(),
    prisma.order.count(),
  ]);

  const recentTenants = await prisma.tenant.findMany({
    take: 5,
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { users: true, products: true } },
    },
  });

  return {
    tenantCount,
    userCount,
    productCount,
    orderCount,
    recentTenants,
  };
};
