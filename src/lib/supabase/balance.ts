import { createClient as createServerClient } from '@/lib/supabase/server';

/**
 * Returns the current USD balance for a company by summing all transactions.
 * Deposits are positive, payroll/advances are negative.
 */
export async function getCompanyBalance(companyId: string): Promise<number> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from('transactions')
    .select('amount, currency')
    .eq('company_id', companyId)
    .eq('status', 'completed');

  if (!data) return 0;

  // Sum everything — all amounts should already be stored in the same currency (USD) for employer txs
  return data.reduce((sum, tx) => sum + tx.amount, 0);
}

/**
 * Checks if the company has enough balance to cover a given amount.
 * Throws a descriptive error if not.
 */
export async function assertSufficientBalance(companyId: string, requiredAmount: number): Promise<void> {
  const balance = await getCompanyBalance(companyId);
  if (balance < requiredAmount) {
    throw new Error(
      `Insufficient wallet balance. Available: $${balance.toFixed(2)}, Required: $${requiredAmount.toFixed(2)}. Please fund your wallet before running payroll.`
    );
  }
}
