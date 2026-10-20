import { DiscountType, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errors';

export type DiscountInput = {
  name: string;
  type: DiscountType;
  value: number;
  productId?: string | null;
  variantId?: string | null;
  active?: boolean;
  startDate: Date;
  endDate: Date;
};

export type PricedItem = {
  variantId: string;
  quantity: number;
  unitPrice: number;
};

export type PricedItemResult = PricedItem & {
  discount: { id: string; name: string; type: DiscountType; value: number } | null;
  unitPriceAfterDiscount: number;
  lineTotal: number;
};

const assertScopeBelongsToTenant = async (
  tenantId: string,
  productId?: string | null,
  variantId?: string | null
) => {
  if (variantId) {
    const variant = await prisma.variant.findFirst({ where: { id: variantId, tenantId } });
    if (!variant) {
      throw new AppError('Variant not found in this tenant', 404, 'VARIANT_NOT_FOUND');
    }
    if (productId && variant.productId !== productId) {
      throw new AppError('Variant does not belong to the given product', 400, 'SCOPE_MISMATCH');
    }
    return;
  }

  if (productId) {
    const product = await prisma.product.findFirst({ where: { id: productId, tenantId } });
    if (!product) {
      throw new AppError('Product not found in this tenant', 404, 'PRODUCT_NOT_FOUND');
    }
  }
};

export const getDiscounts = async (tenantId: string, active?: boolean) => {
  return prisma.discount.findMany({
    where: { tenantId, ...(active === undefined ? {} : { active }) },
    include: {
      product: { select: { id: true, name: true } },
      variant: { select: { id: true, sku: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getDiscountById = async (id: string, tenantId: string) => {
  const discount = await prisma.discount.findFirst({
    where: { id, tenantId },
    include: {
      product: { select: { id: true, name: true } },
      variant: { select: { id: true, sku: true } },
    },
  });

  if (!discount) {
    throw new AppError('Discount not found', 404, 'NOT_FOUND');
  }

  return discount;
};

const assertValidRules = (data: { type: DiscountType; value: number; startDate: Date; endDate: Date }) => {
  if (data.endDate <= data.startDate) {
    throw new AppError('endDate must be after startDate', 400, 'INVALID_RANGE');
  }
  if (data.type === 'PERCENTAGE' && data.value > 100) {
    throw new AppError('PERCENTAGE value must be at most 100', 400, 'INVALID_VALUE');
  }
};

export const createDiscount = async (tenantId: string, data: DiscountInput) => {
  assertValidRules(data);
  await assertScopeBelongsToTenant(tenantId, data.productId, data.variantId);

  return prisma.discount.create({
    data: {
      tenantId,
      name: data.name,
      type: data.type,
      value: data.value,
      productId: data.productId ?? null,
      variantId: data.variantId ?? null,
      active: data.active ?? true,
      startDate: data.startDate,
      endDate: data.endDate,
    },
  });
};

export const updateDiscount = async (id: string, tenantId: string, data: Partial<DiscountInput>) => {
  const discount = await getDiscountById(id, tenantId);

  const productId = data.productId === undefined ? discount.productId : data.productId;
  const variantId = data.variantId === undefined ? discount.variantId : data.variantId;
  await assertScopeBelongsToTenant(tenantId, productId, variantId);

  assertValidRules({
    type: data.type ?? discount.type,
    value: data.value ?? discount.value,
    startDate: data.startDate ?? discount.startDate,
    endDate: data.endDate ?? discount.endDate,
  });

  return prisma.discount.update({
    where: { id },
    data: {
      ...(data.name === undefined ? {} : { name: data.name }),
      ...(data.type === undefined ? {} : { type: data.type }),
      ...(data.value === undefined ? {} : { value: data.value }),
      ...(data.productId === undefined ? {} : { productId: data.productId }),
      ...(data.variantId === undefined ? {} : { variantId: data.variantId }),
      ...(data.active === undefined ? {} : { active: data.active }),
      ...(data.startDate === undefined ? {} : { startDate: data.startDate }),
      ...(data.endDate === undefined ? {} : { endDate: data.endDate }),
    },
  });
};

export const deleteDiscount = async (id: string, tenantId: string) => {
  await getDiscountById(id, tenantId);
  await prisma.discount.delete({ where: { id } });
  return { id };
};

const discountAmountPerUnit = (type: DiscountType, value: number, unitPrice: number) => {
  if (type === 'PERCENTAGE') {
    return Math.round((unitPrice * value) / 100 * 100) / 100;
  }
  return Math.min(value, unitPrice);
};

export const applyDiscounts = async (
  tenantId: string,
  items: PricedItem[],
  at: Date = new Date()
): Promise<{ items: PricedItemResult[]; subtotal: number; discountTotal: number; total: number }> => {
  const discounts = await prisma.discount.findMany({
    where: {
      tenantId,
      active: true,
      startDate: { lte: at },
      endDate: { gt: at },
    },
    include: {
      variant: { select: { productId: true } },
    },
  });

  const variantIds = items.map((item) => item.variantId);
  const variants = await prisma.variant.findMany({
    where: { id: { in: variantIds }, tenantId },
    select: { id: true, productId: true },
  });
  const productByVariant = new Map(variants.map((variant) => [variant.id, variant.productId]));

  let subtotal = 0;
  let discountTotal = 0;

  const pricedItems: PricedItemResult[] = items.map((item) => {
    const variantId = item.variantId;
    const productId = productByVariant.get(variantId) ?? null;

    const candidates = discounts.filter((discount) => {
      if (discount.variantId) return discount.variantId === variantId;
      if (discount.productId) return discount.productId === productId;
      return true;
    });

    let best: { id: string; name: string; type: DiscountType; value: number; amount: number } | null = null;
    for (const discount of candidates) {
      const amount = discountAmountPerUnit(discount.type, discount.value, item.unitPrice);
      if (!best || amount > best.amount) {
        best = {
          id: discount.id,
          name: discount.name,
          type: discount.type,
          value: discount.value,
          amount,
        };
      }
    }

    const unitPriceAfterDiscount = Math.max(0, Math.round((item.unitPrice - (best?.amount ?? 0)) * 100) / 100);
    const lineTotal = Math.round(unitPriceAfterDiscount * item.quantity * 100) / 100;

    subtotal += Math.round(item.unitPrice * item.quantity * 100) / 100;
    discountTotal += Math.round((best?.amount ?? 0) * item.quantity * 100) / 100;

    return {
      ...item,
      discount: best
        ? { id: best.id, name: best.name, type: best.type, value: best.value }
        : null,
      unitPriceAfterDiscount,
      lineTotal,
    };
  });

  const total = Math.round((subtotal - discountTotal) * 100) / 100;

  return { items: pricedItems, subtotal, discountTotal, total };
};

export const getCartPricing = async (tenantId: string, cartId: string, at: Date = new Date()) => {
  const cart = await prisma.cart.findFirst({
    where: { id: cartId, tenantId },
    include: { items: true },
  });

  if (!cart) {
    throw new AppError('Cart not found', 404, 'NOT_FOUND');
  }

  return applyDiscounts(
    tenantId,
    cart.items.map((item) => ({
      variantId: item.variantId,
      quantity: item.quantity,
      unitPrice: item.unitPriceSnapshot,
    })),
    at
  );
};
