import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/cron/monthly-pull
 *
 * Called by Vercel Cron on the 1st of each month (configured in vercel.json).
 * Also callable manually from the Admin panel or the Employer Wallet page.
 *
 * For each company that has a linked bank with autoFund === true, this route:
 *  1. Computes the total net payroll for all active employees
 *  2. Records an auto-debit deposit transaction against the company
 *  3. Updates `last_pull` and `next_pull` timestamps in system_config
 *  4. Returns a summary of all processed companies
 *
 * Security: protected by CRON_SECRET header (set in Vercel env vars).
 * For demo mode, the secret check is bypassed when CRON_SECRET is not set.
 */
export async function POST(req: NextRequest) {
  // ── Auth guard ──────────────────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabase = await createClient();
  const results: any[] = [];

  try {
    // 1. Find all system_config rows whose key starts with 'corp_bank_'
    const { data: bankConfigs, error: configError } = await supabase
      .from('system_config')
      .select('key, value')
      .like('key', 'corp_bank_%');

    if (configError) throw configError;
    if (!bankConfigs || bankConfigs.length === 0) {
      return NextResponse.json({ message: 'No linked bank accounts found.', results: [] });
    }

    for (const config of bankConfigs) {
      // Only process companies with auto-funding ON
      if (!config.value?.autoFund) continue;

      const companyId = (config.key as string).replace('corp_bank_', '');

      // 2. Pull active employees for this company
      const { data: employees } = await supabase
        .from('employees')
        .select('salary, currency')
        .eq('company_id', companyId)
        .eq('status', 'active');

      if (!employees || employees.length === 0) {
        results.push({ companyId, status: 'skipped', reason: 'No active employees' });
        continue;
      }

      // 3. Compute total payroll in USD (approximation using fixed FX rates)
      const FX: Record<string, number> = {
        USD: 1,
        EUR: 1.08,
        GBP: 1.27,
        NGN: 1 / 1550,
        KES: 1 / 130,
        GHS: 1 / 12,
        ZAR: 1 / 18,
        EGP: 1 / 31,
      };

      const totalUSD = employees.reduce((sum, emp) => {
        const rate = FX[emp.currency] ?? 1;
        // Apply a rough 20 % tax deduction to get net salary
        const netSalary = emp.salary * 0.8;
        return sum + netSalary * rate;
      }, 0);

      // 4. Check current wallet balance
      const { data: txData } = await supabase
        .from('transactions')
        .select('amount, currency')
        .eq('company_id', companyId)
        .eq('status', 'completed');

      const currentBalance = (txData ?? []).reduce((sum, tx) => {
        const rate = FX[tx.currency] ?? 1;
        return sum + tx.amount * rate;
      }, 0);

      const shortfall = Math.max(0, totalUSD - currentBalance);

      if (shortfall <= 0) {
        results.push({
          companyId,
          status: 'skipped',
          reason: 'Sufficient balance — no pull needed',
          balance: currentBalance.toFixed(2),
          required: totalUSD.toFixed(2),
        });
      } else {
        // 5. Record the auto-debit as a deposit transaction
        const now = new Date();
        const { error: txError } = await supabase.from('transactions').insert({
          company_id: companyId,
          type: 'deposit',
          amount: shortfall,
          currency: 'USD',
          status: 'completed',
          description: `Monthly Auto-Pull via ILP — ${config.value.bankName} ••••${config.value.last4}`,
          date: now.toISOString(),
        });

        if (txError) {
          results.push({ companyId, status: 'error', error: txError.message });
          continue;
        }

        // 6. Update pull timestamps in system_config
        const nextPull = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        await supabase.from('system_config').upsert({
          key: `corp_pull_schedule_${companyId}`,
          value: {
            lastPull: now.toISOString(),
            nextPull: nextPull.toISOString(),
            lastAmount: shortfall,
            bankName: config.value.bankName,
            last4: config.value.last4,
          },
        });

        results.push({
          companyId,
          status: 'success',
          pulled: shortfall.toFixed(2),
          currency: 'USD',
          nextPull: nextPull.toISOString(),
        });
      }
    }

    return NextResponse.json({
      message: `Monthly pull completed. ${results.filter(r => r.status === 'success').length} company(s) funded.`,
      processedAt: new Date().toISOString(),
      results,
    });
  } catch (err: any) {
    console.error('[Monthly Pull] Error:', err);
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 });
  }
}

/**
 * GET /api/cron/monthly-pull?companyId=xxx
 * Returns the pull schedule for a specific company (used by the wallet UI).
 */
export async function GET(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get('companyId');
  if (!companyId) {
    return NextResponse.json({ error: 'companyId required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from('system_config')
    .select('value')
    .eq('key', `corp_pull_schedule_${companyId}`)
    .maybeSingle();

  return NextResponse.json({ schedule: data?.value ?? null });
}
