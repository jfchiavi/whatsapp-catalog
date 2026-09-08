import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { getProductsReport } from '@/modules/reports/report.service';

export async function GET(req: NextRequest) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const perm = permissionMiddleware(auth.role, 'reports');
  if (perm) return perm;

  const report = await getProductsReport(auth.tenantId);
  return NextResponse.json({ success: true, data: report });
}
