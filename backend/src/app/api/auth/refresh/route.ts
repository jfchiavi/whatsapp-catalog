import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  verifyRefreshToken,
  generateAccessToken,
} from '@/lib/auth';

export async function POST(req: Request) {
  const { refreshToken } = await req.json();

  try {
    const payload = verifyRefreshToken(refreshToken);

    const tokenInDb = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!tokenInDb) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid refresh token' } },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
        { status: 401 }
      );
    }

    const newAccessToken = generateAccessToken({
      userId: user.id,
      role: user.role,
      tenantId: user.tenantId ?? '',
      branchId: user.branchId,
    });

    return NextResponse.json({ success: true, data: { accessToken: newAccessToken } });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid refresh token' } },
      { status: 401 }
    );
  }
}
