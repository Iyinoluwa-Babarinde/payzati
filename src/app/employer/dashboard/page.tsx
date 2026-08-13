'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Globe, 
  Banknote, 
  Wallet, 
  Zap, 
  Search, 
  Plus
} from 'lucide-react';
import { formatCurrency } from '@/lib/fx-engine';
import { getCompany } from '@/lib/supabase/queries';
import { createClient } from '@/lib/supabase/client';
import ILPTransferVisualizer from '@/components/ILPTransferVisualizer';

// Circular Flag SVGs
function FlagNG({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ borderRadius: '50%', marginRight: '8px', verticalAlign: 'middle' }}>
      <circle cx="12" cy="12" r="12" fill="#008751" />
      <rect x="8" y="0" width="8" height="24" fill="#FFFFFF" />
    </svg>
  );
}

function FlagKE({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ borderRadius: '50%', marginRight: '8px', verticalAlign: 'middle' }}>
      <circle cx="12" cy="12" r="12" fill="#000000" />
      <rect x="0" y="6" width="24" height="12" fill="#FF0000" />
      <rect x="0" y="12" width="24" height="6" fill="#006600" />
      <path d="M10 12 L12 8 L14 12 L12 16 Z" fill="#FFFFFF" />
    </svg>
  );
}

function FlagGH({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ borderRadius: '50%', marginRight: '8px', verticalAlign: 'middle' }}>
      <circle cx="12" cy="12" r="12" fill="#E2231A" />
      <rect x="0" y="8" width="24" height="16" fill="#FCD116" />
      <rect x="0" y="16" width="24" height="8" fill="#006B3F" />
      <polygon points="12,10 13.5,13 16.5,13 14,15 15,18 12,16 9,18 10,15 7.5,13 10.5,13" fill="#000000" />
    </svg>
  );
}

function FlagZA({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ borderRadius: '50%', marginRight: '8px', verticalAlign: 'middle' }}>
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
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ borderRadius: '50%', marginRight: '8px', verticalAlign: 'middle' }}>
      <circle cx="12" cy="12" r="12" fill="#C8102E" />
      <rect x="0" y="8" width="24" height="8" fill="#FFFFFF" />
      <rect x="0" y="16" width="24" height="8" fill="#000000" />
    </svg>
  );
}

function CountryFlag({ country, size = 16 }: { country: string; size?: number }) {
  const c = country.toLowerCase();
  if (c.includes('nigeria')) return <FlagNG size={size} />;
  if (c.includes('kenya')) return <FlagKE size={size} />;
  if (c.includes('ghana')) return <FlagGH size={size} />;
  if (c.includes('south africa')) return <FlagZA size={size} />;
  if (c.includes('egypt')) return <FlagEG size={size} />;
  return <Globe size={size} color="var(--text-secondary)" style={{ marginRight: '8px', verticalAlign: 'middle' }} />;
}

