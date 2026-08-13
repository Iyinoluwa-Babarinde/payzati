'use client';

import { useState, useEffect } from 'react';
import { formatCurrency, convertCurrency } from '@/lib/fx-engine';
import { createClient } from '@/lib/supabase/client';
import { getEmployeeProfile } from '@/lib/supabase/queries';
import { 
  Wallet, 
  Zap, 
  Receipt, 
  CheckCircle2, 
  Copy, 
  ArrowRight, 
  Sparkles,
  ShieldCheck,
  Coins
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
    wallet_address: 'https://ilp.interledger-test.dev/sarah-johansson',
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
          wallet_address: emp.wallet_address || `https://ilp.interledger-test.dev/${emp.name.toLowerCase().replace(/\s+/g, '-')}`,
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
    <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 🚀 1. EMPLOYEE HEADER BAR */}
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          padding: '1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff' }}>Welcome back, {employee.name}</span>
            <span
              style={{
                background: 'rgba(16,185,129,0.15)',
                color: '#10b981',
                border: '1px solid #10b981',
                padding: '3px 10px',
                borderRadius: '100px',
                fontSize: '0.725rem',
                fontWeight: 800,
              }}
            >
              ACTIVE ONBOARDED
            </span>
          </div>
          <div style={{ fontSize: '0.825rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Working at <strong style={{ color: '#fff' }}>{employee.company_name}</strong></span>
            <span>·</span>
            <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{employee.wallet_address}</span>
            <button 
              onClick={handleCopyWallet}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
              title="Copy Wallet Pointer"
            >
              <Copy size={14} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(0, 212, 170, 0.1)', border: '1px solid rgba(0, 212, 170, 0.3)', padding: '8px 16px', borderRadius: '14px' }}>
          <ShieldCheck size={20} color="#00d4aa" />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#00d4aa' }}>ILP Open Payments Connected</span>
        </div>
      </div>

      {/* 📊 2. METRIC SUMMARY TILES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        <div style={{ background: 'rgba(17, 24, 39, 0.75)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Monthly Base Salary</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
            {formatCurrency(employee.salary, employee.currency)}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Gross contracted monthly compensation</span>
        </div>

        <div style={{ background: 'rgba(17, 24, 39, 0.75)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Accrued to Date (Day {daysWorked}/{daysInMonth})</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#00d4aa', marginBottom: '4px' }}>
            {formatCurrency(availableWages, employee.currency)}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#10b981' }}>{progressPct}% of monthly pay cycle completed</span>
        </div>

        <div style={{ background: 'rgba(17, 24, 39, 0.75)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '20px', padding: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Available for Immediate Cash-Out</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginBottom: '4px' }}>
            {formatCurrency(availableWages, employee.currency)}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Zero wait · Real-time ILP STREAM withdrawal</span>
        </div>
      </div>

      {/* ⚡ 3. UNIFIED EARNED WAGE ACCESS (EWA) COCKPIT */}
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(17, 24, 39, 0.85) 100%)',
          border: '1px solid rgba(16,185,129,0.35)',
          borderRadius: '24px',
          padding: '1.75rem',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={20} color="#00d4aa" /> Instant Earned Wage Access
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
              Withdraw your earned salary before payday. Money arrives instantly in seconds over the Interledger network.
            </span>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '6px 14px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.775rem', color: '#94a3b8' }}>
            Flat Transfer Fee: <strong style={{ color: '#fff' }}>$1.50 USD</strong> · 0% Interest
          </div>
        </div>

        {/* Interactive Slider */}
        <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '1.5rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Select Withdrawal Amount:</span>
            <strong style={{ fontSize: '1.5rem', color: '#00d4aa', fontWeight: 800 }}>
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
            style={{ width: '100%', accentColor: '#00d4aa', cursor: 'pointer', height: '8px', marginBottom: '1rem' }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
            <span>Min: {formatCurrency(50000, employee.currency)}</span>
            <span>Max Accrued: {formatCurrency(availableWages, employee.currency)}</span>
          </div>
        </div>

        <button
          onClick={handleWithdraw}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #10b981 0%, #00d4aa 100%)',
            color: '#0d1117',
            border: 'none',
            borderRadius: '16px',
            padding: '1.1rem',
            fontWeight: 800,
            fontSize: '1.05rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: '0 10px 30px rgba(16,185,129,0.35)',
            transition: 'transform 0.2s ease',
          }}
        >
          <Zap size={20} /> Withdraw {formatCurrency(withdrawAmount, employee.currency)} via Interledger (ILP)
        </button>
      </div>

      {/* 📋 4. RECENT CRYPTOGRAPHIC PAYSTUBS LEDGER */}
      <div 
        style={{
          background: 'rgba(17, 24, 39, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          padding: '1.5rem',
          backdropFilter: 'blur(16px)',
        }}
      >
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 800 }}>Recent Paystubs &amp; ILP Receipts</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px' }}>Date</th>
                <th style={{ padding: '10px 12px' }}>Type</th>
                <th style={{ padding: '10px 12px' }}>Gross Salary</th>
                <th style={{ padding: '10px 12px' }}>Net Received</th>
                <th style={{ padding: '10px 12px' }}>Cryptographic Proof</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '12px' }}>Aug 01, 2026</td>
                <td style={{ padding: '12px', color: '#38bdf8', fontWeight: 600 }}>Monthly Payroll</td>
                <td style={{ padding: '12px' }}>₦1,550,000</td>
                <td style={{ padding: '12px', fontWeight: 700, color: '#10b981' }}>₦1,348,500</td>
                <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '0.75rem', color: '#94a3b8' }}>
                  0x7f8a92b0c1e8...
                </td>
                <td style={{ padding: '12px', textAlign: 'right' }}>
                  <span style={{ color: '#10b981', fontWeight: 800, fontSize: '0.75rem' }}>✓ Settled (0.8s)</span>
                </td>
              </tr>
              <tr>
                <td style={{ padding: '12px' }}>Jul 01, 2026</td>
                <td style={{ padding: '12px', color: '#38bdf8', fontWeight: 600 }}>Monthly Payroll</td>
                <td style={{ padding: '12px' }}>₦1,550,000</td>
                <td style={{ padding: '12px', fontWeight: 700, color: '#10b981' }}>₦1,348,500</td>
                <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '0.75rem', color: '#94a3b8' }}>
                  0x4a19dc81e4b2...
                </td>
                <td style={{ padding: '12px', textAlign: 'right' }}>
                  <span style={{ color: '#10b981', fontWeight: 800, fontSize: '0.75rem' }}>✓ Settled (0.7s)</span>
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
        senderWallet="https://ilp.interledger-test.dev/payzati-master-wallet"
        receiverWallet={employee.wallet_address}
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
