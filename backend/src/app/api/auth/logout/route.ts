import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const { refreshToken } = await req.json();

  await prisma.refreshToken.deleteMany({
    where: { token: refreshToken },
  });

  return NextResponse.json({ success: true });
}
