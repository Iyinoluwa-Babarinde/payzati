'use server';

import { getAuthenticatedClient, getUnauthenticatedClient } from '@/lib/ilp/client';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function initiateMasterAuthorization() {
  const masterWallet = process.env.PAYZATI_WALLET_ADDRESS;
  if (!masterWallet) throw new Error('PAYZATI_WALLET_ADDRESS not set in .env.local');

  const unauthClient = await getUnauthenticatedClient();
  const client = await getAuthenticatedClient();
  if (!client) throw new Error('Authenticated client credentials missing or invalid');

  const walletAddress = await unauthClient.walletAddress.get({ url: masterWallet });

  // Request a massive, long-lived outgoing payment grant
  const grant = await client.grant.request(
    { url: walletAddress.authServer },
    {
      access_token: {
        access: [
          {
            type: 'outgoing-payment',
            actions: ['create', 'read', 'list'],
            identifier: masterWallet,
            limits: {
              debitAmount: {
                value: '10000000000', // $10,000,000.00
                assetCode: 'USD',
                assetScale: 2,
              },
            },
          },
        ],
      },
      interact: {
        start: ['redirect'],
        finish: {
          method: 'redirect',
          uri: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/callback`,
          nonce: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        },
      },
    }
  );

  if ('interact' in grant) {
    // Save the continue details in the database so we can resume the grant later
    const supabase = await createServerClient();
    await supabase.from('system_config').upsert({
      key: 'master_grant_continue',
      value: {
        uri: grant.continue.uri,
        access_token: grant.continue.access_token.value
      }
    });

    return grant.interact.redirect;
  }

  throw new Error('Failed to get interaction redirect URL');
}
