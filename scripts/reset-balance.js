import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetBalance() {
  console.log('Fetching transactions...');
  
  // Get all companies
  const { data: companies } = await supabase.from('companies').select('id, name');
  if (!companies || companies.length === 0) {
    console.log('No companies found.');
    return;
  }
  
  const company = companies[0];
  console.log('Processing for company:', company.name);
  
  const { data: txs } = await supabase.from('transactions').select('amount').eq('company_id', company.id).eq('status', 'completed');
  
  if (txs) {
    const balance = txs.reduce((sum, tx) => sum + tx.amount, 0);
    console.log('Current balance:', balance);
    
    if (balance < 0) {
      console.log(`Injecting rebalance deposit of ${Math.abs(balance)}...`);
      const { error } = await supabase.from('transactions').insert({
        company_id: company.id,
        type: 'deposit',
        amount: Math.abs(balance),
        currency: 'USD',
        status: 'completed',
        description: 'System Admin Rebalance (Debt Forgiveness)'
      });
      
      if (error) {
        console.error('Failed to insert rebalance:', error.message);
      } else {
        console.log('Successfully rebalanced account to $0.00');
      }
    } else {
      console.log('Balance is not negative. No action needed.');
    }
  }
}

resetBalance();
