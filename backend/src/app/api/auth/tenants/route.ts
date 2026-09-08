import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { registerTenantSchema } from '@/validators/tenant.schema';

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = registerTenantSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.message } },
      { status: 400 }
    );
  }

  const { tenantName, adminName, adminEmail, adminPassword } = parsed.data;

  const existingTenant = await prisma.tenant.findFirst({
    where: { name: tenantName },
  });

  if (existingTenant) {
    return NextResponse.json(
      { success: false, error: { code: 'TENANT_EXISTS', message: 'Tenant already exists' } },
      { status: 409 }
    );
  }

  const hashedPassword = await hashPassword(adminPassword);

  const result = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: { name: tenantName },
    });

    const admin = await tx.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        tenantId: tenant.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true,
      },
    });

    return { tenant, admin };
  });

  return NextResponse.json(
    { success: true, data: result },
    { status: 201 }
  );
}
