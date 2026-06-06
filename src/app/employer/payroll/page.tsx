'use client';

import { useState, useEffect } from 'react';
import { calculateTax } from '@/lib/tax-engine';
import { formatCurrency } from '@/lib/fx-engine';
import { createClient } from '@/lib/supabase/client';
import { getCompany } from '@/lib/supabase/queries';
import { processBatchPayroll, PaymentResult } from '@/lib/ilp/payments';
import toast from 'react-hot-toast';
import styles from './payroll.module.css';
import { 
  Users, 
  Globe, 
  Banknote, 
  Check, 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Landmark, 
  Play, 
  ArrowLeft, 
  ArrowRight,
  TrendingUp 
} from 'lucide-react';

// Circular Flag SVGs replacing emojis
function FlagNG({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ borderRadius: '50%', display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
      <circle cx="12" cy="12" r="12" fill="#008751" />
      <rect x="8" y="0" width="8" height="24" fill="#FFFFFF" />
    </svg>
  );
}

function FlagKE({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ borderRadius: '50%', display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
      <circle cx="12" cy="12" r="12" fill="#000000" />
      <rect x="0" y="6" width="24" height="12" fill="#FF0000" />
      <rect x="0" y="12" width="24" height="6" fill="#006600" />
      <path d="M10 12 L12 8 L14 12 L12 16 Z" fill="#FFFFFF" />
    </svg>
  );
}

function FlagGH({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ borderRadius: '50%', display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
      <circle cx="12" cy="12" r="12" fill="#E2231A" />
      <rect x="0" y="8" width="24" height="16" fill="#FCD116" />
      <rect x="0" y="16" width="24" height="8" fill="#006B3F" />
      <polygon points="12,10 13.5,13 16.5,13 14,15 15,18 12,16 9,18 10,15 7.5,13 10.5,13" fill="#000000" />
    </svg>
  );
}

function FlagZA({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ borderRadius: '50%', display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
      <circle cx="12" cy="12" r="12" fill="#007C5C" />
      <path d="M0,0 L12,12 L0,24 Z" fill="#E23D28" />
      <path d="M0,0 L12,12 L0,24 Z" fill="#002395" />
      <polygon points="0,0 8,12 0,24" fill="#FFFFFF" />
      <polygon points="0,2 6,12 0,22" fill="#000000" />
      <polygon points="0,8 3,12 0,16" fill="#FCD116" />
    </svg>
  );
}

function FlagEG({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ borderRadius: '50%', display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
      <circle cx="12" cy="12" r="12" fill="#C8102E" />
      <rect x="0" y="8" width="24" height="8" fill="#FFFFFF" />
      <rect x="0" y="16" width="24" height="8" fill="#000000" />
    </svg>
  );
}

