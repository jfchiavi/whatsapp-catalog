import { NextRequest, NextResponse } from 'next/server';
import { StorefrontMetricEvent } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/errors';
import { recordStorefrontMetricSchema } from '@/validators/storefront-metrics.schema';
import { recordStorefrontMetric } from '@/modules/storefront/storefront-metrics.service';
import { normalizeTenantHomeContent } from '@/validators/tenant.schema';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const tenant = await prisma.tenant.findFirst({
      where: { slug, active: true },
      select: { id: true, homePage: { select: { publishedContent: true } } },
    });
    if (!tenant) {
      return NextResponse.json({ success: true, data: { recorded: false } });
    }

    const parsed = recordStorefrontMetricSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid metric event' } },
        { status: 400 }
      );
    }

    const { event, target } = parsed.data;
    let normalizedTarget = '';
    if (event === StorefrontMetricEvent.FEATURED_PRODUCT_CLICK) {
      if (!target) return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Product target is required' } }, { status: 400 });
      const product = await prisma.product.findFirst({
        where: { id: target, tenantId: tenant.id, active: true },
        select: { id: true },
      });
      if (!product) return NextResponse.json({ success: true, data: { recorded: false } });
      normalizedTarget = product.id;
    } else if (event === StorefrontMetricEvent.CATEGORY_CLICK) {
      if (!target || !tenant.homePage?.publishedContent) return NextResponse.json({ success: true, data: { recorded: false } });
      const content = normalizeTenantHomeContent(tenant.homePage.publishedContent);
      const categoryExists = content.sections.some((section) => section.type === 'categories' && section.enabled && section.items.some((item) => item.label === target));
      if (!categoryExists) return NextResponse.json({ success: true, data: { recorded: false } });
      normalizedTarget = target;
    }

    await recordStorefrontMetric(tenant.id, event, normalizedTarget);
    return NextResponse.json({ success: true, data: { recorded: true } });
  } catch (error) {
    return handleError(error);
  }
}