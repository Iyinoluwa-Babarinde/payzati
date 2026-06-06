'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Globe, Banknote, Coins, CheckCircle, ArrowRight, ShieldCheck, Flame } from 'lucide-react';
import { formatCurrency } from '@/lib/fx-engine';
import { getCompany } from '@/lib/supabase/queries';
import { createClient } from '@/lib/supabase/client';
import styles from './dashboard.module.css';

// SVG checkmark replacing emoji
function CheckIcon({ className = '', size = 14 }: { className?: string; size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

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

function FlagDefault({ size = 16 }: { size?: number }) {
  return (
    <Globe size={size} color="var(--text-secondary)" style={{ marginRight: '8px', verticalAlign: 'middle' }} />
  );
}

function AnimatedCounter({ end, duration = 1200, prefix = '' }: { end: number; duration?: number; prefix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const increment = end / (duration / 16);
    if (end === 0) return;
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { 
        setCount(end); 
        clearInterval(timer); 
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);
  
  return <span>{prefix}{count.toLocaleString()}</span>;
}

export default function EmployerDashboard() {
  const [stats, setStats] = useState({ totalEmployees: 0, countries: 0, monthlyPayroll: 0, walletBalance: 0 });
  const [recentPayrolls, setRecentPayrolls] = useState<any[]>([]);
  const [distribution, setDistribution] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const company = await getCompany();
      if (!company) return;
      
      setCompanyName(company.name);

      const { data: employees } = await supabase.from('employees').select('*').eq('company_id', company.id);
      const { data: payrolls } = await supabase.from('payroll_runs').select('*').eq('company_id', company.id).order('date', { ascending: false }).limit(4);
      const { data: txs } = await supabase.from('transactions').select('amount, currency').eq('company_id', company.id).eq('status', 'completed');

      if (employees) {
        const uniqueCountries = new Set(employees.map(e => e.country)).size;
        const totalSalaryUSD = employees.reduce((acc, e) => acc + (e.salary / (e.currency === 'NGN' ? 1550 : e.currency === 'KES' ? 154 : 1)), 0);
        
        const counts: Record<string, number> = {};
        employees.forEach(e => counts[e.country] = (counts[e.country] || 0) + 1);
        const dist = Object.keys(counts).map(c => ({
          country: c,
          employees: counts[c],
          percentage: Math.round((counts[c] / employees.length) * 100)
        }));

        const balance = txs ? txs.reduce((sum, tx) => {
          let usdVal = tx.amount;
          if (tx.currency === 'NGN') usdVal = tx.amount / 1550;
          else if (tx.currency === 'KES') usdVal = tx.amount / 130;
          else if (tx.currency === 'GHS') usdVal = tx.amount / 12;
          else if (tx.currency === 'ZAR') usdVal = tx.amount / 18;
          else if (tx.currency === 'EGP') usdVal = tx.amount / 31;
          return sum + usdVal;
        }, 0) : 0;

        setStats({
          totalEmployees: employees.length,
          countries: uniqueCountries,
          monthlyPayroll: Math.round(totalSalaryUSD),
          walletBalance: balance
        });
        setDistribution(dist.sort((a,b) => b.employees - a.employees));
      }

      if (payrolls) setRecentPayrolls(payrolls);
      setLoading(false);
    }
    loadData();
  }, []);

  const getFlag = (country: string) => {
    switch(country.toLowerCase()) {
      case 'nigeria': return <FlagNG />;
      case 'kenya': return <FlagKE />;
      case 'ghana': return <FlagGH />;
      case 'south africa': return <FlagZA />;
      case 'egypt': return <FlagEG />;
      default: return <FlagDefault />;
    }
  };

  return (
    <div className={styles.dashboard}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Workspace: {companyName ? <span style={{color: 'var(--accent-teal)'}}>{companyName}</span> : 'Payzati'}.</h1>
          <p className="page-subtitle">Here&apos;s a quick look at how your global team is doing today.</p>
        </div>
        <Link href="/employer/payroll" className="btn btn-primary">
          <Banknote size={16} /> Run Payroll
        </Link>
      </div>

      {/* User-Adaptive Personalization Card */}
      <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--accent-teal)', background: 'var(--elevation-1)' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div style={{ background: 'var(--accent-teal-dim)', padding: '8px', borderRadius: '8px', color: 'var(--accent-teal)' }}>
            <CheckCircle size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
              {stats.totalEmployees === 0 ? "Let's get you set up!" : 'Roster Active'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '1rem' }}>
              {stats.totalEmployees === 0 
                ? 'Welcome to the family! Here are three quick steps to get your global payments up and running:'
                : `Everything looks great! Your team is active and ready for the next payday.`}
            </p>
            
            {/* Action Items List */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-sm)' }}>
                <CheckIcon size={14} className={stats.totalEmployees > 0 ? styles.stepDone : styles.stepTodo} />
                <span style={{ color: stats.totalEmployees > 0 ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                  Add your team members {stats.totalEmployees > 0 && '(All done!)'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-sm)' }}>
                <CheckIcon size={14} className={stats.walletBalance > 0 ? styles.stepDone : styles.stepTodo} />
                <span style={{ color: stats.walletBalance > 0 ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                  Put some funds in your wallet {stats.walletBalance > 0 && '(All done!)'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-sm)' }}>
                <CheckIcon size={14} className={recentPayrolls.length > 0 ? styles.stepDone : styles.stepTodo} />
                <span style={{ color: recentPayrolls.length > 0 ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                  Run your first payroll {recentPayrolls.length > 0 && '(All done!)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={`card ${styles.statCard} animate-slide-up`} style={{ animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards' }}>
          <div className={styles.statIcon} style={{ background: 'var(--accent-teal-dim)', color: 'var(--accent-teal)' }}><Users size={20} /></div>
          <div className="stat-card">
            <span className="stat-label">People in your team</span>
            <span className="stat-value">{loading ? '-' : <AnimatedCounter end={stats.totalEmployees} />}</span>
            <span className="stat-change positive">Active</span>
          </div>
        </div>

        <div className={`card ${styles.statCard} animate-slide-up`} style={{ animationDelay: '0.2s', opacity: 0, animationFillMode: 'forwards' }}>
          <div className={styles.statIcon} style={{ background: 'var(--accent-purple-dim)', color: 'var(--accent-purple)' }}><Globe size={20} /></div>
          <div className="stat-card">
            <span className="stat-label">Countries represented</span>
            <span className="stat-value">{loading ? '-' : <AnimatedCounter end={stats.countries} />}</span>
            <span className="stat-change positive">Supported</span>
          </div>
        </div>

        <div className={`card ${styles.statCard} animate-slide-up`} style={{ animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards' }}>
          <div className={styles.statIcon} style={{ background: 'var(--accent-gold-dim)', color: 'var(--accent-gold)' }}><Banknote size={20} /></div>
          <div className="stat-card">
            <span className="stat-label">Estimated monthly payroll</span>
            <span className="stat-value">{loading ? '-' : <AnimatedCounter end={stats.monthlyPayroll} prefix="$" />}</span>
            <span className="stat-change positive">Calculated</span>
          </div>
        </div>

        <div className={`card ${styles.statCard} animate-slide-up`} style={{ animationDelay: '0.4s', opacity: 0, animationFillMode: 'forwards' }}>
          <div className={styles.statIcon} style={{ background: 'var(--accent-blue-dim)', color: 'var(--accent-blue)' }}><Coins size={20} /></div>
          <div className="stat-card">
            <span className="stat-label">Available balance</span>
            <span className="stat-value">{loading ? '-' : formatCurrency(stats.walletBalance, 'USD')}</span>
            <span className="stat-change positive">Settled</span>
          </div>
        </div>
      </div>

      <div className={styles.gridRow}>
        {/* Recent Payments Card */}
        <div className={`card ${styles.tableCard}`}>
          <div className={styles.cardHeader}>
            <h3>Your recent payroll runs</h3>
            <Link href="/employer/payroll" className="btn btn-ghost btn-sm">See all</Link>
          </div>
          <table className="data-table">
            <thead>
              <tr><th>Run ID</th><th>Date</th><th>Gross</th><th>Net Paid</th><th>Status</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <>
                  <tr><td colSpan={5}><div className="skeleton skeleton-row"></div></td></tr>
                  <tr><td colSpan={5}><div className="skeleton skeleton-row"></div></td></tr>
                  <tr><td colSpan={5}><div className="skeleton skeleton-row"></div></td></tr>
                </>
              ) : recentPayrolls.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{textAlign:'center', padding:'3rem'}}>
                    <div style={{opacity:0.3,marginBottom:'0.5rem', display: 'flex', justifyContent: 'center'}}><Banknote size={48} /></div>
                    <p style={{color: 'var(--text-secondary)'}}>No payroll runs yet. When you pay your team, they&apos;ll show up right here!</p>
                  </td>
                </tr>
              ) : recentPayrolls.map((pr, i) => (
                <tr key={pr.id} className="animate-slide-up" style={{animationDelay: `${0.1 * i}s`, opacity: 0, animationFillMode: 'forwards'}}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{pr.id.substring(0,8)}</td>
                  <td>{new Date(pr.date).toLocaleDateString()}</td>
                  <td>{formatCurrency(pr.total_gross, 'USD')}</td>
                  <td style={{ fontWeight: 700 }}>{formatCurrency(pr.total_net, 'USD')}</td>
                  <td>
                    <span className="badge badge-success">
                      <CheckIcon size={12} /> Complete
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Where Your Team Lives Side Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>

          <div className={`card ${styles.distributionCard}`}>
            <div className={styles.cardHeader}>
              <h3>Where your team lives</h3>
            </div>
            <div className={styles.countryList}>
              {loading ? (
                <>
                  <div className="skeleton skeleton-row" style={{ height: '32px' }}></div>
                  <div className="skeleton skeleton-row" style={{ height: '32px' }}></div>
                </>
              ) : distribution.length === 0 ? (
                <div style={{textAlign: 'center', padding:'2rem'}}>
                  <div style={{opacity:0.3,marginBottom:'0.5rem', display: 'flex', justifyContent: 'center'}}><Globe size={48} /></div>
                  <p style={{color: 'var(--text-secondary)'}}>No team members added yet.</p>
                </div>
              ) : distribution.map(c => (
                <div key={c.country} className={styles.countryItem}>
                  <div className={styles.countryInfo}>
                    {getFlag(c.country)}
                    <span>{c.country}</span>
                    <span className={styles.countryCount}>{c.employees}</span>
                  </div>
                  <div className="progress-container" style={{ height: '6px', marginTop: '4px' }}>
                    <div className="progress-fill" style={{ width: `${c.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.quickActions}>
        <Link href="/employer/employees" className={`card card-interactive ${styles.actionCard}`}>
          <span className={styles.actionIcon}><Users size={24} /></span>
          <span className={styles.actionLabel}>View Roster</span>
        </Link>
        <Link href="/employer/wallet" className={`card card-interactive ${styles.actionCard}`}>
          <span className={styles.actionIcon}><Coins size={24} /></span>
          <span className={styles.actionLabel}>Fund Wallet</span>
        </Link>
        <Link href="/employer/compliance" className={`card card-interactive ${styles.actionCard}`}>
          <span className={styles.actionIcon}><ShieldCheck size={24} /></span>
          <span className={styles.actionLabel}>Taxes & Compliance</span>
        </Link>
      </div>
    </div>
  );
}
