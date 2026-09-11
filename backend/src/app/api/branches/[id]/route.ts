import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { updateBranchSchema } from '@/validators/branch.schema';
import { handleError } from '@/lib/errors';
import {
  getBranchById,
  updateBranch,
  deactivateBranch,
} from '@/modules/branches/branch.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const perm = permissionMiddleware(auth.role, 'dashboard');
  if (perm) return perm;

  try {
    const { id } = await params;
    const branch = await getBranchById(id, auth.tenantId);

    if (!branch) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Branch not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: branch });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const perm = permissionMiddleware(auth.role, 'dashboard');
  if (perm) return perm;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateBranchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const branch = await updateBranch(id, auth.tenantId, parsed.data);
    return NextResponse.json({ success: true, data: branch });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const perm = permissionMiddleware(auth.role, 'dashboard');
  if (perm) return perm;

  try {
    const { id } = await params;
    await deactivateBranch(id, auth.tenantId);
    return NextResponse.json({ success: true, data: { message: 'Branch deactivated' } });
  } catch (error) {
    return handleError(error);
  }
}
