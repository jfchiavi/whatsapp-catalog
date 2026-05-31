import { prisma } from '@/lib/prisma';

export const createBranch = async (data: {
  name: string;
  type: string;
}) => {
  return prisma.branch.create({ data });
};

export const getBranches = async () => {
  return prisma.branch.findMany();
};
