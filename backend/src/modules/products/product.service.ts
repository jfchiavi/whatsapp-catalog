import { prisma } from '@/lib/prisma';

export const getProducts = async () => {
  return prisma.product.findMany({
    orderBy: { name: 'asc' },
    include: {
      variants: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });
};

export const getProductById = async (id: string) => {
  return prisma.product.findUnique({
    where: { id },
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
}) => {
  return prisma.product.create({
    data: {
      name: data.name,
      imageUrl: data.imageUrl,
      batch: data.batch,
      expirationDate: data.expirationDate,
      baseAttributes: data.baseAttributes ?? {},
      active: data.active ?? true,
    },
  });
};

export const updateProduct = async (
  id: string,
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
    where: { id },
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

export const deleteProduct = async (id: string) => {
  return prisma.product.delete({ where: { id } });
};