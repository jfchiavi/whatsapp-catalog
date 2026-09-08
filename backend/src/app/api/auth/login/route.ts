import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
} from '@/lib/auth';
import { loginSchema } from '@/validators/auth.schema';

  export interface UserResponse {
    id: string;
    name: string;
    email: string;
    role: string;
    branchId: string | null;
    tenantId: string | null;
  };

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.message } },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findFirst({ where: { email } });

  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } },
      { status: 401 }
    );
  }

  const isValid = await comparePassword(password, user.password);

  if (!isValid) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } },
      { status: 401 }
    );
  }

  const accessToken = generateAccessToken({
    userId: user.id,
    role: user.role,
    tenantId: user.tenantId,
    branchId: user.branchId,
  });

  const refreshToken = generateRefreshToken({ userId: user.id });

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      tenantId: user.tenantId,
      expiresAt: new Date(Date.now() + 7 * 86400000),
    },
  });

  const userResponse = generateUserResponse(user);

  return NextResponse.json({
    success: true,
    data: {
      accessToken,
      refreshToken,
      user: userResponse,
    },
  });
}

function generateUserResponse(user: any): UserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    branchId: user.branchId, //if branchId is null, is Admin
    tenantId: user.tenantId,
  };
}