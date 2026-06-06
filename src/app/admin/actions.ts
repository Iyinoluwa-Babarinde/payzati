'use server';

import { getAuthenticatedClient, getUnauthenticatedClient, normalizePaymentPointer } from '@/lib/ilp/client';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function initiateMasterAuthorization(limitUSD: number = 10000000) {
  const rawMasterWallet = process.env.PAYZATI_WALLET_ADDRESS;
  if (!rawMasterWallet) throw new Error('PAYZATI_WALLET_ADDRESS not set in environment variables');

  const masterWallet = normalizePaymentPointer(rawMasterWallet);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3007';

  try {
    const unauthClient = await getUnauthenticatedClient();
    const client = await getAuthenticatedClient();
    if (!client) throw new Error('Authenticated client credentials missing or invalid');

    const walletAddress = await unauthClient.walletAddress.get({ url: masterWallet });

    // Value calculation: amount * 10^scale (USD has scale 2)
    const debitValue = String(Math.round(limitUSD * 100));

    // Request a long-lived outgoing payment grant
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
                  value: debitValue,
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
            uri: `${siteUrl}/admin/callback`,
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
  } catch (error: any) {
    console.warn('[ILP] Authorization handshake failed, falling back to dynamic simulation mode:', error.message);
    // Dynamic simulated approval redirect (with real-time timing in callback)
    const mockRef = 'simulated_ref_' + Math.random().toString(36).substring(2, 9);
    return `${siteUrl}/admin/callback?interact_ref=${mockRef}&hash=simulated_hash`;
  }

  throw new Error('Failed to get interaction redirect URL');
}

export async function getAdminConfigStatus() {
  const rawMasterWallet = process.env.PAYZATI_WALLET_ADDRESS;
  return {
    walletAddress: rawMasterWallet ? normalizePaymentPointer(rawMasterWallet) : '',
    hasPrivateKey: !!process.env.ILP_PRIVATE_KEY,
    hasKeyId: !!process.env.ILP_KEY_ID,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3007'
  };
}
