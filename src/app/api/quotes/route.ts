import { NextResponse } from 'next/server';
import { getFXQuote, getLiveRates, SUPPORTED_CURRENCIES } from '@/lib/fx-engine';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || 'USD';
    const to = searchParams.get('to') || 'NGN';
    const amountStr = searchParams.get('amount') || '1000';

    const amount = parseFloat(amountStr);

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount parameter. Must be a positive number.' },
        { status: 400 }
      );
    }

    if (!SUPPORTED_CURRENCIES.includes(from) || !SUPPORTED_CURRENCIES.includes(to)) {
      return NextResponse.json(
        { error: `Unsupported currency pair. Supported: ${SUPPORTED_CURRENCIES.join(', ')}` },
        { status: 400 }
      );
    }

    const quote = getFXQuote(from, to, amount);
    const liveRates = getLiveRates();

    return NextResponse.json({
      success: true,
      quote,
      availableRates: liveRates,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to generate FX quote' },
      { status: 500 }
    );
  }
}
