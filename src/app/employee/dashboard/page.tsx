'use client';

import { useState, useEffect } from 'react';
import { formatCurrency, convertCurrency } from '@/lib/fx-engine';
import { getEmployeeProfile } from '@/lib/supabase/queries';
import { 
  Zap, 
  Copy, 
  ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import ILPTransferVisualizer from '@/components/ILPTransferVisualizer';

export default function EmployeeDashboard() {
  const [employee, setEmployee] = useState<any>({
    id: 'demo-emp',
    name: 'Sarah Johansson',
    role: 'Senior Software Engineer',
    company_name: 'Payzati Global Inc.',
    salary: 1550000,
    currency: 'NGN',
    wallet_address: 'https://ilp.interledger-test.dev/a5cb6a41',
  });
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState(450000);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [availableWages, setAvailableWages] = useState(1348500);

  useEffect(() => {
    async function loadData() {
      const emp = await getEmployeeProfile();
      if (emp) {
        setEmployee({
          ...emp,
          company_name: emp.companies?.name || 'Payzati Global Inc.',
          wallet_address: 'https://ilp.interledger-test.dev/a5cb6a41',
        });
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleCopyWallet = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(employee.wallet_address);
      toast.success('Wallet Pointer copied to clipboard!');
    }
  };

  const handleWithdraw = () => {
    setShowVisualizer(true);
  };

  const handleVisualizerComplete = () => {
    setAvailableWages(prev => Math.max(0, prev - withdrawAmount));
    toast.success(`Withdrawn ${formatCurrency(withdrawAmount, employee.currency)} instantly via Interledger!`);
  };

  const daysWorked = 18;
  const daysInMonth = 30;
  const progressPct = Math.round((daysWorked / daysInMonth) * 100);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 🚀 1. EMPLOYEE HEADER BAR */}
      <div 
        className="card"
        style={{
          padding: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '1.35rem', margin: 0 }}>Welcome back, {employee.name}</h1>
            <span className="badge badge-success">
              Active
            </span>
          </div>
          <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{employee.company_name}</span>
            <span>·</span>
            <span style={{ fontFamily: 'monospace' }}>{employee.wallet_address}</span>
            <button 
              onClick={handleCopyWallet}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
              title="Copy Pointer"
            >
              <Copy size={14} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--accent-teal-dim)', border: '1px solid var(--border-accent)', padding: '6px 14px', borderRadius: 'var(--radius-md)' }}>
          <ShieldCheck size={18} color="var(--accent-teal)" />
          <span style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--accent-teal)' }}>ILP Connected</span>
        </div>
      </div>

      {/* 📊 2. METRIC SUMMARY TILES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Monthly Base Salary</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            {formatCurrency(employee.salary, employee.currency)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Contracted compensation</span>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Accrued to Date (Day {daysWorked}/{daysInMonth})</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-teal)', marginBottom: '4px' }}>
            {formatCurrency(availableWages, employee.currency)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--status-success)' }}>{progressPct}% of pay period completed</span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-teal)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-teal)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Available for Early Withdrawal</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-teal)', marginBottom: '4px' }}>
            {formatCurrency(availableWages, employee.currency)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Instant ILP Stream payout</span>
        </div>
      </div>

      {/* ⚡ 3. UNIFIED EARNED WAGE ACCESS (EWA) COCKPIT */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} color="var(--accent-teal)" /> Instant Earned Wage Access
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Withdraw your earned salary before payday. Money arrives instantly in seconds over Interledger.
            </span>
          </div>

          <div style={{ background: 'var(--elevation-2)', padding: '4px 12px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-default)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Fee: <strong style={{ color: 'var(--text-primary)' }}>$1.50 USD</strong> · 0% Interest
          </div>
        </div>

        {/* Interactive Slider */}
        <div style={{ background: 'var(--elevation-2)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Withdrawal Amount:</span>
            <strong style={{ fontSize: '1.35rem', color: 'var(--accent-teal)', fontWeight: 700 }}>
              {formatCurrency(withdrawAmount, employee.currency)}
            </strong>
          </div>

          <input
            type="range"
            min={50000}
            max={availableWages}
            step={25000}
            value={withdrawAmount}
            onChange={e => setWithdrawAmount(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent-teal)', cursor: 'pointer', height: '6px', marginBottom: '0.75rem' }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <span>Min: {formatCurrency(50000, employee.currency)}</span>
            <span>Max Accrued: {formatCurrency(availableWages, employee.currency)}</span>
          </div>
        </div>

        <button
          onClick={handleWithdraw}
          className="btn btn-primary btn-block"
          style={{
            padding: '0.95rem',
            fontSize: '0.95rem',
            fontWeight: 700,
          }}
        >
          <Zap size={18} /> Withdraw {formatCurrency(withdrawAmount, employee.currency)} via Interledger (ILP)
        </button>
      </div>

      {/* 📋 4. RECENT CRYPTOGRAPHIC PAYSTUBS LEDGER */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 700 }}>Recent Paystubs &amp; ILP Receipts</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Gross Salary</th>
                <th>Net Received</th>
                <th>Receipt Hash</th>
                <th style={{ textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Aug 01, 2026</td>
                <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Monthly Payroll</td>
                <td>₦1,550,000</td>
                <td style={{ fontWeight: 700, color: 'var(--accent-teal)' }}>₦1,348,500</td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  0x7f8a92b0c1e8...
                </td>
                <td style={{ textAlign: 'right' }}>
                  <span className="badge badge-success">✓ Settled (0.8s)</span>
                </td>
              </tr>
              <tr>
                <td>Jul 01, 2026</td>
                <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Monthly Payroll</td>
                <td>₦1,550,000</td>
                <td style={{ fontWeight: 700, color: 'var(--accent-teal)' }}>₦1,348,500</td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  0x4a19dc81e4b2...
                </td>
                <td style={{ textAlign: 'right' }}>
                  <span className="badge badge-success">✓ Settled (0.7s)</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Full-Screen Visualizer Modal */}
      <ILPTransferVisualizer
        isOpen={showVisualizer}
        onClose={() => setShowVisualizer(false)}
        senderWallet="https://ilp.interledger-test.dev/a5cb6a41"
        receiverWallet="https://ilp.interledger-test.dev/a5cb6a41"
        senderName="Payzati Employer Master Wallet"
        receiverName={`${employee.name} (Employee)`}
        sendAmount={convertCurrency(withdrawAmount, employee.currency, 'USD')}
        sendCurrency="USD"
        receiveAmount={withdrawAmount}
        receiveCurrency={employee.currency}
        onComplete={handleVisualizerComplete}
      />
    </div>
  );
}
