import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { createUserSchema } from '@/validators/user.schema';
import { createUser, getUsers } from '@/modules/users/user.service';

export async function GET(req: NextRequest) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  permissionMiddleware(auth.role, 'dashboard');

  const users = await getUsers(auth.role, auth.branchId);
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  permissionMiddleware(auth.role, 'dashboard');

  if (auth.role !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { message: 'Forbidden' },
      { status: 403 }
    );
  }

  const body = await req.json();
  const parsed = createUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(parsed.error, { status: 400 });
  }

  const user = await createUser(parsed.data);
  return NextResponse.json(user, { status: 201 });
}
