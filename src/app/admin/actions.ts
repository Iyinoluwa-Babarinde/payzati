'use server';

import { cookies } from 'next/headers';
import { getAuthenticatedClient, getUnauthenticatedClient, normalizePaymentPointer } from '@/lib/ilp/client';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function initiateMasterAuthorization(limitAmount: number = 50000, originUrl?: string) {
  const rawMasterWallet = process.env.PAYZATI_WALLET_ADDRESS;
  if (!rawMasterWallet) throw new Error('PAYZATI_WALLET_ADDRESS is not configured in environment variables.');

  const masterWallet = normalizePaymentPointer(rawMasterWallet);
  const siteUrl = (
    originUrl ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3007')
  ).replace(/\/$/, '');

  const unauthClient = await getUnauthenticatedClient();
  const client = await getAuthenticatedClient();
  if (!client) {
    throw new Error('Open Payments credentials (ILP_PRIVATE_KEY / ILP_KEY_ID) are missing or invalid.');
  }

  const walletAddress = await unauthClient.walletAddress.get({ url: masterWallet });
  const assetCode = walletAddress.assetCode || 'EUR';
  const assetScale = typeof walletAddress.assetScale === 'number' ? walletAddress.assetScale : 2;
  const debitValue = String(Math.round(limitAmount * Math.pow(10, assetScale)));

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
                assetCode,
                assetScale,
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

  if ('interact' in grant && grant.interact?.redirect) {
    const continuePayload = {
      uri: grant.continue.uri,
      access_token: grant.continue.access_token.value,
    };

    // 1. Save in HTTP-only cookie (works reliably even in unauthenticated Demo Mode)
    const cookieStore = await cookies();
    cookieStore.set('payzati_grant_continue', JSON.stringify(continuePayload), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 600,
    });

    // 2. Also save to Supabase system_config as backup
    try {
      const supabase = await createServerClient();
      await supabase.from('system_config').upsert({
        key: 'master_grant_continue',
        value: continuePayload,
      });
    } catch {
      // Cookie already holds the continue details
    }

    return grant.interact.redirect;
  }

  throw new Error('Interledger Testnet did not return an interactive approval URL.');
}

export async function getAdminConfigStatus() {
  const rawMasterWallet = process.env.PAYZATI_WALLET_ADDRESS;
  let hasMasterToken = false;
  let isSimulatedToken = false;

  try {
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get('payzati_master_ilp_token')?.value;
    if (cookieToken) {
      hasMasterToken = true;
      isSimulatedToken = cookieToken.startsWith('simulated_');
    }
  } catch {
    // Ignore cookie read issues
  }

  if (!hasMasterToken) {
    try {
      const supabase = await createServerClient();
      const { data } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', 'master_ilp_token')
        .single();
      if (data?.value) {
        hasMasterToken = true;
        isSimulatedToken = String(data.value).startsWith('simulated_');
      }
    } catch {
      // system_config table may not have a token yet
    }
  }

  return {
    walletAddress: rawMasterWallet ? normalizePaymentPointer(rawMasterWallet) : '',
    hasPrivateKey: !!process.env.ILP_PRIVATE_KEY,
    hasKeyId: !!process.env.ILP_KEY_ID,
    hasMasterToken,
    isSimulatedToken,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://payzatidemo.vercel.app',
  };
}
