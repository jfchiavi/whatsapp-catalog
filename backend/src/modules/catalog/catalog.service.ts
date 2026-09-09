import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errors';

export const getCatalogProducts = async (tenantId: string) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true },
  });

  if (!tenant) {
    throw new AppError('Tenant not found', 404, 'NOT_FOUND');
  }

  return prisma.product.findMany({
    where: { tenantId, active: true },
    orderBy: { name: 'asc' },
    include: {
      variants: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });
};

export const getCatalogProductById = async (id: string, tenantId: string) => {
  const product = await prisma.product.findFirst({
    where: { id, tenantId, active: true },
    include: {
      variants: true,
    },
  });

  if (!product) {
    throw new AppError('Product not found', 404, 'NOT_FOUND');
  }

  return product;
};
