'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/fx-engine';
import { calculateTax } from '@/lib/tax-engine';
import { getEmployeeProfile } from '@/lib/supabase/queries';
import { createClient } from '@/lib/supabase/client';
import { processPayment } from '@/lib/ilp/payments';
import LinkOrganization from '../LinkOrganization';
import OnboardingTracker from '../OnboardingTracker';
import { Banknote, CheckCircle, Zap } from 'lucide-react';

export default function EarnedWagePage() {
  const [employee, setEmployee] = useState<any>(null);
  const [withdrawnThisMonth, setWithdrawnThisMonth] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const emp = await getEmployeeProfile();
    if (emp) {
      setEmployee(emp);
      
      // Fetch prior withdrawals for this month
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      const { data: withdrawals } = await supabase
        .from('transactions')
        .select('amount')
        .eq('employee_id', emp.id)
        .eq('type', 'withdrawal')
        .eq('status', 'completed')
        .gte('created_at', firstDayOfMonth);
        
      if (withdrawals) {
        const total = withdrawals.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
        setWithdrawnThisMonth(total);
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

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  
  const joinDate = new Date(employee.created_at);
  const startDay = joinDate > firstDayOfMonth ? joinDate.getDate() : 1;
  const daysWorked = Math.max(0, now.getDate() - startDay + 1);
  
  const dailyRate = netSalary / daysInMonth;
  const accrued = Math.floor(dailyRate * daysWorked);
  const earned = Math.max(0, accrued - withdrawnThisMonth);
  const percentage = Math.round((daysWorked / daysInMonth) * 100);

  const handleWithdraw = async () => {
    if (withdrawAmount <= 0 || withdrawAmount > earned) return;
    setProcessing(true);

    const { data: txData } = await supabase
      .from('transactions')
      .select('amount')
      .eq('company_id', employee.company_id)
      .eq('status', 'completed');
    const companyBalance = (txData || []).reduce((sum: number, tx: any) => sum + tx.amount, 0);
    const usdRate = employee.currency === 'NGN' ? 1550 : employee.currency === 'KES' ? 130 : employee.currency === 'GHS' ? 12 : employee.currency === 'ZAR' ? 18 : employee.currency === 'EGP' ? 31 : 1;
    const amountInUSD = withdrawAmount / usdRate;

    if (companyBalance < amountInUSD) {
      alert(`Your employer's wallet has insufficient funds right now. Please contact HR or try a smaller amount.`);
      setProcessing(false);
      return;
    }
    
    const senderWallet = process.env.NEXT_PUBLIC_PAYZATI_WALLET_ADDRESS || 'https://ilp.interledger-test.dev/a5cb6a41';
    const result = await processPayment(senderWallet, employee.wallet_address, withdrawAmount, employee.currency);

    if (result.status === 'completed') {
      await supabase.from('transactions').insert({
        company_id: employee.company_id,
        employee_id: employee.id,
        type: 'withdrawal',
        amount: -withdrawAmount,
        currency: employee.currency,
        status: 'completed',
        description: 'Earned Wage Withdrawal',
        receipt: result.receipt
      });
      setSuccess(true);
      setWithdrawnThisMonth(prev => prev + withdrawAmount);
    } else {
      alert("Payment failed.");
    }
    setProcessing(false);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Earned Wage Access</h1><p className="page-subtitle">Withdraw wages you&apos;ve already earned — no waiting until payday</p></div>
      </div>

      <div className="grid-2">
        <div className="card" style={{ background: 'var(--elevation-1)' }}>
          <div className="stat-card" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <span className="stat-label">Available to Withdraw</span>
            <span className="stat-value" style={{ color: 'var(--accent-teal)', fontSize: 'var(--text-lg)' }}>{formatCurrency(earned, employee.currency)}</span>
            <span className="stat-change" style={{ color: 'var(--text-secondary)' }}>
              Accrued: {formatCurrency(accrued, employee.currency)} | Withdrawn: {formatCurrency(withdrawnThisMonth, employee.currency)}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
              <circle cx="80" cy="80" r="70" fill="none" stroke="url(#grad)" strokeWidth="12"
                strokeDasharray={`${percentage * 4.4} ${440 - percentage * 4.4}`}
                strokeDashoffset="110" strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease' }} />
              <defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--accent-teal)" />
                <stop offset="100%" stopColor="var(--accent-purple)" />
              </linearGradient></defs>
              <text x="80" y="75" textAnchor="middle" fill="var(--text-primary)" fontSize="24" fontWeight="700" fontFamily="var(--font-heading)">{percentage}%</text>
              <text x="80" y="95" textAnchor="middle" fill="var(--text-secondary)" fontSize="11">month</text>
            </svg>
          </div>

          {!success ? (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)' }}>Withdraw Amount</label>
                <input type="range" min={0} max={earned} step={netSalary > 100000 ? 5000 : 500} value={withdrawAmount}
                  onChange={e => setWithdrawAmount(Number(e.target.value))}
                  style={{ width: '100%' }} />
                <div style={{ textAlign: 'center', fontSize: 'var(--text-md)', fontWeight: 700, marginTop: '0.5rem', color: 'var(--accent-teal)' }}>
                  {formatCurrency(withdrawAmount, employee.currency)}
                </div>
              </div>
              <button className="btn btn-primary btn-lg btn-block"
                disabled={withdrawAmount <= 0 || withdrawAmount > earned || processing} onClick={handleWithdraw}>
                {processing ? (
                  <><Zap size={14} /> Routing packet...</>
                ) : (
                  <><Zap size={14} /> Withdraw via ILP</>
                )}
              </button>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--accent-teal)', display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <CheckCircle size={48} />
              </div>
              <h3 style={{ color: 'var(--accent-teal)', marginBottom: '0.5rem' }}>{formatCurrency(withdrawAmount, employee.currency)} Withdrawn!</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>Settled instantly to your Interledger wallet</p>
              <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={() => { setSuccess(false); setWithdrawAmount(0); }}>Done</button>
            </div>
          )}
        </div>

        <div className="card" style={{ background: 'var(--elevation-1)' }}>
          <h3 style={{ marginBottom: '1rem' }}>How Earned Wage Access Works</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {[
              { step: '1', title: 'You work', desc: `You accrue a portion of your Net Salary (${formatCurrency(netSalary, employee.currency)}) every day.` },
              { step: '2', title: 'Wages accrue', desc: `We calculate based on ${daysWorked} days worked out of ${daysInMonth} days this month.` },
              { step: '3', title: 'Withdraw anytime', desc: 'Access your earned wages before the official payday' },
              { step: '4', title: 'ILP instant payout', desc: 'Funds are sent to your wallet in seconds via Interledger' },
              { step: '5', title: 'Auto-adjusted', desc: 'Withdrawn amounts are tracked to prevent overdrawing.' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-teal-dim)', color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0 }}>{s.step}</div>
                <div><strong>{s.title}</strong><br /><small style={{ color: 'var(--text-secondary)' }}>{s.desc}</small></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