export default function EmployerDashboard() {
  const [stats, setStats] = useState({ totalEmployees: 142, countries: 5, monthlyPayroll: 145000, walletBalance: 25000 });
  const [employees, setEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState('Payzati Global Inc.');
  const [showExpressVisualizer, setShowExpressVisualizer] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const company = await getCompany();
      if (company) {
        setCompanyName(company.name);
      }

      try {
        const { data } = await supabase.from('employees').select('*').limit(10);
        if (data && data.length > 0) {
          setEmployees(data);
        } else {
          setEmployees([
            { id: '1', name: 'Sarah Johansson', country: 'Nigeria', currency: 'NGN', salary: 1550000, wallet_address: 'https://ilp.interledger-test.dev/a5cb6a41', role: 'Senior Software Engineer' },
            { id: '2', name: 'David Ochieng', country: 'Kenya', currency: 'KES', salary: 185000, wallet_address: 'https://ilp.interledger-test.dev/a5cb6a41', role: 'DevOps Lead' },
            { id: '3', name: 'Kwame Mensah', country: 'Ghana', currency: 'GHS', salary: 18400, wallet_address: 'https://ilp.interledger-test.dev/a5cb6a41', role: 'Product Manager' },
            { id: '4', name: 'Thabo Ndlovu', country: 'South Africa', currency: 'ZAR', salary: 45000, wallet_address: 'https://ilp.interledger-test.dev/a5cb6a41', role: 'Security Engineer' },
            { id: '5', name: 'Youssef Hassan', country: 'Egypt', currency: 'EGP', salary: 38000, wallet_address: 'https://ilp.interledger-test.dev/a5cb6a41', role: 'UX Architect' },
          ]);
        }
      } catch (e) {
        setEmployees([
          { id: '1', name: 'Sarah Johansson', country: 'Nigeria', currency: 'NGN', salary: 1550000, wallet_address: 'https://ilp.interledger-test.dev/a5cb6a41', role: 'Senior Software Engineer' },
          { id: '2', name: 'David Ochieng', country: 'Kenya', currency: 'KES', salary: 185000, wallet_address: 'https://ilp.interledger-test.dev/a5cb6a41', role: 'DevOps Lead' },
          { id: '3', name: 'Kwame Mensah', country: 'Ghana', currency: 'GHS', salary: 18400, wallet_address: 'https://ilp.interledger-test.dev/a5cb6a41', role: 'Product Manager' },
        ]);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.country.toLowerCase().includes(search.toLowerCase())
  );

  const handlePayIndividual = (emp: any) => {
    setSelectedRecipient(emp);
    setShowExpressVisualizer(true);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 🚀 1. HERO COCKPIT HEADER BAR */}
      <div 
        className="card"
        style={{
          padding: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '1.35rem', margin: 0 }}>{companyName}</h1>
            <span className="badge badge-success">
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--status-success)', display: 'inline-block' }}></span>
              ILP Testnet Connected
            </span>
          </div>
          <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Master Pointer:</span>
            <code style={{ color: 'var(--accent-teal)', background: 'var(--elevation-2)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontFamily: 'monospace' }}>
              $ilp.interledger-test.dev/a5cb6a41
            </code>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setSelectedRecipient(null);
              setShowExpressVisualizer(true);
            }}
            className="btn btn-primary"
            style={{
              padding: '0.75rem 1.35rem',
              fontWeight: 700,
            }}
          >
            <Zap size={16} /> 1-Click Express Payroll
          </button>
          
          <Link
            href="/employer/employees"
            className="btn btn-secondary"
            style={{
              padding: '0.75rem 1.25rem',
            }}
          >
            <Plus size={16} /> Add Member
          </Link>
        </div>
      </div>

      {/* 📊 2. HIGH-DENSITY METRIC TILES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        {/* Wallet Balance */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Available Balance</span>
            <Wallet size={18} color="var(--accent-teal)" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            ${stats.walletBalance.toLocaleString()}.00 USD
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Pre-funded testnet balance</span>
        </div>

        {/* Total People */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Total Active Team</span>
            <Users size={18} color="var(--accent-teal)" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            {stats.totalEmployees} Members
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--status-success)' }}>100% Ready for Payout</span>
        </div>

        {/* Global Markets */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Covered Markets</span>
            <Globe size={18} color="var(--accent-teal)" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            {stats.countries} African Countries
          </div>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginTop: '4px' }}>
            <FlagNG size={16} /> <FlagKE size={16} /> <FlagGH size={16} /> <FlagZA size={16} /> <FlagEG size={16} />
          </div>
        </div>

        {/* Monthly Payroll Total */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Monthly Payroll</span>
            <Banknote size={18} color="var(--accent-teal)" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            ${stats.monthlyPayroll.toLocaleString()}.00 USD
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--status-success)' }}>0.2% Transparent Rate</span>
        </div>
      </div>

      {/* 📋 3. LIVE ROSTER & INSTANT STREAM MATRIX */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Team Roster &amp; Payout Matrix</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Send instant Interledger payments to any team member</span>
          </div>

          {/* Quick Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--elevation-2)', padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
            <Search size={16} color="var(--text-secondary)" />
            <input
              type="text"
              placeholder="Search team or country..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.825rem', outline: 'none', width: '200px', padding: 0 }}
            />
          </div>
        </div>

        {/* Data Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Team Member</th>
                <th>Market</th>
                <th>Payment Pointer</th>
                <th>Net Salary</th>
                <th style={{ textAlign: 'right' }}>Instant Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => (
                <tr key={emp.id}>
                  <td>
                    <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{emp.name}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{emp.role || 'Team Member'}</span>
                  </td>
                  <td>
                    <CountryFlag country={emp.country} size={16} />
                    <span style={{ color: 'var(--text-secondary)' }}>{emp.country}</span>
                  </td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', fontSize: '0.775rem' }}>
                    {emp.wallet_address}
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--accent-teal)' }}>
                    {formatCurrency(emp.salary, emp.currency)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => handlePayIndividual(emp)}
                      className="btn btn-secondary btn-sm"
                      style={{
                        fontWeight: 600,
                        color: 'var(--accent-teal)',
                      }}
                    >
                      <Zap size={14} /> Pay via ILP
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full-Screen Live Settlement Visualizer */}
      <ILPTransferVisualizer
        isOpen={showExpressVisualizer}
        onClose={() => setShowExpressVisualizer(false)}
        senderWallet="https://ilp.interledger-test.dev/a5cb6a41"
        receiverWallet="https://ilp.interledger-test.dev/a5cb6a41"
        senderName="Payzati Employer Master Wallet"
        receiverName={selectedRecipient?.name || 'All Active Team Members (Batch Payout)'}
        sendAmount={selectedRecipient ? (selectedRecipient.salary / (selectedRecipient.currency === 'NGN' ? 1550 : 130)) : 145000}
        sendCurrency="USD"
        receiveAmount={selectedRecipient?.salary || 2247500}
        receiveCurrency={selectedRecipient?.currency || 'NGN'}
      />
    </div>
  );
}
