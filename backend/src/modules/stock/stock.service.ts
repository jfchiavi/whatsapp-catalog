import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errors';

export const getStockByVariant = async (variantId: string, tenantId: string) => {
  return prisma.stock.findMany({
    where: { variantId, tenantId },
    include: { branch: true },
  });
};

export const getStockByProduct = async (productId: string, tenantId: string) => {
  return prisma.stock.findMany({
    where: {
      variant: { productId, tenantId },
    },
    include: {
      branch: true,
      variant: { include: { product: true } },
    },
  });
};

export const getStockByBranch = async (branchId: string, tenantId: string) => {
  return prisma.stock.findMany({
    where: { branchId, tenantId },
    include: {
      variant: {
        include: { product: true },
      },
    },
    orderBy: {
      variant: { product: { name: 'asc' } },
    },
  });
};

export const adjustStock = async (
  variantId: string,
  branchId: string,
  quantity: number,
  tenantId: string,
  userId?: string
) => {
  const variant = await prisma.variant.findFirst({
    where: { id: variantId, tenantId },
  });
  if (!variant) {
    throw new AppError('Variant not found', 404, 'NOT_FOUND');
  }

  const branch = await prisma.branch.findFirst({
    where: { id: branchId, tenantId, active: true },
  });
  if (!branch) {
    throw new AppError('Branch not found', 404, 'NOT_FOUND');
  }

  return prisma.$transaction(async (tx) => {
    const stock = await tx.stock.upsert({
      where: {
        tenantId_variantId_branchId: { tenantId, variantId, branchId },
      },
      update: { quantity: { increment: quantity } },
      create: { variantId, branchId, quantity, tenantId },
    });

    if (stock.quantity < 0) {
      throw new AppError('Insufficient stock', 400, 'INSUFFICIENT_STOCK');
    }

    await tx.stockMovement.create({
      data: {
        variantId,
        fromBranchId: branchId,
        toBranchId: branchId,
        quantity,
        type: 'ADJUST',
        status: 'COMPLETED',
        userId,
        tenantId,
      },
    });

    return stock;
  });
};

export const transferStock = async (
  variantId: string,
  fromBranchId: string,
  toBranchId: string,
  quantity: number,
  tenantId: string,
  userId?: string
) => {
  if (fromBranchId === toBranchId) {
    throw new AppError('Cannot transfer to the same branch', 400, 'SAME_BRANCH');
  }

  const variant = await prisma.variant.findFirst({
    where: { id: variantId, tenantId },
  });
  if (!variant) {
    throw new AppError('Variant not found', 404, 'NOT_FOUND');
  }

  const fromBranch = await prisma.branch.findFirst({
    where: { id: fromBranchId, tenantId, active: true },
  });
  if (!fromBranch) {
    throw new AppError('Source branch not found', 404, 'NOT_FOUND');
  }

  const toBranch = await prisma.branch.findFirst({
    where: { id: toBranchId, tenantId, active: true },
  });
  if (!toBranch) {
    throw new AppError('Destination branch not found', 404, 'NOT_FOUND');
  }

  return prisma.$transaction(async (tx) => {
    const fromStock = await tx.stock.findUnique({
      where: {
        tenantId_variantId_branchId: { tenantId, variantId, branchId: fromBranchId },
      },
    });

    if (!fromStock || fromStock.quantity < quantity) {
      throw new AppError('Insufficient stock', 400, 'INSUFFICIENT_STOCK');
    }

    await tx.stock.update({
      where: {
        tenantId_variantId_branchId: { tenantId, variantId, branchId: fromBranchId },
      },
      data: { quantity: { decrement: quantity } },
    });

    const movement = await tx.stockMovement.create({
      data: {
        variantId,
        fromBranchId,
        toBranchId,
        quantity,
        type: 'TRANSFER',
        status: 'PENDING',
        userId,
        tenantId,
      },
    });

    return movement;
  });
};

export const receiveTransfer = async (
  movementId: string,
  receivedQuantity: number,
  tenantId: string,
  userId?: string
) => {
  const movement = await prisma.stockMovement.findFirst({
    where: {
      id: movementId,
      tenantId,
      type: 'TRANSFER',
      status: 'PENDING',
    },
  });

  if (!movement) {
    throw new AppError('Transfer not found or already processed', 404, 'NOT_FOUND');
  }

  if (receivedQuantity < 0) {
    throw new AppError('Received quantity cannot be negative', 400, 'INVALID_QUANTITY');
  }

  if (receivedQuantity > movement.quantity) {
    throw new AppError('Received quantity exceeds transferred quantity', 400, 'QUANTITY_EXCEEDED');
  }

  const toBranchId = movement.toBranchId!;

  return prisma.$transaction(async (tx) => {
    await tx.stock.upsert({
      where: {
        tenantId_variantId_branchId: {
          tenantId,
          variantId: movement.variantId,
          branchId: toBranchId,
        },
      },
      update: { quantity: { increment: receivedQuantity } },
      create: {
        variantId: movement.variantId,
        branchId: toBranchId,
        quantity: receivedQuantity,
        tenantId,
      },
    });

    const updated = await tx.stockMovement.update({
      where: { id: movementId },
      data: {
        status: 'COMPLETED',
        receivedQuantity,
      },
    });

    return updated;
  });
};

export const cancelTransfer = async (
  movementId: string,
  tenantId: string
) => {
  const movement = await prisma.stockMovement.findFirst({
    where: {
      id: movementId,
      tenantId,
      type: 'TRANSFER',
      status: 'PENDING',
    },
  });

  if (!movement) {
    throw new AppError('Transfer not found or already processed', 404, 'NOT_FOUND');
  }

  const fromBranchId = movement.fromBranchId!;

  return prisma.$transaction(async (tx) => {
    await tx.stock.update({
      where: {
        tenantId_variantId_branchId: {
          tenantId,
          variantId: movement.variantId,
          branchId: fromBranchId,
        },
      },
      data: { quantity: { increment: movement.quantity } },
    });

    const updated = await tx.stockMovement.update({
      where: { id: movementId },
      data: { status: 'CANCELLED' },
    });

    return updated;
  });
};

export const getPendingTransfers = async (tenantId: string, branchId?: string) => {
  const where: Record<string, unknown> = {
    tenantId,
    type: 'TRANSFER',
    status: 'PENDING',
  };

  if (branchId) {
    where.OR = [{ fromBranchId: branchId }, { toBranchId: branchId }];
  }

  return prisma.stockMovement.findMany({
    where,
    include: {
      variant: { include: { product: true } },
      fromBranch: true,
      toBranch: true,
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getStockHistory = async (
  variantId: string,
  tenantId: string,
  branchId?: string
) => {
  const where: Record<string, unknown> = {
    variantId,
    tenantId,
  };

  if (branchId) {
    where.OR = [{ fromBranchId: branchId }, { toBranchId: branchId }];
  }

  return prisma.stockMovement.findMany({
    where,
    include: {
      fromBranch: { select: { id: true, name: true } },
      toBranch: { select: { id: true, name: true } },
      user: { select: { id: true, name: true } },
      variant: {
        select: {
          id: true,
          sku: true,
          product: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};
