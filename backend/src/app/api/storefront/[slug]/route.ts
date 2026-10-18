import { NextRequest, NextResponse } from 'next/server';
import { handleError } from '@/lib/errors';
import { getPublishedTenantHome } from '@/modules/storefront/storefront.service';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const publishedHome = await getPublishedTenantHome(slug);
    return NextResponse.json({ success: true, data: publishedHome });
  } catch (error) {
    return handleError(error);
  }
}