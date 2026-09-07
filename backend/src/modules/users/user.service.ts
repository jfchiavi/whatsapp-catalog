import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { Role } from '@prisma/client';

export const createUser = async (data: {
  name: string;
  email: string;
  password: string;
  role: Role;
  branchId?: string;
  tenantId: string;
}) => {
  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: await hashPassword(data.password),
      role: data.role,
      branchId: data.branchId,
      tenantId: data.tenantId,
    },
  });
};

export const getUsers = async (
  tenantId: string,
  role?: Role,
  branchId?: string | null
) => {
  const where: { tenantId: string; role?: Role; branchId?: string | null } = { tenantId };
  if (role) where.role = role;
  if (branchId) where.branchId = branchId;

  if (role === 'SUPER_ADMIN') {
    return prisma.user.findMany({
      where: { tenantId },
      include: { branch: true },
    });
  }

  return prisma.user.findMany({
    where,
    include: { branch: true },
  });
};
