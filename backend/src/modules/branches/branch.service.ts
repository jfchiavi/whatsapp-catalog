import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errors';

export const createBranch = async (data: {
  name: string;
  type: string;
  tenantId: string;
  address?: string;
  hours?: string;
}) => {
  return prisma.branch.create({
    data: {
      name: data.name,
      type: data.type,
      tenantId: data.tenantId,
      address: data.address,
      hours: data.hours,
    },
  });
};

export const getBranches = async (tenantId: string) => {
  return prisma.branch.findMany({
    where: { tenantId, active: true },
    orderBy: { name: 'asc' },
  });
};

export const getBranchById = async (id: string, tenantId: string) => {
  return prisma.branch.findFirst({
    where: { id, tenantId, active: true },
  });
};

export const updateBranch = async (
  id: string,
  tenantId: string,
  data: { name?: string; type?: string; address?: string; hours?: string }
) => {
  const branch = await prisma.branch.findFirst({
    where: { id, tenantId, active: true },
  });

  if (!branch) {
    throw new AppError('Branch not found', 404, 'NOT_FOUND');
  }

  return prisma.branch.update({
    where: { id },
    data,
  });
};

export const deactivateBranch = async (id: string, tenantId: string) => {
  const branch = await prisma.branch.findFirst({
    where: { id, tenantId, active: true },
  });

  if (!branch) {
    throw new AppError('Branch not found', 404, 'NOT_FOUND');
  }

  const hasStock = await prisma.stock.findFirst({
    where: { branchId: id, tenantId, quantity: { gt: 0 } },
  });

  if (hasStock) {
    throw new AppError(
      'Cannot deactivate branch with active stock',
      400,
      'BRANCH_HAS_STOCK'
    );
  }

  const hasPendingTransfers = await prisma.stockMovement.findFirst({
    where: {
      OR: [{ fromBranchId: id }, { toBranchId: id }],
      tenantId,
      type: 'TRANSFER',
      status: 'PENDING',
    },
  });

  if (hasPendingTransfers) {
    throw new AppError(
      'Cannot deactivate branch with pending transfers',
      400,
      'BRANCH_HAS_PENDING_TRANSFERS'
    );
  }

  return prisma.branch.update({
    where: { id },
    data: { active: false },
  });
};
