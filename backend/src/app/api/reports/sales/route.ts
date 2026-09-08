import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { getSalesReport } from '@/modules/reports/report.service';
import { handleError } from '@/lib/errors';

export async function GET(req: NextRequest) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const perm = permissionMiddleware(auth.role, 'reports');
  if (perm) return perm;

  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const fromDate = new Date(`${from}`);
  const toDate = new Date(`${to}`);

  if (!from || !to) {
    return NextResponse.json(
      { message: 'Missing date range' },
      { status: 400 }
    );
  }
  try {
    const report = await getSalesReport(fromDate, toDate, auth.tenantId);
    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    console.error('REPORT SALES ERROR', error);
    return handleError(error);
  }

}
