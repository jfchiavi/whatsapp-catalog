import { StorefrontMetricEvent } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errors';

const MAX_TARGET_LENGTH = 120;

export const recordStorefrontMetric = async (
  tenantId: string,
  event: StorefrontMetricEvent,
  target = '',
  occurredAt = new Date()
) => {
  const normalizedTarget = target.trim().slice(0, MAX_TARGET_LENGTH);
  const day = new Date(Date.UTC(
    occurredAt.getUTCFullYear(),
    occurredAt.getUTCMonth(),
    occurredAt.getUTCDate()
  ));

  const tenant = await prisma.tenant.findFirst({
    where: { id: tenantId, active: true },
    select: { id: true },
  });
  if (!tenant) throw new AppError('Tenant not found', 404, 'TENANT_NOT_FOUND');

  return prisma.storefrontMetricDaily.upsert({
    where: { tenantId_day_event_target: { tenantId, day, event, target: normalizedTarget } },
    create: { tenantId, day, event, target: normalizedTarget, count: 1 },
    update: { count: { increment: 1 } },
    select: { count: true },
  });
};

export const getStorefrontMetrics = async (tenantId: string, from: Date, to: Date) => {
  const rows = await prisma.storefrontMetricDaily.groupBy({
    by: ['event', 'target'],
    where: { tenantId, day: { gte: from, lte: to } },
    _sum: { count: true },
    orderBy: [{ event: 'asc' }, { target: 'asc' }],
  });

  const totals: Record<StorefrontMetricEvent, number> = {
    HOME_VIEW: 0,
    CATALOG_CLICK: 0,
    CATEGORY_CLICK: 0,
    FEATURED_PRODUCT_CLICK: 0,
    WHATSAPP_CLICK: 0,
  };
  const targets: Record<string, number> = {};

  for (const row of rows) {
    const count = row._sum.count ?? 0;
    totals[row.event] += count;
    if (row.target) targets[`${row.event}:${row.target}`] = count;
  }

  return { from, to, totals, targets };
};