import { NextResponse } from 'next/server';
import { getFXQuote, getLiveRates, SUPPORTED_CURRENCIES } from '@/lib/fx-engine';
import { getAuthenticatedClient, getUnauthenticatedClient, normalizePaymentPointer } from '@/lib/ilp/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = (searchParams.get('from') || 'USD').toUpperCase();
    const to = (searchParams.get('to') || 'CAD').toUpperCase();
    const amountStr = searchParams.get('amount') || '1000';

    const amount = parseFloat(amountStr);

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount parameter. Must be a positive number.' },
        { status: 400 }
      );
    }

    // Attempt live Interledger Open Payments quote.create for USD -> CAD testnet corridor
    if (from === 'USD' && to === 'CAD') {
      try {
        const client = await getAuthenticatedClient();
        const unauthClient = await getUnauthenticatedClient();
        if (client) {
          const senderUrl = normalizePaymentPointer(
            process.env.PAYZATI_WALLET_ADDRESS || 'https://ilp.interledger-test.dev/payzati'
          );
          const receiverUrl = 'https://ilp.interledger-test.dev/amara';
          const [senderAddr, receiverAddr] = await Promise.all([
            unauthClient.walletAddress.get({ url: senderUrl }),
            unauthClient.walletAddress.get({ url: receiverUrl }),
          ]);

          const incomingGrant = (await client.grant.request(
            { url: receiverAddr.authServer },
            { access_token: { access: [{ type: 'incoming-payment', actions: ['create', 'read'] }] } }
          )) as any;

          const incomingPayment = await client.incomingPayment.create(
            { url: receiverAddr.resourceServer, accessToken: incomingGrant.access_token.value },
            { walletAddress: receiverAddr.id }
          );

          const quoteGrant = (await client.grant.request(
            { url: senderAddr.authServer },
            { access_token: { access: [{ type: 'quote', actions: ['create', 'read'] }] } }
          )) as any;

          const senderScale = typeof senderAddr.assetScale === 'number' ? senderAddr.assetScale : 2;
          const liveQuote = await client.quote.create(
            { url: senderAddr.resourceServer, accessToken: quoteGrant.access_token.value },
            {
              walletAddress: senderAddr.id,
              receiver: incomingPayment.id,
              method: 'ilp',
              debitAmount: {
                value: String(Math.round(amount * Math.pow(10, senderScale))),
                assetCode: senderAddr.assetCode || 'USD',
                assetScale: senderScale,
              },
            }
          );

          const receiveScale = liveQuote.receiveAmount?.assetScale ?? 2;
          const toAmount = Number(liveQuote.receiveAmount?.value || 0) / Math.pow(10, receiveScale);
          const effectiveRate = amount > 0 ? Math.round((toAmount / amount) * 10000) / 10000 : 1.38;

          return NextResponse.json({
            success: true,
            source: 'interledger-live',
            quoteId: liveQuote.id,
            quote: {
              fromCurrency: 'USD',
              toCurrency: 'CAD',
              rate: effectiveRate,
              inverseRate: Math.round((1 / effectiveRate) * 10000) / 10000,
              spread: 0,
              effectiveRate,
              fromAmount: amount,
              toAmount: Math.round(toAmount * 100) / 100,
              timestamp: new Date(),
            },
            timestamp: new Date().toISOString(),
          });
        }
      } catch {
        // Gracefully fall through to standard FX quote
      }
    }

    if (!SUPPORTED_CURRENCIES.includes(from) && from !== 'CAD') {
      return NextResponse.json({ error: `Unsupported currency: ${from}` }, { status: 400 });
    }

    const quote = getFXQuote(from, to, amount);
    const liveRates = getLiveRates();

    return NextResponse.json({
      success: true,
      source: 'fx-engine',
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
