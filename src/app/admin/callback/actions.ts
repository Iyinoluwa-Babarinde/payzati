'use server';

import { getAuthenticatedClient, normalizePaymentPointer } from '@/lib/ilp/client';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function processMasterCallback(url: string) {
  const parsedUrl = new URL(url);
  const interactRef = parsedUrl.searchParams.get('interact_ref');
  const hash = parsedUrl.searchParams.get('hash');

  if (!interactRef) {
    throw new Error('No interact_ref found in URL');
  }

  const supabase = await createServerClient();

  if (interactRef.startsWith('simulated_ref')) {
    // Add real-time timing delay (1.5 seconds) to make the handshake feel alive during demo
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Save the final simulated token
    await supabase.from('system_config').upsert({
      key: 'master_ilp_token',
      value: 'simulated_long_lived_token_for_demo_day_123456789'
    });
    return true;
  }

  const client = await getAuthenticatedClient();
  if (!client) throw new Error('Authenticated client credentials missing or invalid');

  const rawMasterWallet = process.env.PAYZATI_WALLET_ADDRESS;
  if (!rawMasterWallet) throw new Error('PAYZATI_WALLET_ADDRESS not set');
  
  const { data, error } = await supabase.from('system_config').select('value').eq('key', 'master_grant_continue').single();
  if (error || !data) throw new Error('Could not find continue details in database');
  
  const continueInfo = data.value;

  const grant = await client.grant.continue(
    {
      url: continueInfo.uri,
      accessToken: continueInfo.access_token,
    },
    { interact_ref: interactRef }
  );

  // Cast as any to resolve union type narrowing errors for TypeScript compiler
  const finalGrant = grant as any;
  if (!finalGrant.access_token) {
    throw new Error('Grant continuation did not return an access token');
  }

  // Save the final token
  await supabase.from('system_config').upsert({
    key: 'master_ilp_token',
    value: finalGrant.access_token.value
  });

  return true;
}
