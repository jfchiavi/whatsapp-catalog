import { NextResponse } from 'next/server';
import { hasPermission } from '@/lib/permissions';
import { Role } from '@prisma/client';

export const permissionMiddleware = (
  role: Role,
  permission: string
) => {
  if (!hasPermission(role, permission)) {
    return NextResponse.json(
      { message: 'Forbidden' },
      { status: 403 }
    );
  }
};
