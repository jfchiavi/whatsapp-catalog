import { prisma } from '@/lib/prisma';

export async function getSales(tenantId: string, branchId?: string) {
  return prisma.sale.findMany({
    where: {
      tenantId,
      branchId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      branch: true,
      user: true,
      items: {
        include: {
          variant: {
            include: {
              product: true,
            },
          },
        },
      },
    },
  });
}

export const createSale = async (
  userId: string,
  branchId: string,
  tenantId: string,
  items: { variantId: string; quantity: number }[]
) => {
  return prisma.$transaction(async (tx) => {
    let total = 0;
    const itemData: { variantId: string; quantity: number; price: number }[] = [];

    const branch = await tx.branch.findUnique({
      where: { id: branchId },
      include: { tenant: true },
    });

    if (!branch) {
      throw new Error('Branch not found');
    }

    if (branch.tenantId !== tenantId) {
      throw new Error('Branch does not belong to user\'s tenant');
    }

    for (const item of items) {
      const variant = await tx.variant.findUnique({
        where: { id: item.variantId },
        include: { product: true },
      });

      if (!variant || !variant.product.active) {
        throw new Error('Invalid or inactive variant');
      }

      if (variant.tenantId !== tenantId) {
        throw new Error('Variant does not belong to user\'s tenant');
      }

      const stock = await tx.stock.findUnique({
        where: {
          tenantId_variantId_branchId: {
            variantId: item.variantId,
            branchId,
            tenantId,
          },
        },
      });

      if (!stock || stock.quantity < item.quantity) {
        throw new Error('Insufficient stock');
      }

      const itemTotal = variant.price * item.quantity;
      total += itemTotal;
      itemData.push({ variantId: item.variantId, quantity: item.quantity, price: variant.price });

      await tx.stock.update({
        where: {
          tenantId_variantId_branchId: {
            variantId: item.variantId,
            branchId,
            tenantId,
          },
        },
        data: { quantity: { decrement: item.quantity } },
      });

      await tx.stockMovement.create({
        data: {
          variantId: item.variantId,
          fromBranchId: branchId,
          toBranchId: branchId,
          quantity: item.quantity,
          type: 'SALE',
          userId,
          tenantId,
        },
      });
    }

    const sale = await tx.sale.create({
      data: {
        userId,
        branchId,
        total,
        tenantId,
        items: {
          create: itemData.map((item) => ({
            quantity: item.quantity,
            price: item.price,
            tenant: { connect: { id: tenantId } },
            variant: { connect: { id: item.variantId } },
          })),
        },
      },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    return sale;
  });
};