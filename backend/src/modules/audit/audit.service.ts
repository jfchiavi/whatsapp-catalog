import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'CONFIRM_FAILED' | 'BILLING_FAILED';

const SENSITIVE_KEYS = new Set(['password', 'token', 'refreshToken', 'accessToken']);

export const redactSensitive = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitive(item));
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => [
      key,
      SENSITIVE_KEYS.has(key) ? '[REDACTED]' : redactSensitive(entryValue),
    ]);
    return Object.fromEntries(entries);
  }

  return value;
};

export const logAction = async (input: {
  tenantId: string;
  userId?: string | null;
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  changes?: unknown;
}) => {
  return prisma.auditLog.create({
    data: {
      tenantId: input.tenantId,
      userId: input.userId ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      changes: (input.changes ?? Prisma.JsonNull) as Prisma.InputJsonValue,
    },
  });
};

export const getAuditLogs = async (
  tenantId: string,
  filters: {
    entity?: string;
    action?: AuditAction;
    userId?: string;
    entityId?: string;
    from?: Date;
    to?: Date;
    page?: number;
    pageSize?: number;
  } = {}
) => {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));

  const where: Prisma.AuditLogWhereInput = { tenantId };

  if (filters.entity) where.entity = filters.entity;
  if (filters.action) where.action = filters.action;
  if (filters.userId) where.userId = filters.userId;
  if (filters.entityId) where.entityId = filters.entityId;
  if (filters.from || filters.to) {
    where.createdAt = {
      ...(filters.from ? { gte: filters.from } : {}),
      ...(filters.to ? { lte: filters.to } : {}),
    };
  }

  const [items, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { items, meta: { page, pageSize, total } };
};
