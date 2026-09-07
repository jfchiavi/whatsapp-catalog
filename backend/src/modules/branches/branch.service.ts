import { prisma } from '@/lib/prisma';

export const createBranch = async (data: {
  name: string;
  type: string;
  tenantId: string;
}) => {
  return prisma.branch.create({
    data: {
      name: data.name,
      type: data.type,
      tenantId: data.tenantId,
    },
  });
};

export const getBranches = async (tenantId: string) => {
  return prisma.branch.findMany({
    where: { tenantId },
  });
};
