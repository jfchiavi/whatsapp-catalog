import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireTenantId } from '@/lib/auth';
import { AuditAction, logAction, redactSensitive } from '@/modules/audit/audit.service';

const ACTION_BY_METHOD: Record<string, AuditAction> = {
  POST: 'CREATE',
  PUT: 'UPDATE',
  PATCH: 'UPDATE',
  DELETE: 'DELETE',
};

type RouteContext = { params: Promise<Record<string, string>> };
type RouteHandler<Context extends RouteContext = RouteContext> = (
  req: NextRequest,
  context: Context
) => Promise<NextResponse>;

const readJson = async (source: Request | NextResponse): Promise<Record<string, unknown> | null> => {
  try {
    return (await source.clone().json()) as Record<string, unknown>;
  } catch {
    return null;
  }
};

/**
 * Registra automáticamente las operaciones CREATE/UPDATE/DELETE de una ruta
 * en `AuditLog`. No interrumpe la request si la auditoría falla.
 */
export const auditMiddleware =
  (entity: string, options: { action?: AuditAction; idParam?: string } = {}) =>
  <Context extends RouteContext = RouteContext>(
    handler: RouteHandler<Context>
  ): RouteHandler<Context> =>
  async (req: NextRequest, context: Context) => {
    const res = await handler(req, context);

    try {
      const action = options.action ?? ACTION_BY_METHOD[req.method];
      if (!action) return res;

      const auth = authMiddleware(req);
      if (auth instanceof NextResponse) return res;

      const params = context?.params ? await context.params : {};
      const requestBody = await readJson(req);
      const responseBody = await readJson(res);
      const data = (responseBody?.data ?? null) as Record<string, unknown> | null;

      const entityId =
        params?.[options.idParam ?? 'id'] ?? (typeof data?.id === 'string' ? data.id : null);

        await logAction({
          tenantId: requireTenantId(auth.tenantId, `audit ${entity}`),
          userId: auth.userId,
          action,
          entity,
          entityId,
          changes: redactSensitive(requestBody),
        });
    } catch {
      // La auditoría nunca debe romper la operación principal.
    }

    return res;
  };
