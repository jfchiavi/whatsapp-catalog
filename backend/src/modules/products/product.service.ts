import { prisma } from '@/lib/prisma';

export const getProducts = async (tenantId: string) => {
  return prisma.product.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' },
    include: {
      variants: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });
};

export const getProductById = async (id: string, tenantId: string) => {
  return prisma.product.findFirst({
    where: { id, tenantId },
    include: {
      variants: true,
    },
  });
};

export const createProduct = async (data: {
  name: string;
  imageUrl?: string;
  batch?: string;
  expirationDate?: Date;
  baseAttributes?: Record<string, unknown>;
  active?: boolean;
  tenantId: string;
}) => {
  return prisma.product.create({
    data: {
      name: data.name,
      imageUrl: data.imageUrl,
      batch: data.batch,
      expirationDate: data.expirationDate,
      baseAttributes: data.baseAttributes ?? {},
      active: data.active ?? true,
      tenantId: data.tenantId,
    },
  });
};

export const updateProduct = async (
  id: string,
  tenantId: string,
  data: Partial<{
    name: string;
    imageUrl?: string;
    batch?: string;
    expirationDate?: Date;
    baseAttributes?: Record<string, unknown>;
    active?: boolean;
  }>
) => {
  return prisma.product.update({
    where: { id, tenantId },
    data: {
      name: data.name,
      imageUrl: data.imageUrl,
      batch: data.batch,
      expirationDate: data.expirationDate,
      baseAttributes: data.baseAttributes,
      active: data.active,
    },
  });
};

export const deleteProduct = async (id: string, tenantId: string) => {
  return prisma.product.delete({ where: { id, tenantId } });
};