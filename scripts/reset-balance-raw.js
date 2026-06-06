const url = 'https://bbvgxymljpxkgnsobcnf.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJidmd4eW1sanB4a2duc29iY25mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQ4NDc0MiwiZXhwIjoyMDk2MDYwNzQyfQ.05K_o6UFsV013_1EUh4ns8kIYFjpUcS35qH0euxPviw'; // using service role for bypass

async function run() {
  const compRes = await fetch(`${url}/rest/v1/companies?select=id,name`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  const companies = await compRes.json();
  if (!companies || companies.length === 0) return console.log('No companies');
  const company = companies[0];

  const txRes = await fetch(`${url}/rest/v1/transactions?select=amount&company_id=eq.${company.id}&status=eq.completed`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  const txs = await txRes.json();
  const balance = txs.reduce((sum, tx) => sum + tx.amount, 0);
  console.log('Balance:', balance);

  if (balance < 0) {
    const insertRes = await fetch(`${url}/rest/v1/transactions`, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        company_id: company.id,
        type: 'deposit',
        amount: Math.abs(balance),
        currency: 'USD',
        status: 'completed',
        description: 'System Admin Rebalance (Debt Forgiveness)'
      })
    });
    console.log('Rebalance status:', insertRes.status);
  }
}
run();
