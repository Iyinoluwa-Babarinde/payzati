'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/fx-engine';
import { calculateTax } from '@/lib/tax-engine';
import { getEmployeeProfile } from '@/lib/supabase/queries';
import { createClient } from '@/lib/supabase/client';
import { processPayment } from '@/lib/ilp/payments';
import LinkOrganization from '../LinkOrganization';
import OnboardingTracker from '../OnboardingTracker';
import { Zap, CheckCircle, Check } from 'lucide-react';

export default function SalaryAdvancePage() {
  const [employee, setEmployee] = useState<any>(null);
  const [advancedThisMonth, setAdvancedThisMonth] = useState(0);
  const [amount, setAmount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [receipt, setReceipt] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const supabase = createClient();

  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const emp = await getEmployeeProfile();
    if (emp) {
      setEmployee(emp);
      
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      const { data } = await supabase.from('transactions').select('*').eq('employee_id', emp.id).eq('type', 'advance').order('date', { ascending: false });
      if (data) {
        setHistory(data);
        const monthAdvances = data.filter(t => new Date(t.created_at) >= new Date(firstDayOfMonth) && t.status === 'completed');
        const total = monthAdvances.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
        setAdvancedThisMonth(total);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <div style={{padding: '3rem', textAlign: 'center'}}>Loading profile...</div>;
  if (!employee) return <LinkOrganization onLinked={loadData} />;
  
  if (employee.status === 'on_leave') return <OnboardingTracker employee={employee} onRefresh={loadData} />;

  const taxBreakdown = calculateTax(employee.salary, employee.country, employee.currency);
  const netSalary = taxBreakdown.netSalary;
  
  const theoreticalMax = netSalary * 0.5;
  const maxAdvance = Math.max(0, theoreticalMax - advancedThisMonth);

  const handleRequest = async () => {
    if (amount <= 0 || amount > maxAdvance) return;
    setProcessing(true);

    const supabase2 = createClient();
    const { data: txData } = await supabase2
      .from('transactions')
      .select('amount')
      .eq('company_id', employee.company_id)
      .eq('status', 'completed');
    const companyBalance = (txData || []).reduce((sum: number, tx: any) => sum + tx.amount, 0);
    const usdRate = employee.currency === 'NGN' ? 1550 : employee.currency === 'KES' ? 130 : employee.currency === 'GHS' ? 12 : employee.currency === 'ZAR' ? 18 : employee.currency === 'EGP' ? 31 : 1;
    const amountInUSD = amount / usdRate;

    if (companyBalance < amountInUSD) {
      alert(`Your employer's wallet has insufficient funds to process this advance right now. Please contact HR.`);
      setProcessing(false);
      return;
    }
    
    const senderWallet = process.env.NEXT_PUBLIC_PAYZATI_WALLET_ADDRESS || 'https://ilp.interledger-test.dev/a5cb6a41';
    const result = await processPayment(senderWallet, employee.wallet_address, amount, employee.currency);

    if (result.status === 'completed') {
      const { data } = await supabase.from('transactions').insert({
        company_id: employee.company_id,
        employee_id: employee.id,
        type: 'advance',
        amount: -amount,
        currency: employee.currency,
        status: 'completed',
        description: 'Instant Salary Advance via ILP',
        receipt: result.receipt
      }).select().single();
      
      if (data) {
        setHistory([data, ...history]);
        setAdvancedThisMonth(prev => prev + amount);
      }
      setReceipt(result.receipt || '');
      setSuccess(true);
    } else {
      alert("Payment failed on the Interledger network.");
    }
    
    setProcessing(false);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Salary Advance</h1><p className="page-subtitle">Request an instant advance via ILP — repaid automatically on next payday</p></div>
      </div>

      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ background: 'var(--elevation-1)' }}>
          <div className="stat-card" style={{ marginBottom: '1.5rem' }}>
            <span className="stat-label">Available for Advance</span>
            <span className="stat-value" style={{ color: 'var(--accent-teal)', fontSize: 'var(--text-lg)' }}>{formatCurrency(maxAdvance, employee.currency)}</span>
            <span className="stat-change" style={{ color: 'var(--text-secondary)' }}>50% of Net Salary ({formatCurrency(netSalary, employee.currency)})</span>
          </div>

          <div style={{ width: '100%', height: '12px', background: 'var(--elevation-2)', borderRadius: '6px', overflow: 'hidden', marginBottom: '1rem' }}>
            <div style={{ width: `${maxAdvance > 0 ? (amount / maxAdvance) * 100 : 0}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-teal), var(--accent-purple))', borderRadius: '6px', transition: 'width 0.3s ease' }} />
          </div>

          {!success ? (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Advance Amount ({employee.currency})
                </label>
                <input type="range" min={0} max={maxAdvance} step={employee.salary > 100000 ? 10000 : 1000} value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  style={{ width: '100%' }} />
                <div style={{ textAlign: 'center', fontSize: 'var(--text-md)', fontWeight: 700, marginTop: '0.5rem', color: 'var(--accent-teal)' }}>
                  {formatCurrency(amount, employee.currency)}
                </div>
              </div>
              <button className="btn btn-primary btn-lg btn-block"
                disabled={amount <= 0 || processing} onClick={handleRequest}>
                {processing ? (
                  <><Zap size={14} /> Routing via Open Payments...</>
                ) : (
                  <><Zap size={14} /> Request via ILP</>
                )}
              </button>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--accent-teal)', display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <CheckCircle size={48} />
              </div>
              <h3 style={{ color: 'var(--accent-teal)', marginBottom: '0.5rem' }}>Advance Sent!</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{formatCurrency(amount, employee.currency)} deposited to your wallet address</p>
              <p style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', wordBreak: 'break-all' }}>Receipt: {receipt}</p>
              <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={() => { setSuccess(false); setAmount(0); }}>Done</button>
            </div>
          )}
        </div>

        <div className="card" style={{ background: 'var(--elevation-1)' }}>
          <h3 style={{ marginBottom: '1rem' }}>Advance History</h3>
          {history.length === 0 ? <p style={{color: 'var(--text-secondary)'}}>No advances requested yet.</p> : history.map((a, i) => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <strong>{formatCurrency(a.amount, a.currency)}</strong>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{new Date(a.date).toLocaleDateString()}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-success">
                  <Check size={12} style={{ marginRight: '2px' }} /> Disbursed
                </span>
              </div>
            </div>
          ))}

          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--elevation-2)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>How it works:</strong><br />
            1. Select your advance amount (up to 50% of salary)<br />
            2. Funds are sent instantly via ILP to your wallet<br />
            3. Repayment is automatically deducted from your next payroll
          </div>
        </div>
      </div>
    </div>
  );
}
