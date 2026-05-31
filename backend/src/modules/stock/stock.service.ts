import { prisma } from '@/lib/prisma';

export const getStockByVariant = async (variantId: string) => {
  return prisma.stock.findMany({
    where: { variantId },
    include: { branch: true },
  });
};

export const getStockByBranch = async (branchId: string) => {
  return prisma.stock.findMany({
    where: { branchId },
    include: {
      variant: {
        include: {
          product: true,
        },
      },
    },
  });
};

export const adjustStock = async (
  variantId: string,
  branchId: string,
  quantity: number,
  userId: string | null = null
) => {
  // Get user info for tenantId if userId is provided
  let tenantId = '';
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true },
    });
    if (!user) {
      throw new Error('User not found');
    }
    tenantId = user.tenantId;
  } else {
    // If no userId, we'll need to get tenantId from the variant/branch
    // For now, we'll get it from the stock record if it exists, or from variant/branch
    const existingStock = await prisma.stock.findFirst({
      where: { variantId, branchId },
      select: { tenantId: true },
    });
    
    if (existingStock) {
      tenantId = existingStock.tenantId;
    } else {
      // Get tenantId from variant or branch
      const variant = await prisma.variant.findUnique({
        where: { id: variantId },
        select: { tenantId: true },
      });
      const branch = await prisma.branch.findUnique({
        where: { id: branchId },
        select: { tenantId: true },
      });
      
      if (!variant || !branch) {
        throw new Error('Variant or branch not found');
      }
      
      if (variant.tenantId !== branch.tenantId) {
        throw new Error('Variant and branch belong to different tenants');
      }
      
      tenantId = variant.tenantId;
    }
  }

  return prisma.$transaction(async (tx) => {
    const stock = await tx.stock.upsert({
      where: {
        variantId_branchId_tenantId: { variantId, branchId, tenantId },
      },
      update: {
        quantity: { increment: quantity },
      },
      create: {
        variantId,
        branchId,
        quantity,
        tenantId,
      },
    });

    if (stock.quantity < 0) {
      throw new Error('Stock cannot be negative');
    }

    await tx.stockMovement.create({
      data: {
        variantId,
        fromBranchId: branchId,
        toBranchId: branchId,
        quantity,
        type: 'ADJUST',
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
  userId: string | null = null
) => {
  // Get user info for tenantId if userId is provided
  let tenantId = '';
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true },
    });
    if (!user) {
      throw new Error('User not found');
    }
    tenantId = user.tenantId;
  } else {
    // If no userId, we'll need to get tenantId from the variant/branches
    const variant = await prisma.variant.findUnique({
      where: { id: variantId },
      select: { tenantId: true },
    });
    const fromBranch = await prisma.branch.findUnique({
      where: { id: fromBranchId },
      select: { tenantId: true },
    });
    const toBranch = await prisma.branch.findUnique({
      where: { id: toBranchId },
      select: { tenantId: true },
    });
    
    if (!variant || !fromBranch || !toBranch) {
      throw new Error('Variant or branch not found');
    }
    
    // Validate all belong to same tenant
    if (variant.tenantId !== fromBranch.tenantId || 
        variant.tenantId !== toBranch.tenantId ||
        fromBranch.tenantId !== toBranch.tenantId) {
      throw new Error('Variant and branches belong to different tenants');
    }
    
    tenantId = variant.tenantId;
  }

  return prisma.$transaction(async (tx) => {
    const fromStock = await tx.stock.findUnique({
      where: {
        variantId_branchId_tenantId: { variantId, branchId: fromBranchId, tenantId },
      },
    });

    if (!fromStock || fromStock.quantity < quantity) {
      throw new Error('Insufficient stock');
    }

    await tx.stock.update({
      where: {
        variantId_branchId_tenantId: { variantId, branchId: fromBranchId, tenantId },
      },
      data: { quantity: { decrement: quantity } },
    });

    await tx.stock.upsert({
      where: {
        variantId_branchId_tenantId: { variantId, branchId: toBranchId, tenantId },
      },
      update: { quantity: { increment: quantity } },
      create: {
        variantId,
        branchId: toBranchId,
        quantity,
        tenantId,
      },
    });

    await tx.stockMovement.create({
      data: {
        variantId,
        fromBranchId,
        toBranchId,
        quantity,
        type: 'TRANSFER',
        userId,
        tenantId,
      },
    });
  });
};