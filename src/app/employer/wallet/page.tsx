'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/fx-engine';
import { Building2, Zap, Receipt, Lock, CheckCircle, X, ShieldAlert } from 'lucide-react';
import { getCompany } from '@/lib/supabase/queries';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function WalletPage() {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [bankDetails, setBankDetails] = useState({ routing: '', account: '' });
  const [linking, setLinking] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [linkedBank, setLinkedBank] = useState<any>(null);
  const [autoFund, setAutoFund] = useState(false);
  const supabase = createClient();
  const [companyId, setCompanyId] = useState<string | null>(null);

  const totalFunded = transactions.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
  const totalDisbursed = Math.abs(transactions.filter(t => t.amount < 0).reduce((s, t) => {
    let usdVal = t.amount;
    if (t.currency === 'NGN') usdVal = t.amount / 1550;
    else if (t.currency === 'KES') usdVal = t.amount / 130;
    else if (t.currency === 'GHS') usdVal = t.amount / 12;
    else if (t.currency === 'ZAR') usdVal = t.amount / 18;
    else if (t.currency === 'EGP') usdVal = t.amount / 31;
    return s + usdVal;
  }, 0));

  useEffect(() => {
    async function fetchWallet() {
      const company = await getCompany();
      if (company) {
        setCompanyId(company.id);
        const { data } = await supabase
          .from('transactions')
          .select('*')
          .eq('company_id', company.id)
          .order('date', { ascending: false });
        if (data) {
          setTransactions(data);
          const usdBalance = data.reduce((sum, tx) => {
            let usdVal = tx.amount;
            if (tx.currency === 'NGN') usdVal = tx.amount / 1550;
            else if (tx.currency === 'KES') usdVal = tx.amount / 130;
            else if (tx.currency === 'GHS') usdVal = tx.amount / 12;
            else if (tx.currency === 'ZAR') usdVal = tx.amount / 18;
            else if (tx.currency === 'EGP') usdVal = tx.amount / 31;
            return sum + usdVal;
          }, 0);
          setBalance(usdBalance);
        }

        // Fetch linked bank config
        const { data: configData } = await supabase
          .from('system_config')
          .select('value')
          .eq('key', `corp_bank_${company.id}`)
          .maybeSingle();

        if (configData) {
          setLinkedBank(configData.value);
          setAutoFund(configData.value.autoFund || false);
        }
      }
      setLoading(false);
    }
    fetchWallet();
  }, []);

  const handleLinkBank = async () => {
    if (!bankDetails.routing || !bankDetails.account) {
      toast.error('Please enter routing and account numbers');
      return;
    }
    setLinking(true);

    // Simulate Plaid/Stripe verification delay
    setTimeout(async () => {
      const newBank = {
        bankName: 'Chase Business',
        last4: bankDetails.account.slice(-4),
        autoFund: true
      };

      await supabase.from('system_config').upsert({
        key: `corp_bank_${companyId}`,
        value: newBank
      });

      setLinkedBank(newBank);
      setAutoFund(true);
      setShowLinkModal(false);
      setLinking(false);
      toast.success('Corporate bank account linked successfully!');
    }, 1500);
  };

  const toggleAutoFund = async () => {
    const newState = !autoFund;
    setAutoFund(newState);
    if (linkedBank) {
      const updated = { ...linkedBank, autoFund: newState };
      setLinkedBank(updated);
      await supabase.from('system_config').upsert({
        key: `corp_bank_${companyId}`,
        value: updated
      });
      toast.success(newState ? 'Auto-funding enabled' : 'Auto-funding disabled');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Funding &amp; Balances</h1>
          <p className="page-subtitle">Set up your payment routes and fund your wallet.</p>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ background: 'var(--elevation-1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your linked bank account</div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>Where we pull funds to pay your team</p>
            </div>
            <div style={{ color: 'var(--text-secondary)' }}><Building2 size={32} /></div>
          </div>
          
          {loading ? (
            <div className="skeleton" style={{ height: '60px', width: '100%', borderRadius: '8px' }}></div>
          ) : linkedBank ? (
            <div style={{ background: 'var(--elevation-2)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ display: 'block', fontSize: 'var(--text-sm)' }}>{linkedBank.bankName}</strong>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>•••• {linkedBank.last4}</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowLinkModal(true)}>Change account</button>
            </div>
          ) : (
            <button className="btn btn-primary btn-block" onClick={() => setShowLinkModal(true)}>
              Link a bank account
            </button>
          )}

          {linkedBank && (
            <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: autoFund ? 'var(--accent-teal-dim)' : 'var(--elevation-2)', border: `1px solid ${autoFund ? 'rgba(0,212,170,0.3)' : 'var(--border-subtle)'}`, borderRadius: 'var(--radius-md)' }}>
              <div>
                <strong style={{ display: 'block', color: autoFund ? 'var(--accent-teal)' : 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>Automatic payroll funding</strong>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>We&apos;ll pull the exact amount automatically whenever you run payroll so you don&apos;t have to pre-fund.</span>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                <input type="checkbox" checked={autoFund} onChange={toggleAutoFund} style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: autoFund ? 'var(--accent-teal)' : 'var(--border-default)', transition: '.4s', borderRadius: '34px' }}>
                  <span style={{ position: 'absolute', content: '""', height: '16px', width: '16px', left: autoFund ? '24px' : '4px', bottom: '4px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%' }}></span>
                </span>
              </label>
            </div>
          )}
        </div>

        <div className="card" style={{ background: 'var(--elevation-1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your prepay wallet</div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>Funds ready to go instantly</p>
            </div>
            <div style={{ color: 'var(--accent-teal)' }}><Zap size={32} /></div>
          </div>

          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
            {loading ? '-' : formatCurrency(balance, 'USD')}
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total paid out</div>
              <div style={{ fontWeight: 700 }}>{loading ? '-' : formatCurrency(totalDisbursed, 'USD')}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ background: 'var(--elevation-1)' }}>
        <h3 style={{ marginBottom: '1rem' }}>Your transaction history</h3>
        <table className="data-table">
          <thead><tr><th>Date</th><th>Description</th><th>Type</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>
            {loading ? (
              <>
                <tr><td colSpan={5}><div className="skeleton skeleton-row"></div></td></tr>
                <tr><td colSpan={5}><div className="skeleton skeleton-row"></div></td></tr>
                <tr><td colSpan={5}><div className="skeleton skeleton-row"></div></td></tr>
              </>
            ) :
              transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{textAlign:'center', padding:'4rem'}}>
                    <div style={{opacity:0.3,marginBottom:'1rem', display: 'flex', justifyContent: 'center'}}><Receipt size={48} /></div>
                    <h3 style={{color:'var(--text-secondary)'}}>No transactions yet. Any funds you move will show up here!</h3>
                  </td>
                </tr>
              ) :
              transactions.map((tx, i) => (
                <tr key={tx.id} className="animate-slide-up" style={{animationDelay: `${i * 0.05}s`, opacity: 0, animationFillMode: 'forwards'}}>
                  <td>{new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td>{tx.description}</td>
                  <td>
                    <span className={`badge ${tx.type === 'deposit' ? 'badge-success' : tx.type === 'payroll' ? 'badge-info' : 'badge-warning'}`}>
                      {tx.type === 'deposit' ? 'Auto-funded' : 'Sent payout'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: tx.amount > 0 ? 'var(--status-success)' : 'var(--text-primary)' }}>
                    {tx.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(tx.amount), tx.currency || 'USD')}
                  </td>
                  <td>
                    <span className="badge badge-success">
                      <CheckCircle size={12} style={{ marginRight: '4px' }} /> Complete
                    </span>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {showLinkModal && (
        <div className="modal-overlay" onClick={() => setShowLinkModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Link your bank account</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowLinkModal(false)}><X size={16} /></button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center', color: 'var(--text-primary)' }}><Building2 size={48} /></div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>Connect your bank account so we can automatically route payments to your team when you run payroll.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)' }}>Routing Number</label>
                <input
                  type="text"
                  placeholder="9 digit routing number"
                  value={bankDetails.routing}
                  onChange={e => setBankDetails({ ...bankDetails, routing: e.target.value })}
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)' }}>Account Number</label>
                <input
                  type="text"
                  placeholder="Account number"
                  value={bankDetails.account}
                  onChange={e => setBankDetails({ ...bankDetails, account: e.target.value })}
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
              </div>
            </div>

            <div style={{ background: 'var(--elevation-2)', padding: '1rem', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Lock size={24} color="var(--status-success)" />
              Don&apos;t worry, your bank details are completely encrypted and safe. We only pull funds when you tell us to run payroll.
            </div>

            <button className="btn btn-primary btn-lg btn-block" onClick={handleLinkBank} disabled={linking}>
              {linking ? 'Verifying Account...' : 'Connect bank account'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
