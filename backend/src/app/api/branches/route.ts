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

  permissionMiddleware(auth.role, 'dashboard');

  const branches = await getBranches();
  return NextResponse.json(branches);
}

export async function POST(req: NextRequest) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  if (auth.role !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { message: 'Forbidden' },
      { status: 403 }
    );
  }

  const body = await req.json();
  const parsed = createBranchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(parsed.error, { status: 400 });
  }

  try {
    const branch = await createBranch(parsed.data);
    return NextResponse.json(branch, { status: 201 });    
  } catch (error) {
    return handleError(error);
  }
}
