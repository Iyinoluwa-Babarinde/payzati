'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  CheckCircle2,
  ExternalLink,
  Globe,
  KeyRound,
  Plus,
  Search,
  ShieldAlert,
  Sparkles,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/fx-engine';
import { getCompany } from '@/lib/supabase/queries';
import { createClient } from '@/lib/supabase/client';
import { getAdminConfigStatus, initiateMasterAuthorization } from '@/app/admin/actions';
import ILPTransferVisualizer from '@/components/ILPTransferVisualizer';

export default function EmployerDashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    countries: 0,
    monthlyPayroll: 0,
    walletAsset: 'USD',
    walletScale: 2,
  });
  const [employees, setEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState('Payzati Global Inc.');
  const [masterWalletPointer, setMasterWalletPointer] = useState('$ilp.interledger-test.dev/payzati');
  const [budgetApproved, setBudgetApproved] = useState(false);
  const [approving, setApproving] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [showExpressVisualizer, setShowExpressVisualizer] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [customReceiverWallet, setCustomReceiverWallet] = useState('');

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();

      // Parallelize all queries concurrently for instant non-blocking load
      const [companyRes, adminRes, walletRes, empsRes] = await Promise.allSettled([
        getCompany(),
        getAdminConfigStatus(),
        fetch('https://ilp.interledger-test.dev/payzati', { headers: { Accept: 'application/json' } }),
        supabase.from('employees').select('*').order('created_at', { ascending: false }),
      ]);

      if (companyRes.status === 'fulfilled' && companyRes.value?.name) {
        setCompanyName(companyRes.value.name);
      }

      if (adminRes.status === 'fulfilled' && adminRes.value) {
        setBudgetApproved(Boolean(adminRes.value.hasMasterToken && !adminRes.value.isSimulatedToken));
      }

      if (walletRes.status === 'fulfilled' && walletRes.value.ok) {
        try {
          const walletData = await walletRes.value.json();
          setStats(prev => ({
            ...prev,
            walletAsset: walletData.assetCode || 'EUR',
            walletScale: walletData.assetScale ?? 2,
          }));
          setMasterWalletPointer('$ilp.interledger-test.dev/payzati');
        } catch {}
      }

      if (empsRes.status === 'fulfilled' && empsRes.value.data && empsRes.value.data.length > 0) {
        const emps = empsRes.value.data;
        setEmployees(emps);
        const uniqueCountries = new Set(emps.map((e: any) => e.country).filter(Boolean));
        const totalMonthly = emps.reduce((sum: number, e: any) => sum + Number(e.salary || 0), 0);
        setStats(prev => ({
          ...prev,
          totalEmployees: emps.length,
          countries: uniqueCountries.size,
          monthlyPayroll: totalMonthly,
        }));
      }
    }

    loadData();
  }, []);

  const handleApproveBudget = async () => {
    setApproving(true);
    try {
      const redirectUrl = await initiateMasterAuthorization(1000, window.location.origin);
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    } catch (e: any) {
      toast.error(e?.message || 'Could not start Interledger budget approval. Check your testnet keys.');
      setApproving(false);
    }
  };

  const handlePayClick = (emp: any) => {
    setSelectedRecipient(emp);
    setCustomReceiverWallet(emp.wallet_address || 'https://ilp.interledger-test.dev/da071cb6');
    setShowExpressVisualizer(true);
  };

  const filteredEmployees = employees.filter(e => {
    const q = search.toLowerCase();
    return (
      (e.name || '').toLowerCase().includes(q) ||
      (e.country || '').toLowerCase().includes(q) ||
      (e.role || '').toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="skeleton" style={{ height: '180px', borderRadius: '24px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div className="skeleton" style={{ height: '110px', borderRadius: '20px' }} />
          <div className="skeleton" style={{ height: '110px', borderRadius: '20px' }} />
          <div className="skeleton" style={{ height: '110px', borderRadius: '20px' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1140px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <span className="eyebrow-pill" style={{ marginBottom: '0.65rem' }}>
            <Sparkles size={12} strokeWidth={1.75} color="var(--accent-teal)" />
            {companyName} · Company overview
          </span>
          <h1 className="page-title">
            Pay your team,{' '}
            <span className="serif-accent" style={{ color: 'var(--accent-teal)' }}>in one click</span>.
          </h1>
          <p className="page-subtitle">
            Approve your payout budget once, then send salaries anywhere in seconds.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => {
              setDemoMode(prev => !prev);
              toast.success(!demoMode ? 'Demo mode enabled.' : 'Live Interledger mode enabled.');
            }}
            className="btn btn-secondary btn-sm"
            title="Switch between live transfers and demo mode"
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: demoMode ? 'var(--status-warning)' : 'var(--status-success)',
              }}
            />
            {demoMode ? 'Demo mode' : 'Live mode'}
          </button>

          <Link href="/employer/payroll" className="btn btn-primary btn-sm">
            Pay whole team
            <ArrowUpRight size={15} strokeWidth={1.75} />
          </Link>
        </div>
      </div>

      {/* Double-Bezel Master Wallet & Budget Authorization Hero */}
      <div className="bezel-shell">
        <div
          className="bezel-core"
          style={{
            padding: '1.75rem 2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1.5rem',
            flexWrap: 'wrap',
            background:
              'radial-gradient(520px 240px at 92% 0%, rgba(13, 143, 104, 0.08), transparent 68%), var(--elevation-1)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Company payout wallet
              </span>
              {budgetApproved ? (
                <span className="badge badge-success">
                  <CheckCircle2 size={12} strokeWidth={2} /> Budget ready
                </span>
              ) : (
                <span className="badge badge-warning">
                  <ShieldAlert size={12} strokeWidth={2} /> Approval needed for live payouts
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span className="tabular-nums" style={{ fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
                {stats.walletAsset} Wallet · Connected
              </span>
              <a
                href="https://ilp.interledger-test.dev/payzati"
                target="_blank"
                rel="noreferrer"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.82rem',
                  color: 'var(--accent-teal)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                {masterWalletPointer} <ExternalLink size={13} strokeWidth={1.75} />
              </a>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', maxWidth: '58ch' }}>
              {budgetApproved
                ? 'Your company wallet is approved. Payments go out instantly.'
                : 'Approve your company wallet once so Payzati can send live payments automatically.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleApproveBudget}
              disabled={approving}
              className="btn btn-primary btn-lg"
            >
              <KeyRound size={16} strokeWidth={1.75} />
              {approving ? 'Opening wallet...' : budgetApproved ? 'Update budget' : 'Approve payout budget'}
              <span className="btn-icon-nest">
                <ArrowUpRight size={15} strokeWidth={1.75} />
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Asymmetrical Metrics Bento */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.15rem' }}>
        <div className="bezel-shell">
          <div className="bezel-core" style={{ padding: '1.35rem 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Active Team</span>
              <Users size={16} strokeWidth={1.65} color="var(--accent-teal)" />
            </div>
            <div className="tabular-nums" style={{ fontSize: '1.75rem', fontWeight: 800 }}>
              {stats.totalEmployees}
            </div>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)' }}>Loaded live from Supabase</span>
          </div>
        </div>

        <div className="bezel-shell">
          <div className="bezel-core" style={{ padding: '1.35rem 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Countries Covered</span>
              <Globe size={16} strokeWidth={1.65} color="var(--accent-teal)" />
            </div>
            <div className="tabular-nums" style={{ fontSize: '1.75rem', fontWeight: 800 }}>
              {stats.countries}
            </div>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)' }}>Cross-border settlement corridors</span>
          </div>
        </div>

        <div className="bezel-shell">
          <div className="bezel-core" style={{ padding: '1.35rem 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Monthly Payroll Volume</span>
              <Wallet size={16} strokeWidth={1.65} color="var(--accent-teal)" />
            </div>
            <div className="tabular-nums" style={{ fontSize: '1.75rem', fontWeight: 800 }}>
              {formatCurrency(stats.monthlyPayroll, employees[0]?.currency || 'NGN')}
            </div>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)' }}>Sum of active team salaries</span>
          </div>
        </div>
      </div>

      {/* Team Instant Payout Table */}
      <div className="bezel-shell">
        <div className="bezel-core" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', marginBottom: '2px' }}>Team &amp; Express Payouts</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Click Pay now on any team member to trigger an instant Interledger settlement.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search size={15} strokeWidth={1.65} color="var(--text-tertiary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search team..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ paddingLeft: '34px', width: '210px' }}
                />
              </div>
              <Link href="/employer/employees" className="btn btn-secondary btn-sm">
                <Plus size={15} strokeWidth={1.75} /> Add member
              </Link>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Team Member</th>
                  <th>Country</th>
                  <th>Receiving Wallet</th>
                  <th>Monthly Salary</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                      No team members found yet. Add your first employee in the Team tab to run live payroll.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp, i) => (
                    <tr key={emp.id || i}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{emp.name}</div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>{emp.role || 'Team Member'}</div>
                      </td>
                      <td>{emp.country || 'Nigeria'}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                        {emp.wallet_address || '$ilp.interledger-test.dev/da071cb6'}
                      </td>
                      <td className="tabular-nums" style={{ fontWeight: 700 }}>
                        {formatCurrency(Number(emp.salary || 0), emp.currency || 'NGN')}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button onClick={() => handlePayClick(emp)} className="btn btn-primary btn-sm">
                          <Zap size={13} strokeWidth={1.75} /> Pay now
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Live Transfer Modal */}
      {selectedRecipient && (
        <ILPTransferVisualizer
          isOpen={showExpressVisualizer}
          onClose={() => setShowExpressVisualizer(false)}
          senderWallet="https://ilp.interledger-test.dev/payzati"
          receiverWallet={customReceiverWallet || selectedRecipient.wallet_address || 'https://ilp.interledger-test.dev/da071cb6'}
          senderName={`${companyName} Treasury`}
          receiverName={selectedRecipient.name}
          sendAmount={Math.max(5, Math.round(Number(selectedRecipient.salary || 500) / 1600))}
          sendCurrency={stats.walletAsset}
          receiveAmount={Number(selectedRecipient.salary || 500)}
          receiveCurrency={selectedRecipient.currency || 'NGN'}
          onComplete={async () => {
            try {
              const res = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  senderWallet: 'https://ilp.interledger-test.dev/payzati',
                  receiverWallet: customReceiverWallet || selectedRecipient.wallet_address,
                  amount: Math.max(1, Math.round(Number(selectedRecipient.salary || 50) / 1600)),
                  currency: stats.walletAsset,
                  demoMode,
                }),
              });
              const data = await res.json();
              if (data?.result?.mode === 'live') {
                toast.success(`Live Interledger settlement completed for ${selectedRecipient.name}.`);
              } else {
                toast.success(
                  data?.result?.notice || `Settled for ${selectedRecipient.name} in Demo Mode.`
                );
              }
            } catch {
              toast.error('Payment request encountered a network issue.');
            }
          }}
        />
      )}
    </div>
  );
}