export default function PayrollPage() {
  const [step, setStep] = useState(1);
  const [employees, setEmployees] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [linkedBank, setLinkedBank] = useState<any>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [results, setResults] = useState<PaymentResult[]>([]);
  const [balanceError, setBalanceError] = useState('');
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const company = await getCompany();
      if (company) {
        setCompanyId(company.id);
        const { data: empData } = await supabase.from('employees').select('*').eq('company_id', company.id).eq('status', 'active');
        if (empData) {
          setEmployees(empData);
          setSelected(empData.map((e: any) => e.id));
        }
        // Fetch wallet balance
        const { data: txData } = await supabase.from('transactions').select('amount, currency').eq('company_id', company.id).eq('status', 'completed');
        if (txData) {
          const usdBalance = txData.reduce((sum, tx) => {
            let usdVal = tx.amount;
            if (tx.currency === 'NGN') usdVal = tx.amount / 1550;
            else if (tx.currency === 'KES') usdVal = tx.amount / 130;
            else if (tx.currency === 'GHS') usdVal = tx.amount / 12;
            else if (tx.currency === 'ZAR') usdVal = tx.amount / 18;
            else if (tx.currency === 'EGP') usdVal = tx.amount / 31;
            return sum + usdVal;
          }, 0);
          setWalletBalance(usdBalance);
        }
        // Fetch bank config
        const { data: configData } = await supabase.from('system_config').select('value').eq('key', `corp_bank_${company.id}`).maybeSingle();
        if (configData) {
          setLinkedBank(configData.value);
        }
      }
    }
    load();
  }, []);

  const selectedEmps = employees.filter(e => selected.includes(e.id));
  const taxBreakdowns = selectedEmps.map(e => ({
    ...e,
    tax: calculateTax(e.salary, e.country, e.currency),
  }));

  const estimatedTotalUSD = taxBreakdowns.reduce((sum, e) =>
    sum + (e.tax.netSalary / (e.currency === 'NGN' ? 1550 : e.currency === 'KES' ? 130 : e.currency === 'GHS' ? 12 : e.currency === 'ZAR' ? 18 : e.currency === 'EGP' ? 31 : 1))
  , 0);
  
  const isAutoFunding = linkedBank?.autoFund;
  const hasSufficientBalance = walletBalance >= estimatedTotalUSD;
  const canProceed = isAutoFunding || hasSufficientBalance;

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const getFlag = (country: string) => {
    switch(country.toLowerCase()) {
      case 'nigeria': return <FlagNG />;
      case 'kenya': return <FlagKE />;
      case 'ghana': return <FlagGH />;
      case 'south africa': return <FlagZA />;
      case 'egypt': return <FlagEG />;
      default: return <Globe size={14} color="var(--text-secondary)" style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'middle' }} />;
    }
  };

  const processPayroll = async () => {
    setBalanceError('');
    setProcessing(true);

    if (!canProceed) {
      setBalanceError(`Insufficient balance. You need ~$${estimatedTotalUSD.toFixed(2)} but only have $${walletBalance.toFixed(2)}. Please fund your wallet first.`);
      setProcessing(false);
      setStep(3);
      return;
    }

    const senderWallet = process.env.NEXT_PUBLIC_PAYZATI_WALLET_ADDRESS || 'https://ilp.interledger-test.dev/a5cb6a41';

    const paymentsToProcess = taxBreakdowns.map(e => ({
      receiverWallet: e.wallet_address || `https://ilp.interledger-test.dev/${e.name.toLowerCase().replace(/\s/g, '-')}`,
      amount: e.tax.netSalary,
      currency: e.currency,
      employeeId: e.id
    }));

    const result = await processBatchPayroll(senderWallet, paymentsToProcess);
    
    if (companyId) {
      const totalUSD = paymentsToProcess.reduce((sum, p) => sum + (p.amount / (p.currency === 'NGN' ? 1550 : 1)), 0);
      
      const { data: pr } = await supabase.from('payroll_runs').insert({
        company_id: companyId,
        total_gross: totalUSD * 1.2,
        total_net: totalUSD,
        status: 'completed'
      }).select().single();

      if (pr) {
        let txsToInsert = [];
        if (isAutoFunding && !hasSufficientBalance) {
          const shortfall = estimatedTotalUSD - walletBalance;
          txsToInsert.push({
            company_id: companyId,
            type: 'deposit',
            amount: shortfall,
            currency: 'USD',
            status: 'completed',
            description: `Auto-Fund Direct Debit - ${linkedBank.bankName}`
          });
        }

        const payoutTxs = result.payments.map(p => {
          const emp = taxBreakdowns.find(e => e.wallet_address === p.receiverWallet || e.id === paymentsToProcess.find(pt => pt.receiverWallet === p.receiverWallet)?.employeeId);
          return {
            company_id: companyId,
            employee_id: emp?.id,
            type: 'payroll',
            amount: -parseFloat(p.amount),
            currency: p.currency,
            status: p.status,
            description: `Salary Payment - ${emp?.name || 'Employee'}`,
            receipt: p.receipt
          };
        });

        txsToInsert = [...txsToInsert, ...payoutTxs];
        await supabase.from('transactions').insert(txsToInsert);
      }
    }

    setResults(result.payments);
    setProcessing(false);
    setCompleted(true);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Run Payroll</h1>
          <p className="page-subtitle">
            {step === 1 && 'Who are we paying today? Select your team members below.'}
            {step === 2 && 'Here&apos;s the breakdown of taxes and what everyone takes home.'}
            {step === 3 && 'Let&apos;s make sure we&apos;ve got enough funds ready to go.'}
            {step === 4 && (completed ? 'All done! Payments have been sent.' : 'Sending payments now...')}
          </p>
        </div>
        <div className={styles.steps}>
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`${styles.stepDot} ${step >= s ? styles.stepActive : ''}`}>{s}</div>
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="card" style={{ background: 'var(--elevation-1)' }}>
          <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
            <h3>Select team members ({selected.length}/{employees.length})</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelected(selected.length === employees.length ? [] : employees.map(e => e.id))}>
              {selected.length === employees.length ? 'Deselect all' : 'Select all'}
            </button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>Employee</th>
                <th>Country</th>
                <th>Monthly Salary</th>
                <th>Wallet Rail</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{textAlign:'center', padding:'3rem'}}>
                    <div style={{ opacity: 0.3, marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}><Users size={48} /></div>
                    <p style={{color: 'var(--text-secondary)'}}>No active team members found. Go to the Roster page to add some!</p>
                  </td>
                </tr>
              ) : employees.map(emp => (
                <tr key={emp.id} onClick={() => toggleSelect(emp.id)} style={{ cursor: 'pointer' }}>
                  <td onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selected.includes(emp.id)} onChange={() => toggleSelect(emp.id)} />
                  </td>
                  <td><strong>{emp.name}</strong></td>
                  <td>{getFlag(emp.country)} {emp.country}</td>
                  <td style={{ fontWeight: 700 }}>{formatCurrency(emp.salary, emp.currency)}</td>
                  <td style={{fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)'}}>{emp.wallet_address}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
            <button className="btn btn-primary" disabled={selected.length === 0} onClick={() => setStep(2)}>
              Review tax breakdown <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card" style={{ background: 'var(--elevation-1)' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Tax &amp; Net Payout Details</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Gross pay</th>
                  <th>Income tax</th>
                  <th>Social security</th>
                  <th>Total deductions</th>
                  <th>Take-home pay</th>
                </tr>
              </thead>
              <tbody>
                {taxBreakdowns.map(t => (
                  <tr key={t.id}>
                    <td>
                      <strong>{t.name}</strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        {getFlag(t.country)} <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>{t.country}</span>
                      </div>
                    </td>
                    <td>{formatCurrency(t.tax.grossSalary, t.currency)}</td>
                    <td style={{ color: 'var(--status-warning)' }}>{formatCurrency(t.tax.incomeTax, t.currency)}</td>
                    <td style={{ color: 'var(--status-warning)' }}>{formatCurrency(t.tax.socialContributions.reduce((s: number, c: any) => s + c.amount, 0), t.currency)}</td>
                    <td style={{ color: 'var(--status-error)' }}>{formatCurrency(t.tax.totalDeductions, t.currency)}</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-teal)' }}>{formatCurrency(t.tax.netSalary, t.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)}><ArrowLeft size={14} /> Back</button>
            <button className="btn btn-primary" onClick={() => setStep(3)}>Check funding <ArrowRight size={14} /></button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card" style={{ background: 'var(--elevation-1)' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Funding Check</h3>
          <div className="grid-3" style={{ marginBottom: '2rem' }}>
            <div className="card stat-card" style={{ background: 'var(--elevation-2)', textAlign: 'center' }}>
              <span className="stat-label">Team members being paid</span>
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

          {/* Auto-Funding Context */}
          {isAutoFunding ? (
            <div style={{ background: 'var(--accent-teal-dim)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <Landmark size={24} color="var(--accent-teal)" />
              <div>
                <strong style={{ color: 'var(--accent-teal)', display: 'block' }}>Auto-funding is active</strong>
                <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                  {hasSufficientBalance 
                    ? `You have enough funds in your wallet, so we won&apos;t need to pull from ${linkedBank.bankName}.` 
                    : `We&apos;ll pull the shortfall of $${(estimatedTotalUSD - walletBalance).toFixed(2)} from your bank account (${linkedBank.bankName} ending in ${linkedBank.last4}) automatically to cover this payroll.`}
                </span>
              </div>
            </div>
          ) : !hasSufficientBalance ? (
            /* Warning */
            <div style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <AlertCircle size={24} color="var(--status-error)" />
              <div>
                <strong style={{ color: 'var(--status-error)' }}>A bit short on funds</strong>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: '2px' }}>
                  This payroll run needs <strong>${estimatedTotalUSD.toFixed(2)}</strong>, but your wallet only has <strong>${walletBalance.toFixed(2)}</strong>.
                  Please connect a bank account for auto-funding or add some funds.
                </p>
              </div>
              <a href="/employer/wallet" className="btn btn-primary btn-sm" style={{ marginLeft: 'auto', flexShrink: 0 }}>Deposit</a>
            </div>
          ) : (
            <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.5rem', fontSize: 'var(--text-sm)', color: 'var(--status-success)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={16} /> Perfect! You&apos;ve got enough pre-funded balance. Payments will send instantly.
            </div>
          )}

          {balanceError && (
            <div style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.5rem', color: 'var(--status-error)', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} /> Looks like you&apos;re a bit short on funds. Please top up your wallet!
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn-secondary" onClick={() => setStep(2)}><ArrowLeft size={14} /> Back</button>
            <button
              className="btn btn-primary btn-lg"
              disabled={!canProceed}
              onClick={() => { 
                if (!canProceed) {
                  setBalanceError('Looks like you&apos;re a bit short on funds. Please top up your wallet!');
                  toast.error('Insufficient funds.');
                  return;
                }
                setStep(4); processPayroll(); 
              }}
            >
              <Play size={14} fill="currentColor" /> Send payments now
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', background: 'var(--elevation-1)' }}>
          {processing ? (
            <>
              <div className={styles.processingViz}>
                <div className={styles.packetAnim}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={styles.packet} style={{ animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
              </div>
              <h2 style={{ marginBottom: '0.5rem' }}>
                {isAutoFunding && !hasSufficientBalance ? 'Pulling funds and sending payments...' : 'Sending payments instantly...'}
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: 'var(--text-sm)' }}>
                Sending funds securely across the network...
              </p>
            </>
          ) : (
            <>
              <div style={{ color: 'var(--accent-teal)', display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <CheckCircle size={64} />
              </div>
              <h2 style={{ color: 'var(--accent-teal)', marginBottom: '0.5rem' }}>All Done!</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: 'var(--text-sm)' }}>
                All payments have been successfully sent to your team!
              </p>
              <div style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto', background: 'var(--elevation-2)', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid var(--border-default)' }}>
                {results.map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: i < results.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                    <div>
                      <strong style={{ fontSize: 'var(--text-xs)', display: 'block', color: 'var(--text-primary)' }}>{r.receiverWallet}</strong>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{formatCurrency(Number(r.amount), r.currency)}</span>
                      {r.receipt && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>Receipt ID: {r.receipt.substring(0, 16)}...</div>}
                    </div>
                    <span className="badge badge-success">
                      <Check size={12} /> Settled
                    </span>
                  </div>
                ))}
              </div>
              <button className="btn btn-secondary btn-block" style={{ marginTop: '2rem' }} onClick={() => { setStep(1); setCompleted(false); setResults([]); setSelected([]); }}>
                Start a new payroll run
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
