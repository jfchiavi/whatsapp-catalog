import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '@/lib/errors';

export const getVariantsByProduct = async (productId: string, tenantId: string) => {
  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId },
  });

  if (!product) {
    throw new AppError('Product not found', 404, 'NOT_FOUND');
  }

  return prisma.variant.findMany({
    where: { productId, tenantId },
    orderBy: { createdAt: 'asc' },
  });
};

export const getVariantById = async (id: string, tenantId: string) => {
  return prisma.variant.findFirst({
    where: { id, tenantId },
  });
};

export const createVariant = async (data: {
  productId: string;
  sku: string;
  price: number;
  cost: number;
  attributes?: Prisma.InputJsonValue;
  tenantId: string;
}) => {
  const product = await prisma.product.findFirst({
    where: { id: data.productId, tenantId: data.tenantId },
  });

  if (!product) {
    throw new AppError('Product not found', 404, 'NOT_FOUND');
  }

  const existing = await prisma.variant.findFirst({
    where: { sku: data.sku, tenantId: data.tenantId },
  });

  if (existing) {
    throw new AppError('Variant with this SKU already exists', 409, 'CONFLICT');
  }

  return prisma.variant.create({
    data: {
      productId: data.productId,
      sku: data.sku,
      price: data.price,
      cost: data.cost,
      attributes: data.attributes ?? ({} as Prisma.InputJsonValue),
      tenantId: data.tenantId,
    },
  });
};

export const updateVariant = async (
  id: string,
  tenantId: string,
  data: Partial<{
    sku: string;
    price: number;
    cost: number;
    attributes: Prisma.InputJsonValue;
  }>
) => {
  const variant = await prisma.variant.findFirst({
    where: { id, tenantId },
  });

  if (!variant) {
    throw new AppError('Variant not found', 404, 'NOT_FOUND');
  }

  if (data.sku && data.sku !== variant.sku) {
    const existing = await prisma.variant.findFirst({
      where: { sku: data.sku, tenantId, id: { not: id } },
    });

    if (existing) {
      throw new AppError('Variant with this SKU already exists', 409, 'CONFLICT');
    }
  }

  return prisma.variant.update({
    where: { id },
    data: {
      sku: data.sku,
      price: data.price,
      cost: data.cost,
      attributes: data.attributes,
    },
  });
};

export const deleteVariant = async (id: string, tenantId: string) => {
  const variant = await prisma.variant.findFirst({
    where: { id, tenantId },
  });

  if (!variant) {
    throw new AppError('Variant not found', 404, 'NOT_FOUND');
  }

  return prisma.variant.delete({ where: { id } });
};
