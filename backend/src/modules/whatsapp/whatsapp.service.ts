import { prisma } from '@/lib/prisma';
import { createSale } from '@/modules/sales/sale.service';

export const createWhatsappOrder = async (data: {
  customerName: string;
  customerPhone: string;
  message: string;
  total: number;
}) => {
  return prisma.whatsappOrder.create({
    data: {
      ...data,
      status: 'pending',
    },
  });
};

export const getWhatsappOrders = async () => {
  return prisma.whatsappOrder.findMany({
    orderBy: { createdAt: 'desc' },
  });
};

export const updateWhatsappStatus = async (
  id: string,
  status: string
) => {
  return prisma.whatsappOrder.update({
    where: { id },
    data: { status },
  });
};

export const convertWhatsappToSale = async (
  orderId: string,
  userId: string,
  branchId: string,
  items: { productId: string; quantity: number }[]
) => {
  return prisma.$transaction(async (tx) => {
    const order = await tx.whatsappOrder.findUnique({
      where: { id: orderId },
    });

    if (!order || order.status === 'completed') {
      throw new Error('Invalid order');
    }

    const sale = await createSale(userId, branchId, items);

    await tx.whatsappOrder.update({
      where: { id: orderId },
      data: { status: 'completed' },
    });

    return sale;
  });
};
