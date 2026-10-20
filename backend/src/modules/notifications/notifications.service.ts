import { NotificationType, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errors';

const LOW_STOCK_THRESHOLD = () => {
  const parsed = Number(process.env.LOW_STOCK_THRESHOLD ?? 5);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 5;
};

export const createNotification = async (input: {
  tenantId: string;
  userId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
}) => {
  return prisma.notification.create({
    data: {
      tenantId: input.tenantId,
      userId: input.userId ?? null,
      type: input.type,
      title: input.title,
      message: input.message,
    },
  });
};

export const getNotifications = async (
  tenantId: string,
  userId: string,
  options: { unreadOnly?: boolean; page?: number; pageSize?: number } = {}
) => {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 20));

  const where: Prisma.NotificationWhereInput = {
    tenantId,
    OR: [{ userId: null }, { userId }],
    ...(options.unreadOnly ? { read: false } : {}),
  };

  const [items, total, unread] = await prisma.$transaction([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { ...where, read: false } }),
  ]);

  return { items, meta: { page, pageSize, total, unread } };
};

export const markAsRead = async (id: string, tenantId: string, userId: string) => {
  const notification = await prisma.notification.findFirst({
    where: { id, tenantId, OR: [{ userId: null }, { userId }] },
  });

  if (!notification) {
    throw new AppError('Notification not found', 404, 'NOT_FOUND');
  }

  return prisma.notification.update({
    where: { id },
    data: { read: true },
  });
};

export const markAllAsRead = async (tenantId: string, userId: string) => {
  const result = await prisma.notification.updateMany({
    where: { tenantId, read: false, OR: [{ userId: null }, { userId }] },
    data: { read: true },
  });

  return { updated: result.count };
};

export const checkLowStock = async (tenantId: string, threshold = LOW_STOCK_THRESHOLD()) => {
  const stocks = await prisma.stock.findMany({
    where: { tenantId, quantity: { lte: threshold } },
    include: {
      variant: { select: { id: true, sku: true, product: { select: { name: true } } } },
      branch: { select: { id: true, name: true } },
    },
    orderBy: { quantity: 'asc' },
    take: 50,
  });

  const existing = await prisma.notification.findMany({
    where: { tenantId, type: 'LOW_STOCK', read: false },
    select: { title: true },
  });
  const existingTitles = new Set(existing.map((item) => item.title));

  let created = 0;
  for (const stock of stocks) {
    const title = `Stock bajo: ${stock.variant.sku} en ${stock.branch.name}`;
    if (existingTitles.has(title)) continue;

    await createNotification({
      tenantId,
      type: 'LOW_STOCK',
      title,
      message: `Quedan ${stock.quantity} unidades de ${stock.variant.product.name} (${stock.variant.sku}) en ${stock.branch.name}.`,
    });
    existingTitles.add(title);
    created += 1;
  }

  return { created, checked: stocks.length };
};
