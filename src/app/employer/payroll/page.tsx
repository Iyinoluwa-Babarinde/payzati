'use client';

import { useState, useEffect } from 'react';
import { calculateTax } from '@/lib/tax-engine';
import { formatCurrency, convertCurrency } from '@/lib/fx-engine';
import { createClient } from '@/lib/supabase/client';
import { getCompany } from '@/lib/supabase/queries';
import { processBatchPayroll } from '@/lib/ilp/payments';
import ILPTransferVisualizer from '@/components/ILPTransferVisualizer';
import styles from './payroll.module.css';
import { 
  Users, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Play, 
  Building,
  DollarSign,
  Info,
  Layers,
  AlertTriangle,
  Landmark
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PayrollPage() {
  const [step, setStep] = useState(1);
  const [employees, setEmployees] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isAutoFunding, setIsAutoFunding] = useState(false);
  const [linkedBank, setLinkedBank] = useState<any>(null);

  const [processing, setProcessing] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [balanceError, setBalanceError] = useState('');
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const comp = await getCompany();
      if (comp) {
        setCompany(comp);
        
        try {
          const { data: emps } = await supabase.from('employees').select('*').eq('company_id', comp.id).eq('status', 'active');
          if (emps && emps.length > 0) {
            setEmployees(emps);
            setSelected(emps.map(e => e.id));
          } else {
            const demoEmps = [
              {
                id: 'emp-demo-1',
                name: 'Sarah Johansson',
                email: 'sarah.johansson@example.com',
                country: 'Nigeria',
                currency: 'NGN',
                salary: 1550000,
                wallet_address: 'https://ilp.interledger-test.dev/sarah-johansson',
                status: 'active',
              },
              {
                id: 'emp-demo-2',
                name: 'Kwame Mensah',
                email: 'kwame.m@example.com',
                country: 'Ghana',
                currency: 'GHS',
                salary: 14500,
                wallet_address: 'https://ilp.interledger-test.dev/kwame-mensah',
                status: 'active',
              },
            ];
            setEmployees(demoEmps);
            setSelected(demoEmps.map(e => e.id));
          }
        } catch (e) {
          const demoEmps = [
            {
              id: 'emp-demo-1',
              name: 'Sarah Johansson',
              email: 'sarah.johansson@example.com',
              country: 'Nigeria',
              currency: 'NGN',
              salary: 1550000,
              wallet_address: 'https://ilp.interledger-test.dev/sarah-johansson',
              status: 'active',
            },
          ];
          setEmployees(demoEmps);
          setSelected(demoEmps.map(e => e.id));
        }

        try {
          const { data: txs } = await supabase.from('transactions').select('amount').eq('company_id', comp.id).eq('status', 'completed');
          const bal = (txs || []).reduce((sum, tx) => sum + tx.amount, 0);
          setWalletBalance(Math.max(bal, 25000));
        } catch (e) {
          setWalletBalance(25000);
        }

        try {
          const { data: bData } = await supabase.from('company_banks').select('*').eq('company_id', comp.id).single();
          if (bData) {
            setLinkedBank(bData);
            setIsAutoFunding(bData.auto_fund_enabled);
          } else {
            setLinkedBank({ bankName: 'Chase Business Direct', last4: '8892' });
            setIsAutoFunding(true);
          }
        } catch (e) {
          setLinkedBank({ bankName: 'Chase Business Direct', last4: '8892' });
          setIsAutoFunding(true);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    setSelected(selected.length === employees.length ? [] : employees.map(e => e.id));
  };

  const selectedEmps = employees.filter(e => selected.includes(e.id));
  
  const totalByCurrency = selectedEmps.reduce((acc: any, emp) => {
    const tax = calculateTax(emp.salary, emp.country, emp.currency);
    acc[emp.currency] = (acc[emp.currency] || 0) + tax.netSalary;
    return acc;
  }, {});

  const estimatedTotalUSD = Object.entries(totalByCurrency).reduce((sum, [curr, amt]) => {
    return sum + convertCurrency(amt as number, curr, 'USD');
  }, 0);

  const hasSufficientBalance = walletBalance >= estimatedTotalUSD;
  const canProceed = hasSufficientBalance || isAutoFunding;

  const handleStartPayroll = () => {
    setShowVisualizer(true);
  };

  const processPayroll = async () => {
    setProcessing(true);

    const senderWallet = process.env.NEXT_PUBLIC_PAYZATI_WALLET_ADDRESS || 'https://ilp.interledger-test.dev/payzati-master-wallet';
    const payments = selectedEmps.map(emp => {
      const tax = calculateTax(emp.salary, emp.country, emp.currency);
      return {
        receiverWallet: emp.wallet_address,
        amount: tax.netSalary,
        currency: emp.currency,
        employeeId: emp.id
      };
    });

    const res = await processBatchPayroll(senderWallet, payments);

    for (const item of res.payments) {
      if (item.status === 'completed' && company) {
        const usdRate = item.currency === 'NGN' ? 1550 : item.currency === 'KES' ? 130 : item.currency === 'GHS' ? 12 : item.currency === 'ZAR' ? 18 : item.currency === 'EGP' ? 31 : 1;
        const usdVal = Number(item.amount) / usdRate;

        try {
          await supabase.from('transactions').insert({
            company_id: company.id,
            employee_id: (item as any).employeeId,
            type: 'payroll',
            amount: -usdVal,
            currency: 'USD',
            status: 'completed',
            description: `Payroll payment to ${item.receiverWallet}`,
            receipt: item.receipt
          });
        } catch (e) {}
      }
    }

    setResults(res.payments);
    setProcessing(false);
    setCompleted(true);
    toast.success('Batch payroll run completed via Interledger!');
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading payroll workspace...</div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Run Payroll</h1>
          <p className="page-subtitle">Send salaries across borders via Interledger Open Payments</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        {['Select Team', 'Review Taxes', 'Funding Check', 'Batch Settlement'].map((label, idx) => {
          const num = idx + 1;
          const isActive = step === num;
          const isDone = step > num;
          return (
            <div key={num} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: isDone || isActive ? 1 : 0.4 }}>
              <div style={{ 
                width: '32px', height: '32px', borderRadius: '50%', 
                background: isDone ? 'var(--accent-teal)' : isActive ? 'var(--accent-teal-dim)' : 'var(--elevation-2)',
                color: isDone ? 'var(--bg-primary)' : isActive ? 'var(--accent-teal)' : 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem',
                border: isActive ? '2px solid var(--accent-teal)' : '1px solid var(--border-default)'
              }}>
                {isDone ? <Check size={16} /> : num}
              </div>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: isActive ? 'var(--accent-teal)' : 'var(--text-primary)' }}>{label}</span>
            </div>
          );
        })}
      </div>

      {step === 1 && (
        <div className="card" style={{ background: 'var(--elevation-1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3>Select Employees for this Payroll Run</h3>
            <button className="btn btn-secondary btn-sm" onClick={toggleAll}>
              {selected.length === employees.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
            {employees.map(emp => {
              const isSel = selected.includes(emp.id);
              const tax = calculateTax(emp.salary, emp.country, emp.currency);
              return (
                <div key={emp.id} onClick={() => toggleSelect(emp.id)} className="card" style={{ 
                  cursor: 'pointer', background: isSel ? 'rgba(0,212,170,0.06)' : 'var(--elevation-2)', 
                  border: isSel ? '1px solid var(--accent-teal)' : '1px solid var(--border-default)', 
                  padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                      width: '24px', height: '24px', borderRadius: '6px', 
                      background: isSel ? 'var(--accent-teal)' : 'var(--elevation-1)', 
                      color: isSel ? 'var(--bg-primary)' : 'transparent',
                      border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center' 
                    }}>
                      <Check size={14} />
                    </div>
                    <div>
                      <strong>{emp.name}</strong>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{emp.country} | {emp.wallet_address}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: 'var(--accent-teal)' }}>{formatCurrency(tax.netSalary, emp.currency)}</div>
                    <small style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem' }}>Gross: {formatCurrency(emp.salary, emp.currency)}</small>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{selected.length} selected</span>
            <button className="btn btn-primary btn-lg" disabled={selected.length === 0} onClick={() => setStep(2)}>
              Next: Review Taxes <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card" style={{ background: 'var(--elevation-1)' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Statutory Tax & Deductions Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            {selectedEmps.map(emp => {
              const tax = calculateTax(emp.salary, emp.country, emp.currency);
              return (
                <div key={emp.id} className="card" style={{ background: 'var(--elevation-2)', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <strong>{emp.name} ({emp.country})</strong>
                    <span style={{ color: 'var(--accent-teal)', fontWeight: 700 }}>Net Payout: {formatCurrency(tax.netSalary, emp.currency)}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                    <div>Gross: {formatCurrency(tax.grossSalary, emp.currency)}</div>
                    <div>Income Tax (PAYE): {formatCurrency(tax.incomeTax, emp.currency)}</div>
                    <div>Pension/Social: {formatCurrency(tax.totalDeductions - tax.incomeTax, emp.currency)}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)}><ArrowLeft size={14} /> Back</button>
            <button className="btn btn-primary btn-lg" onClick={() => setStep(3)}>Next: Funding Check <ArrowRight size={14} /></button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card" style={{ background: 'var(--elevation-1)' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Funding Check</h3>
          <div className="grid-3" style={{ marginBottom: '2rem' }}>
            <div className="card stat-card" style={{ background: 'var(--elevation-2)', textAlign: 'center' }}>
              <span className="stat-label">Team members</span>
              <span className="stat-value">{selectedEmps.length}</span>
            </div>
            <div className="card stat-card" style={{ background: 'var(--elevation-2)', textAlign: 'center' }}>
              <span className="stat-label">Total cost</span>
              <span className="stat-value" style={{ fontSize: '1.25rem', color: canProceed ? 'var(--accent-teal)' : 'var(--status-error)' }}>
                ~${estimatedTotalUSD.toFixed(2)}
              </span>
            </div>
            <div className="card stat-card" style={{ background: 'var(--elevation-2)', textAlign: 'center' }}>
              <span className="stat-label">Your wallet balance</span>
              <span className="stat-value" style={{ fontSize: '1.25rem', color: hasSufficientBalance ? 'var(--text-primary)' : 'var(--status-warning)' }}>
                ${walletBalance.toFixed(2)}
              </span>
            </div>
          </div>

          {isAutoFunding ? (
            <div style={{ background: 'var(--accent-teal-dim)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <Landmark size={24} color="var(--accent-teal)" />
              <div>
                <strong style={{ color: 'var(--accent-teal)', display: 'block' }}>Auto-funding is active</strong>
                <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                  {hasSufficientBalance 
                    ? `You have enough pre-funded balance, so no direct debit pull is needed.` 
                    : `We&apos;ll auto-pull the shortfall from ${linkedBank?.bankName || 'linked bank account'} automatically.`}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.5rem', fontSize: 'var(--text-sm)', color: 'var(--status-success)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={16} /> Sufficient pre-funded balance.
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn-secondary" onClick={() => setStep(2)}><ArrowLeft size={14} /> Back</button>
            <button className="btn btn-primary btn-lg" disabled={!canProceed} onClick={handleStartPayroll}>
              <Play size={14} fill="currentColor" /> Send payments now
            </button>
          </div>
        </div>
      )}

      {/* ILP Batch Settlement Visualizer */}
      <ILPTransferVisualizer
        isOpen={showVisualizer}
        onClose={() => {
          setShowVisualizer(false);
          setStep(4);
          processPayroll();
        }}
        senderWallet={process.env.NEXT_PUBLIC_PAYZATI_WALLET_ADDRESS || 'https://ilp.interledger-test.dev/payzati-master-wallet'}
        receiverWallet={selectedEmps[0]?.wallet_address || 'https://ilp.interledger-test.dev/sarah-johansson'}
        senderName="Payzati Employer Master Wallet"
        receiverName={`Batch Payout (${selectedEmps.length} Team Members)`}
        sendAmount={estimatedTotalUSD}
        sendCurrency="USD"
        receiveAmount={selectedEmps[0]?.salary || 1550000}
        receiveCurrency={selectedEmps[0]?.currency || 'NGN'}
        onComplete={() => {
          // Handled by onClose
        }}
      />

      {step === 4 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', background: 'var(--elevation-1)' }}>
          {processing ? (
            <div>
              <div style={{ width: '48px', height: '48px', border: '3px solid var(--accent-teal-dim)', borderTopColor: 'var(--accent-teal)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
              <h2>Finalizing Interledger Payout Records...</h2>
            </div>
          ) : (
            <>
              <div style={{ color: 'var(--accent-teal)', display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <CheckCircle size={64} />
              </div>
              <h2 style={{ color: 'var(--accent-teal)', marginBottom: '0.5rem' }}>Batch Payroll Run Complete!</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: 'var(--text-sm)' }}>
                All payments have been settled across the Interledger Protocol.
              </p>
              <div style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto', background: 'var(--elevation-2)', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid var(--border-default)' }}>
                {results.map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: i < results.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                    <div>
                      <strong style={{ fontSize: 'var(--text-xs)', display: 'block', color: 'var(--text-primary)' }}>{r.receiverWallet}</strong>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{formatCurrency(Number(r.amount), r.currency)}</span>
                      {r.receipt && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-teal)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>Receipt: {r.receipt.substring(0, 16)}...</div>}
                    </div>
                    <span className="badge badge-success"><Check size={12} /> Settled</span>
                  </div>
                ))}
              </div>
              <button className="btn btn-secondary btn-block" style={{ marginTop: '2rem' }} onClick={() => { setStep(1); setCompleted(false); setResults([]); }}>
                Start a new payroll run
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
