import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { getBranchComparison } from '@/modules/reports/report.service';

export async function GET(req: NextRequest) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const perm = permissionMiddleware(auth.role, 'reports');
  if (perm) return perm;

  const report = await getBranchComparison(auth.tenantId);
  return NextResponse.json({ success: true, data: report });
}
