'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Globe, 
  Banknote, 
  Wallet, 
  Zap, 
  ArrowRight, 
  Search, 
  CheckCircle2, 
  Plus, 
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { formatCurrency } from '@/lib/fx-engine';
import { getCompany } from '@/lib/supabase/queries';
import { createClient } from '@/lib/supabase/client';
import ILPTransferVisualizer from '@/components/ILPTransferVisualizer';
import styles from './dashboard.module.css';

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
            { id: '1', name: 'Sarah Johansson', country: 'Nigeria', currency: 'NGN', salary: 1550000, wallet_address: 'https://ilp.interledger-test.dev/sarah-johansson', role: 'Senior Software Engineer' },
            { id: '2', name: 'David Ochieng', country: 'Kenya', currency: 'KES', salary: 185000, wallet_address: 'https://ilp.interledger-test.dev/david-ochieng', role: 'DevOps Lead' },
            { id: '3', name: 'Kwame Mensah', country: 'Ghana', currency: 'GHS', salary: 18400, wallet_address: 'https://ilp.interledger-test.dev/kwame-mensah', role: 'Product Manager' },
            { id: '4', name: 'Thabo Ndlovu', country: 'South Africa', currency: 'ZAR', salary: 45000, wallet_address: 'https://ilp.interledger-test.dev/thabo-ndlovu', role: 'Security Engineer' },
            { id: '5', name: 'Youssef Hassan', country: 'Egypt', currency: 'EGP', salary: 38000, wallet_address: 'https://ilp.interledger-test.dev/youssef-hassan', role: 'UX Architect' },
          ]);
        }
      } catch (e) {
        setEmployees([
          { id: '1', name: 'Sarah Johansson', country: 'Nigeria', currency: 'NGN', salary: 1550000, wallet_address: 'https://ilp.interledger-test.dev/sarah-johansson', role: 'Senior Software Engineer' },
          { id: '2', name: 'David Ochieng', country: 'Kenya', currency: 'KES', salary: 185000, wallet_address: 'https://ilp.interledger-test.dev/david-ochieng', role: 'DevOps Lead' },
          { id: '3', name: 'Kwame Mensah', country: 'Ghana', currency: 'GHS', salary: 18400, wallet_address: 'https://ilp.interledger-test.dev/kwame-mensah', role: 'Product Manager' },
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
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>{companyName}</span>
            <span
              style={{
                background: 'rgba(16,185,129,0.15)',
                color: '#10b981',
                border: '1px solid #10b981',
                padding: '3px 10px',
                borderRadius: '100px',
                fontSize: '0.75rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
              LIVE ILP TESTNET
            </span>
          </div>
          <div style={{ fontSize: '0.825rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Master Wallet:</span>
            <code style={{ color: '#38bdf8', background: 'rgba(56,189,248,0.1)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>
              $ilp.interledger-test.dev/a5cb6a41
            </code>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setSelectedRecipient(null);
              setShowExpressVisualizer(true);
            }}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #00d4aa 100%)',
              color: '#0d1117',
              border: 'none',
              borderRadius: '14px',
              padding: '0.85rem 1.4rem',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 8px 24px rgba(16,185,129,0.35)',
              transition: 'transform 0.2s ease',
            }}
          >
            <Zap size={18} /> 1-Click Express Payroll
          </button>
          
          <Link
            href="/employer/employees"
            className="btn btn-secondary"
            style={{
              borderRadius: '14px',
              padding: '0.85rem 1.25rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Plus size={16} /> Add Member
          </Link>
        </div>
      </div>

      {/* 📊 2. HIGH-DENSITY METRIC TILES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        {/* Wallet Balance */}
        <div style={{ background: 'rgba(17, 24, 39, 0.75)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Available Balance</span>
            <Wallet size={18} color="#00d4aa" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginBottom: '4px' }}>
            ${stats.walletBalance.toLocaleString()}.00 USD
          </div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Auto-funding linked via Chase Business</span>
        </div>

        {/* Total People */}
        <div style={{ background: 'rgba(17, 24, 39, 0.75)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Total Active Team</span>
            <Users size={18} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
            {stats.totalEmployees} Team Members
          </div>
          <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>100% Onboarded with Testnet Pointers</span>
        </div>

        {/* Global Markets */}
        <div style={{ background: 'rgba(17, 24, 39, 0.75)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Covered Markets</span>
            <Globe size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
            {stats.countries} African Countries
          </div>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginTop: '6px' }}>
            <FlagNG size={16} /> <FlagKE size={16} /> <FlagGH size={16} /> <FlagZA size={16} /> <FlagEG size={16} />
          </div>
        </div>

        {/* Monthly Payroll Total */}
        <div style={{ background: 'rgba(17, 24, 39, 0.75)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Estimated Monthly</span>
            <Banknote size={18} color="#a855f7" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
            ${stats.monthlyPayroll.toLocaleString()}.00 USD
          </div>
          <span style={{ fontSize: '0.75rem', color: '#10b981' }}>0.2% Flat Interledger Fee ($290)</span>
        </div>
      </div>

      {/* 📋 3. LIVE ROSTER & INSTANT STREAM MATRIX */}
      <div 
        style={{
          background: 'rgba(17, 24, 39, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          padding: '1.5rem',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Live Roster &amp; Payout Operations</h3>
            <span style={{ fontSize: '0.775rem', color: '#94a3b8' }}>Stream micro-wages or trigger batch settlements directly</span>
          </div>

          {/* Quick Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.4)', padding: '6px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search team member or country..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.825rem', outline: 'none', width: '220px' }}
            />
          </div>
        </div>

        {/* Data Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px' }}>Team Member</th>
                <th style={{ padding: '10px 12px' }}>Market</th>
                <th style={{ padding: '10px 12px' }}>Payment Pointer</th>
                <th style={{ padding: '10px 12px' }}>Net Salary</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Instant Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s ease' }}>
                  <td style={{ padding: '12px' }}>
                    <strong style={{ color: '#fff', display: 'block' }}>{emp.name}</strong>
                    <span style={{ fontSize: '0.725rem', color: '#94a3b8' }}>{emp.role || 'Full-time Team Member'}</span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <CountryFlag country={emp.country} size={16} />
                    <span style={{ color: '#cbd5e1' }}>{emp.country}</span>
                  </td>
                  <td style={{ padding: '12px', fontFamily: 'monospace', color: '#38bdf8', fontSize: '0.775rem' }}>
                    {emp.wallet_address}
                  </td>
                  <td style={{ padding: '12px', fontWeight: 700, color: '#10b981' }}>
                    {formatCurrency(emp.salary, emp.currency)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <button
                      onClick={() => handlePayIndividual(emp)}
                      style={{
                        background: 'rgba(0, 212, 170, 0.12)',
                        color: '#00d4aa',
                        border: '1px solid rgba(0, 212, 170, 0.3)',
                        borderRadius: '10px',
                        padding: '6px 14px',
                        fontWeight: 700,
                        fontSize: '0.775rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease',
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
        receiverWallet={selectedRecipient?.wallet_address || 'https://ilp.interledger-test.dev/sarah-johansson'}
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
