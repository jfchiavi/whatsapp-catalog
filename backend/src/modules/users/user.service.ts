import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { Role } from '@prisma/client';

export const createUser = async (data: {
  name: string;
  email: string;
  password: string;
  role: Role;
  branchId?: string;
}) => {
  return prisma.user.create({
    data: {
      ...data,
      password: await hashPassword(data.password),
    },
  });
};

export const getUsers = async (
  role: Role,
  branchId?: string | null
) => {
  if (role === 'SUPER_ADMIN') {
    return prisma.user.findMany({
      include: { branch: true },
    });
  }

  return prisma.user.findMany({
    where: { branchId },
    include: { branch: true },
  });
};
