import { prisma } from '@/lib/prisma';
import { createSale } from '@/modules/sales/sale.service';

export const createWhatsappOrder = async (data: {
  customerName: string;
  customerPhone: string;
  message: string;
  total: number;
  tenantId: string;
}) => {
  return prisma.whatsappOrder.create({
    data: {
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      message: data.message,
      total: data.total,
      status: 'pending',
      tenantId: data.tenantId,
    },
  });
};

export const getWhatsappOrders = async (tenantId: string) => {
  return prisma.whatsappOrder.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });
};

export const updateWhatsappStatus = async (
  id: string,
  tenantId: string,
  status: string
) => {
  return prisma.whatsappOrder.update({
    where: { id, tenantId },
    data: { status },
  });
};

export const convertWhatsappToSale = async (
  orderId: string,
  userId: string,
  branchId: string,
  tenantId: string,
  items: { productId: string; quantity: number }[]
) => {
  return prisma.$transaction(async (tx) => {
    const order = await tx.whatsappOrder.findFirst({
      where: { id: orderId, tenantId },
    });

    if (!order || order.status === 'completed') {
      throw new Error('Invalid order');
    }

    const sale = await createSale(userId, branchId, tenantId, items);

    await tx.whatsappOrder.update({
      where: { id: orderId, tenantId },
      data: { status: 'completed' },
    });

    return sale;
  });
};
