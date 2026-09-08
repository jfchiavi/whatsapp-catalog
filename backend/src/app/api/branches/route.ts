import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { createBranchSchema } from '@/validators/branch.schema';
import { handleError } from '@/lib/errors';
import {
  createBranch,
  getBranches,
} from '@/modules/branches/branch.service';

export async function GET(req: NextRequest) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const perm = permissionMiddleware(auth.role, 'dashboard');
  if (perm) return perm;

  const branches = await getBranches(auth.tenantId);
  return NextResponse.json({ success: true, data: branches });
}

export async function POST(req: NextRequest) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const perm2 = permissionMiddleware(auth.role, 'dashboard');
  if (perm2) return perm2;

  const body = await req.json();
  const parsed = createBranchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(parsed.error, { status: 400 });
  }

  try {
    const branch = await createBranch({ ...parsed.data, tenantId: auth.tenantId });
    return NextResponse.json({ success: true, data: branch }, { status: 201 });    
  } catch (error) {
    return handleError(error);
  }
}
