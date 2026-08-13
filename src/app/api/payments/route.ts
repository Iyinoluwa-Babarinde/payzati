import { NextResponse } from 'next/server';
import { processPayment, processBatchPayroll } from '@/lib/ilp/payments';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.batch && Array.isArray(body.payments)) {
      const senderWallet = body.senderWallet || process.env.PAYZATI_WALLET_ADDRESS || 'https://ilp.interledger-test.dev/a5cb6a41';
      const batchResult = await processBatchPayroll(senderWallet, body.payments);
      return NextResponse.json({ success: true, result: batchResult });
    }

    const { senderWallet, receiverWallet, amount, currency } = body;

    if (!receiverWallet || !amount || !currency) {
      return NextResponse.json(
        { error: 'Missing required parameters: receiverWallet, amount, currency' },
        { status: 400 }
      );
    }

    const sender = senderWallet || process.env.PAYZATI_WALLET_ADDRESS || 'https://ilp.interledger-test.dev/a5cb6a41';
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const paymentResult = await processPayment(sender, receiverWallet, numAmount, currency);

    return NextResponse.json({
      success: true,
      result: paymentResult,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Payment processing failed' },
      { status: 500 }
    );
  }
}
