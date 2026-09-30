import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { Role } from '@prisma/client';

export const createUser = async (data: {
  name: string;
  email: string;
  password: string;
  role: Role;
  branchId?: string;
  tenantId: string;
}) => {
  const existing = await prisma.user.findFirst({
    where: { email: data.email, tenantId: data.tenantId },
  });

  if (existing) {
    throw new AppError('User with this email already exists in this tenant', 409, 'USER_EXISTS');
  }

  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: await hashPassword(data.password),
      role: data.role,
      branchId: data.branchId,
      tenantId: data.tenantId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      branchId: true,
      tenantId: true,
      active: true,
      createdAt: true,
    },
  });
};

export const getUsers = async (
  tenantId: string | null,
  role?: Role,
  branchId?: string | null
) => {
  const where: { tenantId?: string; role?: Role; branchId?: string | null } = {};
  if (tenantId) {
    where.tenantId = tenantId;
  }
  if (role) where.role = role;
  if (branchId) where.branchId = branchId;

  return prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      branchId: true,
      tenantId: true,
      active: true,
      createdAt: true,
      branch: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getUserById = async (id: string, tenantId: string) => {
  const user = await prisma.user.findFirst({
    where: { id, tenantId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      branchId: true,
      tenantId: true,
      active: true,
      createdAt: true,
      branch: { select: { id: true, name: true } },
    },
  });

  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  return user;
};

export const updateUser = async (
  id: string,
  tenantId: string,
  data: {
    name?: string;
    email?: string;
    role?: Role;
    branchId?: string | null;
    active?: boolean;
  }
) => {
  const user = await prisma.user.findFirst({ where: { id, tenantId } });

  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  if (data.email && data.email !== user.email) {
    const emailExists = await prisma.user.findFirst({
      where: { email: data.email, tenantId, id: { not: id } },
    });
    if (emailExists) {
      throw new AppError('Email already in use', 409, 'EMAIL_EXISTS');
    }
  }

  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      branchId: true,
      tenantId: true,
      active: true,
      createdAt: true,
    },
  });
};

export const deleteUser = async (id: string, tenantId: string) => {
  const user = await prisma.user.findFirst({ where: { id, tenantId } });

  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  return prisma.user.update({
    where: { id },
    data: { active: false },
    select: { id: true, name: true, email: true, role: true, active: true },
  });
};
