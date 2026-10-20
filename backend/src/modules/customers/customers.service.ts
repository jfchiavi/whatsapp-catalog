import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errors';

export type CustomerInput = {
  name: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
};

export const getCustomers = async (
  tenantId: string,
  options: { search?: string; page?: number; pageSize?: number } = {}
) => {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 20));

  const where: Prisma.CustomerWhereInput = {
    tenantId,
    ...(options.search
      ? {
          OR: [
            { name: { contains: options.search, mode: 'insensitive' } },
            { phone: { contains: options.search } },
            { email: { contains: options.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.customer.findMany({
      where,
      include: { _count: { select: { orders: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.customer.count({ where }),
  ]);

  return { items, meta: { page, pageSize, total } };
};

export const getCustomerById = async (id: string, tenantId: string) => {
  const customer = await prisma.customer.findFirst({
    where: { id, tenantId },
    include: { _count: { select: { orders: true } } },
  });

  if (!customer) {
    throw new AppError('Customer not found', 404, 'NOT_FOUND');
  }

  return customer;
};

export const findOrCreateCustomer = async (tenantId: string, data: CustomerInput) => {
  const existing = await prisma.customer.findFirst({
    where: { tenantId, phone: data.phone },
  });

  if (existing) {
    return prisma.customer.update({
      where: { id: existing.id },
      data: {
        name: data.name || existing.name,
        ...(data.email === undefined ? {} : { email: data.email }),
        ...(data.notes === undefined ? {} : { notes: data.notes }),
      },
    });
  }

  return prisma.customer.create({
    data: {
      tenantId,
      name: data.name,
      phone: data.phone,
      email: data.email ?? null,
      notes: data.notes ?? null,
    },
  });
};

export const updateCustomer = async (id: string, tenantId: string, data: Partial<CustomerInput>) => {
  await getCustomerById(id, tenantId);

  return prisma.customer.update({
    where: { id },
    data: {
      ...(data.name === undefined ? {} : { name: data.name }),
      ...(data.phone === undefined ? {} : { phone: data.phone }),
      ...(data.email === undefined ? {} : { email: data.email }),
      ...(data.notes === undefined ? {} : { notes: data.notes }),
    },
  });
};

export const getCustomerOrders = async (id: string, tenantId: string) => {
  await getCustomerById(id, tenantId);

  return prisma.order.findMany({
    where: { customerId: id, tenantId },
    include: {
      items: {
        include: {
          variant: { select: { id: true, sku: true, product: { select: { id: true, name: true } } } },
        },
      },
      branch: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};
