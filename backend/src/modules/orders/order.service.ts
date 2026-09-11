import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errors';

export const getOrders = async (tenantId: string, branchId?: string) => {
  const where: Record<string, unknown> = { tenantId };
  if (branchId) {
    where.branchId = branchId;
  }

  return prisma.order.findMany({
    where,
    include: {
      items: {
        include: {
          variant: { include: { product: true } },
        },
      },
      branch: true,
      customer: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getOrderById = async (tenantId: string, orderId: string) => {
  return prisma.order.findFirst({
    where: { id: orderId, tenantId },
    include: {
      items: {
        include: {
          variant: { include: { product: true } },
        },
      },
      branch: true,
      customer: true,
    },
  });
};

export const updateOrderStatus = async (
  tenantId: string,
  orderId: string,
  status: string
) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, tenantId },
  });

  if (!order) {
    throw new AppError('Order not found', 404, 'NOT_FOUND');
  }

  const validTransitions: Record<string, string[]> = {
    pending: ['contacted', 'cancelled'],
    contacted: ['confirmed', 'cancelled'],
    confirmed: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  };

  if (!validTransitions[order.status]?.includes(status)) {
    throw new AppError(
      `Cannot transition from ${order.status} to ${status}`,
      400,
      'INVALID_STATUS_TRANSITION'
    );
  }

  return prisma.order.update({
    where: { id: orderId },
    data: { status },
    include: {
      items: {
        include: {
          variant: { include: { product: true } },
        },
      },
      branch: true,
    },
  });
};

export const confirmOrder = async (
  tenantId: string,
  orderId: string,
  userId: string
) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, tenantId },
    include: {
      items: true,
    },
  });

  if (!order) {
    throw new AppError('Order not found', 404, 'NOT_FOUND');
  }

  if (order.status !== 'confirmed') {
    throw new AppError('Order must be confirmed before completing', 400, 'ORDER_NOT_CONFIRMED');
  }

  return prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      const stock = await tx.stock.findUnique({
        where: {
          tenantId_variantId_branchId: {
            tenantId,
            variantId: item.variantId,
            branchId: order.branchId,
          },
        },
      });

      if (!stock || stock.quantity < item.quantity) {
        throw new AppError(
          `Insufficient stock for variant ${item.variantId}`,
          400,
          'INSUFFICIENT_STOCK'
        );
      }

      await tx.stock.update({
        where: {
          tenantId_variantId_branchId: {
            tenantId,
            variantId: item.variantId,
            branchId: order.branchId,
          },
        },
        data: { quantity: { decrement: item.quantity } },
      });

      await tx.stockMovement.create({
        data: {
          variantId: item.variantId,
          fromBranchId: order.branchId,
          toBranchId: order.branchId,
          quantity: item.quantity,
          type: 'SALE',
          status: 'COMPLETED',
          userId,
          tenantId,
        },
      });
    }

    const sale = await tx.sale.create({
      data: {
        userId,
        branchId: order.branchId,
        total: order.totalSnapshot,
        tenantId,
        items: {
          create: order.items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.unitPriceSnapshot,
            tenantId,
          })),
        },
      },
      include: {
        items: {
          include: {
            variant: { include: { product: true } },
          },
        },
      },
    });

    await tx.order.update({
      where: { id: orderId },
      data: { status: 'completed' },
    });

    return sale;
  });
};
