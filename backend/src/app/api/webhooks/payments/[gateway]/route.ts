import { NextRequest, NextResponse } from 'next/server';
import { handlePaymentWebhook } from '@/modules/payments/payment-webhook.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ gateway: string }> }
) {
  const { gateway } = await params;

  const query: Record<string, string | undefined> = {};
  req.nextUrl.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  const outcome = await handlePaymentWebhook(gateway, query);

  if (!outcome.accepted) {
    return NextResponse.json(
      { success: false, error: { code: outcome.code, message: outcome.message } },
      { status: outcome.status }
    );
  }

  void outcome.billingTask;

  return new NextResponse('OK', {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}
