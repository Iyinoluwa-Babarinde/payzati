'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatCurrency } from '@/lib/fx-engine';
import {
  Building2, Zap, Receipt, Lock, CheckCircle, X,
  CalendarClock, RefreshCw, ChevronRight, Landmark,
} from 'lucide-react';
import { getCompany } from '@/lib/supabase/queries';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

// ─── helpers ────────────────────────────────────────────────────────────────
function nextFirstOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

function daysUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ── Component ────────────────────────────────────────────────────────────────
export default function WalletPage() {
  const [showLinkModal, setShowLinkModal]       = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount]       = useState('');
  const [depositCurrency, setDepositCurrency]   = useState('USD');
  const [depositing, setDepositing]             = useState(false);
  const [bankDetails, setBankDetails]           = useState({ account: '' });
  const [linking, setLinking]                   = useState(false);
  const [transactions, setTransactions]         = useState<any[]>([]);
  const [balance, setBalance]                   = useState(0);
  const [loading, setLoading]                   = useState(true);
  const [linkedBank, setLinkedBank]             = useState<any>(null);
  const [autoFund, setAutoFund]                 = useState(false);
  const [companyId, setCompanyId]               = useState<string | null>(null);
  const [pullSchedule, setPullSchedule]         = useState<any>(null);
  const [triggeringPull, setTriggeringPull]     = useState(false);

  const supabase = createClient();

  const toUSD = (amount: number, currency: string) => {
    const FX: Record<string, number> = {
      USD: 1, EUR: 1.08, GBP: 1.27,
      NGN: 1 / 1550, KES: 1 / 130,
      GHS: 1 / 12, ZAR: 1 / 18, EGP: 1 / 31,
    };
    return amount * (FX[currency] ?? 1);
  };

  const totalFunded   = transactions.filter(t => t.type === 'deposit').reduce((s, t) => s + toUSD(t.amount, t.currency), 0);
  const totalDisbursed = Math.abs(transactions.filter(t => t.amount < 0).reduce((s, t) => s + toUSD(t.amount, t.currency), 0));

  const fetchWallet = useCallback(async () => {
    const company = await getCompany();
    if (!company) { setLoading(false); return; }
    setCompanyId(company.id);

    // transactions
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('company_id', company.id)
      .order('date', { ascending: false });

    if (data) {
      setTransactions(data);
      setBalance(data.reduce((sum, tx) => sum + toUSD(tx.amount, tx.currency ?? 'USD'), 0));
    }

    // bank config
    const { data: configData } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', `corp_bank_${company.id}`)
      .maybeSingle();

    if (configData) {
      setLinkedBank(configData.value);
      setAutoFund(configData.value.autoFund ?? false);
    }

    // pull schedule
    const res = await fetch(`/api/cron/monthly-pull?companyId=${company.id}`);
    const json = await res.json();
    setPullSchedule(json.schedule);

    setLoading(false);
  }, []);

  useEffect(() => { fetchWallet(); }, [fetchWallet]);

  // ── Link bank ──────────────────────────────────────────────────────────────
  const handleLinkBank = async () => {
    if (!bankDetails.account) {
      toast.error('Please enter your account number.');
      return;
    }
    setLinking(true);
    setTimeout(async () => {
      const newBank = {
        bankName: 'Chase Business',
        last4: bankDetails.account.slice(-4),
        autoFund: true,
      };

      await supabase.from('system_config').upsert({
        key: `corp_bank_${companyId}`,
        value: newBank,
      });

      // Seed pull schedule on first link
      const next = nextFirstOfMonth();
      await supabase.from('system_config').upsert({
        key: `corp_pull_schedule_${companyId}`,
        value: {
          lastPull: null,
          nextPull: next.toISOString(),
          lastAmount: null,
          bankName: newBank.bankName,
          last4: newBank.last4,
        },
      });

      setLinkedBank(newBank);
      setAutoFund(true);
      setPullSchedule({ nextPull: next.toISOString(), bankName: newBank.bankName, last4: newBank.last4, lastPull: null, lastAmount: null });
      setShowLinkModal(false);
      setLinking(false);
      setBankDetails({ account: '' });
      toast.success('Bank account linked — monthly auto-pull is live!');
    }, 1800);
  };

  // ── Manual deposit ─────────────────────────────────────────────────────────
  const handleDeposit = async () => {
    if (!depositAmount || isNaN(Number(depositAmount)) || Number(depositAmount) <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }
    setDepositing(true);

    const { error } = await supabase.from('transactions').insert({
      company_id: companyId,
      type: 'deposit',
      amount: Number(depositAmount),
      currency: depositCurrency,
      status: 'completed',
      description: 'Manual Wallet Top-Up',
    });

    if (error) {
      toast.error('Deposit failed: ' + error.message);
    } else {
      toast.success(`${formatCurrency(Number(depositAmount), depositCurrency)} added to your wallet!`);
      setShowDepositModal(false);
      setDepositAmount('');
      await fetchWallet();
    }
    setDepositing(false);
  };

  // ── Toggle auto-fund ───────────────────────────────────────────────────────
  const toggleAutoFund = async () => {
    const next = !autoFund;
    setAutoFund(next);
    if (linkedBank) {
      const updated = { ...linkedBank, autoFund: next };
      setLinkedBank(updated);
      await supabase.from('system_config').upsert({
        key: `corp_bank_${companyId}`,
        value: updated,
      });
      toast.success(next ? 'Monthly auto-pull enabled — we\'ve got you covered.' : 'Auto-pull paused.');
    }
  };

  // ── Trigger manual pull now (demo) ────────────────────────────────────────
  const triggerPullNow = async () => {
    setTriggeringPull(true);
    toast.loading('Pulling funds via ILP…', { id: 'pull' });
    try {
      const res = await fetch('/api/cron/monthly-pull', { method: 'POST' });
      const json = await res.json();
      toast.dismiss('pull');
      if (res.ok) {
        toast.success('Funds pulled successfully!');
        await fetchWallet();
      } else {
        toast.error(json.error ?? 'Pull failed.');
      }
    } catch (e: any) {
      toast.dismiss('pull');
      toast.error('Network error during pull.');
    }
    setTriggeringPull(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Funding &amp; Balances</h1>
          <p className="page-subtitle">Set up your payment routes and keep your team paid without lifting a finger.</p>
        </div>
      </div>

      {/* ── Top two-column cards ──────────────────────────────────────────── */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>

        {/* Bank card */}
        <div className="card" style={{ background: 'var(--elevation-1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Linked bank account
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                Where we pull from to pay your team
              </p>
            </div>
            <div style={{ color: 'var(--text-secondary)' }}><Building2 size={32} /></div>
          </div>

          {loading ? (
            <div className="skeleton" style={{ height: '60px', width: '100%', borderRadius: '8px' }} />
          ) : linkedBank ? (
            <div style={{
              background: 'var(--elevation-2)', border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)', padding: '1rem',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <strong style={{ display: 'block', fontSize: 'var(--text-sm)' }}>{linkedBank.bankName}</strong>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>
                  •••• {linkedBank.last4}
                </span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowLinkModal(true)}>Change</button>
            </div>
          ) : (
            <button className="btn btn-primary btn-block" onClick={() => setShowLinkModal(true)}>
              Link a bank account
            </button>
          )}

          {/* Auto-fund toggle */}
          {linkedBank && (
            <div style={{
              marginTop: '1.5rem', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', padding: '1rem',
              background: autoFund ? 'var(--accent-teal-dim)' : 'var(--elevation-2)',
              border: `1px solid ${autoFund ? 'rgba(0,212,170,0.3)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-md)',
            }}>
              <div>
                <strong style={{ display: 'block', color: autoFund ? 'var(--accent-teal)' : 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>
                  Monthly auto-pull
                </strong>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  {autoFund
                    ? 'We pull the exact payroll amount on the 1st of each month — no action needed.'
                    : 'Turn this on and we handle funding automatically every month.'}
                </span>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', flexShrink: 0, marginLeft: '1rem' }}>
                <input type="checkbox" checked={autoFund} onChange={toggleAutoFund} style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{
                  position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: autoFund ? 'var(--accent-teal)' : 'var(--border-default)',
                  transition: '.3s', borderRadius: '34px',
                }}>
                  <span style={{
                    position: 'absolute', height: '16px', width: '16px',
                    left: autoFund ? '24px' : '4px', bottom: '4px',
                    backgroundColor: 'white', transition: '.3s', borderRadius: '50%',
                  }} />
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Wallet balance card */}
        <div className="card" style={{ background: 'var(--elevation-1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Prepay wallet
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                Funds ready to fly out instantly
              </p>
            </div>
            <div style={{ color: 'var(--accent-teal)' }}><Zap size={32} /></div>
          </div>

          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            {loading ? '–' : formatCurrency(balance, 'USD')}
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Funded</div>
              <div style={{ fontWeight: 700, color: 'var(--status-success)', fontSize: 'var(--text-sm)' }}>
                {loading ? '–' : formatCurrency(totalFunded, 'USD')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Paid out</div>
              <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                {loading ? '–' : formatCurrency(totalDisbursed, 'USD')}
              </div>
            </div>
          </div>

          <button className="btn btn-primary btn-block" onClick={() => setShowDepositModal(true)}>
            Top up wallet
          </button>
        </div>
      </div>

      {/* ── Monthly pull schedule banner ────────────────────────────────────── */}
      {autoFund && pullSchedule && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(0,212,170,0.08) 0%, rgba(0,212,170,0.03) 100%)',
          border: '1px solid rgba(0,212,170,0.2)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          flexWrap: 'wrap',
        }}>
          <div style={{ color: 'var(--accent-teal)', flexShrink: 0 }}>
            <CalendarClock size={36} />
          </div>

          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ fontWeight: 700, color: 'var(--accent-teal)', fontSize: 'var(--text-sm)', marginBottom: '0.25rem' }}>
              Next automated pull
            </div>
            <div style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text-primary)' }}>
              {formatDate(pullSchedule.nextPull)}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              {daysUntil(pullSchedule.nextPull)} days away · from {pullSchedule.bankName} ••••{pullSchedule.last4}
            </div>
          </div>

          {pullSchedule.lastPull && (
            <div style={{ textAlign: 'right', minWidth: '160px' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Last pull</div>
              <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                {pullSchedule.lastAmount ? formatCurrency(pullSchedule.lastAmount, 'USD') : '–'}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                {formatDate(pullSchedule.lastPull)}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexShrink: 0 }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={triggerPullNow}
              disabled={triggeringPull}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <RefreshCw size={14} style={{ animation: triggeringPull ? 'spin 1s linear infinite' : 'none' }} />
              {triggeringPull ? 'Pulling…' : 'Pull now'}
            </button>
          </div>
        </div>
      )}

      {/* If bank linked but auto-fund off — show a nudge banner */}
      {linkedBank && !autoFund && (
        <div style={{
          background: 'rgba(255,184,0,0.06)',
          border: '1px solid rgba(255,184,0,0.2)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}>
          <Landmark size={24} color="var(--accent-gold)" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <strong style={{ color: 'var(--accent-gold)', display: 'block', fontSize: 'var(--text-sm)' }}>
              Auto-pull is off
            </strong>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              Enable monthly auto-pull and Payzati will handle funding on the 1st of every month — so payroll is never held up by a missing top-up.
            </span>
          </div>
          <button className="btn btn-sm" style={{ background: 'var(--accent-gold)', color: '#000', fontWeight: 700, flexShrink: 0 }} onClick={toggleAutoFund}>
            Enable <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* ── Transaction history ─────────────────────────────────────────────── */}
      <div className="card" style={{ background: 'var(--elevation-1)' }}>
        <h3 style={{ marginBottom: '1rem' }}>Transaction history</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <>
                <tr><td colSpan={5}><div className="skeleton skeleton-row" /></td></tr>
                <tr><td colSpan={5}><div className="skeleton skeleton-row" /></td></tr>
                <tr><td colSpan={5}><div className="skeleton skeleton-row" /></td></tr>
              </>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '4rem' }}>
                  <div style={{ opacity: 0.3, marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}><Receipt size={48} /></div>
                  <h3 style={{ color: 'var(--text-secondary)' }}>Nothing here yet — once funds move, you'll see the whole story.</h3>
                </td>
              </tr>
            ) : transactions.map((tx, i) => (
              <tr key={tx.id} className="animate-slide-up" style={{ animationDelay: `${i * 0.04}s`, opacity: 0, animationFillMode: 'forwards' }}>
                <td>{new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                <td>{tx.description}</td>
                <td>
                  <span className={`badge ${tx.type === 'deposit' ? 'badge-success' : tx.type === 'payroll' ? 'badge-info' : 'badge-warning'}`}>
                    {tx.type === 'deposit' ? (tx.description?.includes('Auto') ? 'Auto-pull' : 'Top-up') : 'Payout'}
                  </span>
                </td>
                <td style={{ fontWeight: 700, color: tx.amount > 0 ? 'var(--status-success)' : 'var(--text-primary)' }}>
                  {tx.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(tx.amount), tx.currency || 'USD')}
                </td>
                <td>
                  <span className="badge badge-success">
                    <CheckCircle size={12} style={{ marginRight: '4px' }} /> Done
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Link bank modal ───────────────────────────────────────────────── */}
      {showLinkModal && (
        <div className="modal-overlay" onClick={() => setShowLinkModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Connect your bank</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowLinkModal(false)}><X size={16} /></button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center', color: 'var(--text-primary)' }}>
                <Building2 size={48} />
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                Connect once and we'll automatically pull exactly what's needed every month — so payroll runs without you having to pre-load anything.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Account number
                </label>
                <input
                  type="text"
                  placeholder="Your bank account number"
                  value={bankDetails.account}
                  onChange={e => setBankDetails({ ...bankDetails, account: e.target.value })}
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
              </div>
            </div>

            <div style={{
              background: 'var(--elevation-2)', padding: '1rem',
              border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-xs)', color: 'var(--text-secondary)',
              marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
            }}>
              <Lock size={20} color="var(--status-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>Your bank credentials are encrypted end-to-end. We only ever pull funds when payroll is due — and we'll always notify you first.</span>
            </div>

            {/* Monthly pull explainer */}
            <div style={{
              background: 'var(--accent-teal-dim)', padding: '1rem',
              border: '1px solid rgba(0,212,170,0.2)', borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-xs)', color: 'var(--text-secondary)',
              marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
            }}>
              <CalendarClock size={20} color="var(--accent-teal)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>
                <strong style={{ color: 'var(--accent-teal)', display: 'block', marginBottom: '2px' }}>How monthly pulls work</strong>
                On the 1st of each month, Payzati computes your total payroll and pulls any shortfall directly via the Interledger network. You stay in control — pause any time.
              </span>
            </div>

            <button className="btn btn-primary btn-lg btn-block" onClick={handleLinkBank} disabled={linking}>
              {linking ? 'Verifying & linking…' : 'Connect bank account'}
            </button>
          </div>
        </div>
      )}

      {/* ── Deposit modal ────────────────────────────────────────────────── */}
      {showDepositModal && (
        <div className="modal-overlay" onClick={() => setShowDepositModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Top up your wallet</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowDepositModal(false)}><X size={16} /></button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center', color: 'var(--accent-teal)' }}><Zap size={48} /></div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                Load up your Payzati wallet and push payouts to your global team in seconds.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)' }}>Amount</label>
                <input type="number" placeholder="e.g. 5000" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)' }}>Currency</label>
                <select value={depositCurrency} onChange={e => setDepositCurrency(e.target.value)} style={{
                  width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)', background: 'var(--elevation-2)',
                  color: 'var(--text-primary)', outline: 'none', cursor: 'pointer',
                }}>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="KES">KES (Sh)</option>
                  <option value="NGN">NGN (₦)</option>
                  <option value="GHS">GHS (₵)</option>
                  <option value="ZAR">ZAR (R)</option>
                </select>
              </div>
            </div>

            <div style={{
              background: 'var(--elevation-2)', padding: '1rem',
              border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-xs)', color: 'var(--text-secondary)',
              marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center',
            }}>
              <Lock size={24} color="var(--status-success)" />
              Routed directly through the Interledger network — no extra fees, instant settlement.
            </div>

            <button className="btn btn-primary btn-lg btn-block" onClick={handleDeposit} disabled={depositing}>
              {depositing ? 'Processing…' : 'Confirm deposit'}
            </button>
          </div>
        </div>
      )}

      {/* spin keyframe for the pull-now button */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
