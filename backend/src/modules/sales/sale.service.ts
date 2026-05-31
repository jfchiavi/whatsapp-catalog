import { prisma } from '@/lib/prisma';

export async function getSales(branchId?: string) {
  return prisma.sale.findMany({
    where: {
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
  items: { variantId: string; quantity: number }[]
) => {
  // Get user info to validate tenantId
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      tenant: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const tenantId = user.tenantId;

  return prisma.$transaction(async (tx) => {
    let total = 0;

    // Validate that branch exists and belongs to same tenant
    const branch = await tx.branch.findUnique({
      where: { id: branchId },
      include: {
        tenant: true,
      },
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
        include: {
          product: true,
        },
      });

      if (!variant || !variant.product.active) {
        throw new Error('Invalid or inactive variant');
      }

      // Validate that variant belongs to same tenant
      if (variant.tenantId !== tenantId) {
        throw new Error('Variant does not belong to user\'s tenant');
      }

      const stock = await tx.stock.findUnique({
        where: {
          variantId_branchId_tenantId: {
            variantId: item.variantId,
            branchId,
            tenantId,
          },
        },
      });

      if (!stock || stock.quantity < item.quantity) {
        throw new Error('Insufficient stock');
      }

      total += variant.price * item.quantity;

      await tx.stock.update({
        where: {
          variantId_branchId_tenantId: {
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
          toBranchId: branchId, // For sales, from and to are the same branch
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
          create: items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
            price: 0, // price snapshot - will be filled from variant.price at time of sale
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