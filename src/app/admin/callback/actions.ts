'use server';

import { cookies } from 'next/headers';
import { getAuthenticatedClient } from '@/lib/ilp/client';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function processMasterCallback(url: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const parsedUrl = new URL(url);
    const interactRef = parsedUrl.searchParams.get('interact_ref');

    if (!interactRef) {
      return { ok: false, error: 'No approval code was returned from Interledger.' };
    }

    const cookieStore = await cookies();

    // 1. Read grant continue details from HTTP-only cookie first, then Supabase fallback
    let continueInfo: { uri: string; access_token: string } | null = null;
    const rawCookie = cookieStore.get('payzati_grant_continue')?.value;
    if (rawCookie) {
      try {
        continueInfo = JSON.parse(rawCookie);
      } catch {
        continueInfo = null;
      }
    }

    if (!continueInfo) {
      try {
        const supabase = await createServerClient();
        const { data } = await supabase
          .from('system_config')
          .select('value')
          .eq('key', 'master_grant_continue')
          .single();
        if (data?.value?.uri && data?.value?.access_token) {
          continueInfo = data.value;
        }
      } catch {
        // Handled below
      }
    }

    if (!continueInfo) {
      return {
        ok: false,
        error: 'Approval session expired. Please return to Company Overview and click Approve payout budget again.',
      };
    }

    const client = await getAuthenticatedClient();
    if (!client) {
      return { ok: false, error: 'Server Open Payments keys (ILP_PRIVATE_KEY / ILP_KEY_ID) are missing or invalid.' };
    }

    const grant = await client.grant.continue(
      {
        url: continueInfo.uri,
        accessToken: continueInfo.access_token,
      },
      { interact_ref: interactRef }
    );

    const finalGrant = grant as any;
    const accessToken = finalGrant?.access_token?.value;
    if (!accessToken) {
      return { ok: false, error: 'Interledger did not return a spending token. Please try approving again.' };
    }

    // 2. Save final master token in HTTP-only cookie (works in Demo Mode & Production)
    cookieStore.set('payzati_master_ilp_token', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Clear temporary continue cookie
    cookieStore.delete('payzati_grant_continue');

    // 3. Also persist to Supabase system_config as backup
    try {
      const supabase = await createServerClient();
      await supabase.from('system_config').upsert({
        key: 'master_ilp_token',
        value: accessToken,
      });
    } catch {
      // Cookie already persisted the live token
    }

    return { ok: true };
  } catch (e: any) {
    return {
      ok: false,
      error: e?.message || 'Unable to finish wallet approval with Interledger.',
    };
  }
}
