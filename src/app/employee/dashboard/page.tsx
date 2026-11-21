'use client';

import { useState, useEffect } from 'react';
import { formatCurrency, convertCurrency } from '@/lib/fx-engine';
import { getEmployeeProfile } from '@/lib/supabase/queries';
import { createClient } from '@/lib/supabase/client';
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Fingerprint,
  Pencil,
  Receipt,
  Sparkles,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import ILPTransferVisualizer from '@/components/ILPTransferVisualizer';

export default function EmployeeDashboard() {
  const [employee, setEmployee] = useState<any>({
    id: 'demo-emp',
    name: 'Tunde Adeyemi',
    company_name: 'Payzati Global Inc.',
    salary: 850000,
    currency: 'NGN',
    wallet_address: 'https://ilp.interledger-test.dev/da071cb6',
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [withdrawnThisMonth, setWithdrawnThisMonth] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState(50000);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingWallet, setEditingWallet] = useState(false);
  const [receiverWalletInput, setReceiverWalletInput] = useState('');
  const [expandedReceiptId, setExpandedReceiptId] = useState<string | null>(null);
  const supabase = createClient();

  const loadData = async () => {
    setLoading(true);
    const emp = await getEmployeeProfile();
    const resolvedEmp = emp
      ? {
          ...emp,
          company_name: emp.companies?.name || 'Payzati Global Inc.',
          wallet_address: emp.wallet_address || 'https://ilp.interledger-test.dev/da071cb6',
        }
      : {
          id: 'demo-emp',
          name: 'Tunde Adeyemi',
          company_name: 'Payzati Global Inc.',
          salary: 850000,
          currency: 'NGN',
          wallet_address: 'https://ilp.interledger-test.dev/da071cb6',
        };

    setEmployee(resolvedEmp);
    setReceiverWalletInput(resolvedEmp.wallet_address);

    if (emp) {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      try {
        const { data: txs } = await supabase
          .from('transactions')
          .select('*')
          .eq('employee_id', emp.id)
          .order('created_at', { ascending: false });

        if (txs && txs.length > 0) {
          setTransactions(txs);
          const monthlyWithdrawn = txs
            .filter(
              (t: any) =>
                t.type === 'withdrawal' &&
                t.status === 'completed' &&
                new Date(t.created_at || t.date) >= new Date(firstDayOfMonth)
            )
            .reduce((sum: number, t: any) => sum + Math.abs(Number(t.amount)), 0);
          setWithdrawnThisMonth(monthlyWithdrawn);
        } else {
          setTransactions([]);
          setWithdrawnThisMonth(0);
        }
      } catch {
        setTransactions([]);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveWallet = async () => {
    const trimmed = receiverWalletInput.trim();
    if (!trimmed) {
      toast.error('Please enter a valid receiving wallet address.');
      return;
    }
    setEmployee((prev: any) => ({ ...prev, wallet_address: trimmed }));
    setEditingWallet(false);

    if (employee?.id && employee.id !== 'demo-emp') {
      try {
        await supabase.from('employees').update({ wallet_address: trimmed }).eq('id', employee.id);
      } catch {
        // Non-blocking if demo session
      }
    }
    toast.success('Receiving account updated.');
  };

  const handleWithdraw = () => {
    if (withdrawAmount <= 0 || withdrawAmount > availableWages) {
      toast.error('Please choose an amount within your available earnings.');
      return;
    }
    setShowVisualizer(true);
  };

  const handleVisualizerComplete = async () => {
    const senderWallet = process.env.NEXT_PUBLIC_PAYZATI_WALLET_ADDRESS || 'https://ilp.interledger-test.dev/da071cb6';
    const targetWallet = employee.wallet_address || senderWallet;
    const amountToWithdraw = Math.min(withdrawAmount, availableWages);

    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderWallet,
        receiverWallet: targetWallet,
        amount: Math.max(1, Math.round(convertCurrency(amountToWithdraw, employee.currency || 'NGN', 'EUR'))),
        currency: 'EUR',
      }),
    });

    const data = await res.json();
    const result = data?.result;

    const newTx = {
      id: result?.id || `tx_${Date.now()}`,
      company_id: employee.company_id || 'demo-company-id',
      employee_id: employee.id,
      type: 'withdrawal',
      amount: -amountToWithdraw,
      currency: employee.currency || 'NGN',
      status: 'completed',
      description: 'Salary Withdrawal',
      receipt: result?.receipt || '0x' + Date.now().toString(16),
      mode: result?.mode || 'simulated',
      quoteId: result?.quoteId,
      outgoingPaymentUrl: result?.outgoingPaymentUrl,
      notice: result?.notice,
      created_at: new Date().toISOString(),
    };

    try {
      if (employee.id !== 'demo-emp') {
        await supabase.from('transactions').insert({
          company_id: newTx.company_id,
          employee_id: newTx.employee_id,
          type: newTx.type,
          amount: newTx.amount,
          currency: newTx.currency,
          status: newTx.status,
          description: newTx.description,
          receipt: newTx.receipt,
        });
      }
    } catch {
      // Keep UI updated even in demo mode
    }

    setTransactions(prev => [newTx, ...prev]);
    setWithdrawnThisMonth(prev => prev + amountToWithdraw);
    setExpandedReceiptId(newTx.id);
    toast.success(`Withdrew ${formatCurrency(amountToWithdraw, employee.currency || 'NGN')} to your account.`);
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="skeleton" style={{ height: '140px', borderRadius: '24px' }} />
        <div className="skeleton" style={{ height: '240px', borderRadius: '24px' }} />
      </div>
    );
  }

  // Real-Time Calendar Wage Accrual
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const progressPct = Math.min(100, Math.round((currentDay / daysInMonth) * 100));

  const baseSalary = Number(employee?.salary || 850000);
  const dailyRate = baseSalary / daysInMonth;
  const accruedToDate = Math.round(dailyRate * currentDay);
  const availableWages = Math.max(0, accruedToDate - withdrawnThisMonth);
  const clampedWithdraw = Math.min(withdrawAmount, availableWages);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.65rem' }}>
      {/* Plain-English Greeting Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <span className="eyebrow-pill" style={{ marginBottom: '0.6rem' }}>
            <Sparkles size={12} strokeWidth={1.75} color="var(--accent-teal)" />
            {employee?.company_name}
          </span>
          <h1 className="page-title">
            Welcome back, <span className="serif-accent" style={{ color: 'var(--accent-teal)' }}>{employee?.name?.split(' ')[0]}</span>.
          </h1>
          <p className="page-subtitle">
            Your earnings update every day. Withdraw what you have earned whenever you need it—no loans, no interest.
          </p>
        </div>

        <button
          onClick={() => setEditingWallet(prev => !prev)}
          className="btn btn-secondary btn-sm"
        >
          <Pencil size={13} strokeWidth={1.75} />
          {editingWallet ? 'Close account' : 'Receiving account'}
        </button>
      </div>

      {/* Collapsible Editable Receiving Account Drawer (for testing any second testnet wallet) */}
      {editingWallet && (
        <div className="bezel-shell">
          <div className="bezel-core" style={{ padding: '1.25rem 1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Where your money lands (wallet address)
              </label>
              <input
                type="text"
                value={receiverWalletInput}
                onChange={e => setReceiverWalletInput(e.target.value)}
                placeholder="$ilp.interledger-test.dev/your-employee-wallet"
                style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
              />
            </div>
            <button onClick={handleSaveWallet} className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-end' }}>
              Save address
            </button>
          </div>
        </div>
      )}

      {/* Summary Metric Bento */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.1rem' }}>
        <div className="bezel-shell">
          <div className="bezel-core" style={{ padding: '1.35rem 1.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Monthly salary
            </span>
            <div className="tabular-nums" style={{ fontSize: '1.6rem', fontWeight: 800 }}>
              {formatCurrency(baseSalary, employee?.currency || 'NGN')}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Standard pay cycle</span>
          </div>
        </div>

        <div className="bezel-shell">
          <div className="bezel-core" style={{ padding: '1.35rem 1.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Earned so far (Day {currentDay} of {daysInMonth})
            </span>
            <div className="tabular-nums" style={{ fontSize: '1.6rem', fontWeight: 800 }}>
              {formatCurrency(accruedToDate, employee?.currency || 'NGN')}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--status-success)' }}>{progressPct}% of month completed</span>
          </div>
        </div>

        <div className="bezel-shell">
          <div
            className="bezel-core"
            style={{
              padding: '1.35rem 1.5rem',
              background: 'radial-gradient(280px 140px at 90% 10%, rgba(11, 110, 92, 0.08), transparent 70%), var(--elevation-1)',
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-teal)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
              Available to withdraw now
            </span>
            <div className="tabular-nums" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-teal)' }}>
              {formatCurrency(availableWages, employee?.currency || 'NGN')}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {withdrawnThisMonth > 0
                ? `${formatCurrency(withdrawnThisMonth, employee?.currency || 'NGN')} already withdrawn`
                : '0% interest · Instant arrival'}
            </span>
          </div>
        </div>
      </div>

      {/* Double-Bezel Instant Salary Withdrawal Card */}
      <div className="bezel-shell">
        <div className="bezel-core" style={{ padding: '1.75rem 2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.35rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={18} strokeWidth={1.75} color="var(--accent-teal)" /> Withdraw earned salary
              </h2>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                Pick how much you want today. The remainder arrives on your normal payday.
              </p>
            </div>
            <span className="badge badge-success">Arrives in seconds</span>
          </div>

          <div style={{ background: 'var(--elevation-2)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '1.35rem', marginBottom: '1.35rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.85rem' }}>
              <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Amount to withdraw</span>
              <strong className="tabular-nums" style={{ fontSize: '1.65rem', color: 'var(--accent-teal)', fontWeight: 800 }}>
                {formatCurrency(clampedWithdraw, employee?.currency || 'NGN')}
              </strong>
            </div>

            <input
              type="range"
              min={availableWages > 0 ? 10000 : 0}
              max={availableWages || 10000}
              step={5000}
              value={clampedWithdraw}
              disabled={availableWages <= 0}
              onChange={e => setWithdrawAmount(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-teal)', cursor: availableWages > 0 ? 'pointer' : 'not-allowed', height: '6px', marginBottom: '0.75rem' }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              <span>Min: {formatCurrency(10000, employee?.currency || 'NGN')}</span>
              <span>Max available: {formatCurrency(availableWages, employee?.currency || 'NGN')}</span>
            </div>
          </div>

          <button
            onClick={handleWithdraw}
            disabled={availableWages <= 0}
            className="btn btn-primary btn-lg btn-block"
            style={{ justifyContent: 'space-between', opacity: availableWages <= 0 ? 0.55 : 1 }}
          >
            <span>Withdraw {formatCurrency(clampedWithdraw, employee?.currency || 'NGN')} now</span>
            <span className="btn-icon-nest">
              <ArrowUpRight size={16} strokeWidth={1.75} />
            </span>
          </button>
        </div>
      </div>

      {/* Payment Receipts with Expandable Live Interledger Proof Drawer */}
      <div className="bezel-shell">
        <div className="bezel-core" style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '2px' }}>Payment receipts</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Every payout includes a verifiable cryptographic receipt. Click View proof on any row to inspect the live settlement record.
            </p>
          </div>

          {transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-secondary)' }}>
              <Receipt size={30} strokeWidth={1.5} style={{ margin: '0 auto 10px', opacity: 0.45, display: 'block' }} />
              <p style={{ margin: 0, fontSize: '0.88rem' }}>
                No withdrawals yet. Move the slider above and withdraw to generate your first live payment receipt.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {transactions.map((tx, idx) => {
                const rowId = tx.id || String(idx);
                const isExpanded = expandedReceiptId === rowId;
                return (
                  <div
                    key={rowId}
                    style={{
                      borderRadius: '14px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--elevation-2)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.95rem 1.15rem',
                        gap: '1rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                          {tx.description || (tx.type === 'withdrawal' ? 'Salary Withdrawal' : 'Payroll Deposit')}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)' }}>
                          {new Date(tx.created_at || tx.date || Date.now()).toLocaleString()}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <span className="tabular-nums" style={{ fontWeight: 800, color: 'var(--accent-teal)', fontSize: '0.95rem' }}>
                          {formatCurrency(Math.abs(Number(tx.amount)), tx.currency || employee?.currency || 'NGN')}
                        </span>
                        <span className="badge badge-success">
                          <CheckCircle2 size={12} strokeWidth={2} /> Settled
                        </span>
                        <button
                          onClick={() => setExpandedReceiptId(isExpanded ? null : rowId)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                        >
                          <Fingerprint size={13} strokeWidth={1.75} />
                          View proof
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div
                        style={{
                          padding: '1rem 1.15rem',
                          borderTop: '1px solid var(--border-subtle)',
                          background: 'var(--elevation-1)',
                          fontSize: '0.78rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.55rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Payment network</span>
                          <span style={{ fontWeight: 600 }}>
                            {tx.mode === 'live' ? 'Interledger (Live Testnet)' : 'Demo mode'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Receipt ID</span>
                          <span style={{ fontFamily: 'var(--font-mono)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            {tx.receipt ? `${tx.receipt.substring(0, 26)}...` : 'Verified'}
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(tx.receipt || '');
                                toast.success('Receipt hash copied.');
                              }}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--accent-teal)' }}
                              title="Copy receipt"
                            >
                              <Copy size={13} />
                            </button>
                          </span>
                        </div>
                        {tx.quoteId && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Open Payments Quote ID</span>
                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{tx.quoteId}</span>
                          </div>
                        )}
                        {tx.notice && (
                          <div style={{ color: 'var(--status-warning)', fontSize: '0.76rem' }}>
                            Note: {tx.notice}
                          </div>
                        )}
                        <div style={{ paddingTop: '0.35rem' }}>
                          <a
                            href={tx.outgoingPaymentUrl || employee?.wallet_address || 'https://ilp.interledger-test.dev/da071cb6'}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              color: 'var(--accent-teal)',
                              fontWeight: 600,
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                            }}
                          >
                            Verify wallet on Interledger Testnet <ExternalLink size={13} />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Live Transfer Modal */}
      <ILPTransferVisualizer
        isOpen={showVisualizer}
        onClose={() => setShowVisualizer(false)}
        senderWallet="https://ilp.interledger-test.dev/da071cb6"
        receiverWallet={employee?.wallet_address || 'https://ilp.interledger-test.dev/da071cb6'}
        senderName={`${employee?.company_name} Treasury`}
        receiverName={employee?.name || 'Employee'}
        sendAmount={Math.max(1, Math.round(convertCurrency(clampedWithdraw, employee?.currency || 'NGN', 'EUR')))}
        sendCurrency="EUR"
        receiveAmount={clampedWithdraw}
        receiveCurrency={employee?.currency || 'NGN'}
        onComplete={handleVisualizerComplete}
      />
    </div>
  );
}
