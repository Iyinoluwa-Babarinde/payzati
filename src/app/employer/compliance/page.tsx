'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Download, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Globe, 
  FileText, 
  Info, 
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getCompany } from '@/lib/supabase/queries';
import { calculateTax } from '@/lib/tax-engine';
import { formatCurrency } from '@/lib/fx-engine';

// Custom Vector SVG Flags (no emojis)
function FlagNG({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ borderRadius: '50%', display: 'inline-block', verticalAlign: 'middle' }}>
      <circle cx="12" cy="12" r="12" fill="#008751" />
      <rect x="8" y="0" width="8" height="24" fill="#FFFFFF" />
    </svg>
  );
}

function FlagKE({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ borderRadius: '50%', display: 'inline-block', verticalAlign: 'middle' }}>
      <circle cx="12" cy="12" r="12" fill="#000000" />
      <rect x="0" y="6" width="24" height="12" fill="#FF0000" />
      <rect x="0" y="12" width="24" height="6" fill="#006600" />
      <path d="M10 12 L12 8 L14 12 L12 16 Z" fill="#FFFFFF" />
    </svg>
  );
}

function FlagGH({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ borderRadius: '50%', display: 'inline-block', verticalAlign: 'middle' }}>
      <circle cx="12" cy="12" r="12" fill="#E2231A" />
      <rect x="0" y="8" width="24" height="16" fill="#FCD116" />
      <rect x="0" y="16" width="24" height="8" fill="#006B3F" />
      <polygon points="12,10 13.5,13 16.5,13 14,15 15,18 12,16 9,18 10,15 7.5,13 10.5,13" fill="#000000" />
    </svg>
  );
}

function FlagZA({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ borderRadius: '50%', display: 'inline-block', verticalAlign: 'middle' }}>
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
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ borderRadius: '50%', display: 'inline-block', verticalAlign: 'middle' }}>
      <circle cx="12" cy="12" r="12" fill="#C8102E" />
      <rect x="0" y="8" width="24" height="8" fill="#FFFFFF" />
      <rect x="0" y="16" width="24" height="8" fill="#000000" />
    </svg>
  );
}

function FlagUS({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ borderRadius: '50%', display: 'inline-block', verticalAlign: 'middle' }}>
      <circle cx="12" cy="12" r="12" fill="#1b2347" />
      <rect x="0" y="2" width="24" height="2" fill="#b11a21" />
      <rect x="0" y="6" width="24" height="2" fill="#b11a21" />
      <rect x="0" y="10" width="24" height="2" fill="#b11a21" />
      <rect x="0" y="14" width="24" height="2" fill="#b11a21" />
      <rect x="0" y="18" width="24" height="2" fill="#b11a21" />
      <rect x="0" y="22" width="24" height="2" fill="#b11a21" />
      <rect x="0" y="0" width="10" height="10" fill="#1b2347" />
      <circle cx="5" cy="5" r="2.5" fill="#FFFFFF" />
    </svg>
  );
}

function FlagGB({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ borderRadius: '50%', display: 'inline-block', verticalAlign: 'middle' }}>
      <circle cx="12" cy="12" r="12" fill="#012169" />
      <line x1="0" y1="0" x2="24" y2="24" stroke="#FFFFFF" strokeWidth="3" />
      <line x1="0" y1="24" x2="24" y2="0" stroke="#FFFFFF" strokeWidth="3" />
      <line x1="0" y1="0" x2="24" y2="24" stroke="#C8102E" strokeWidth="1" />
      <line x1="0" y1="24" x2="24" y2="0" stroke="#C8102E" strokeWidth="1" />
      <rect x="10" y="0" width="4" height="24" fill="#FFFFFF" />
      <rect x="0" y="10" width="24" height="4" fill="#FFFFFF" />
      <rect x="11" y="0" width="2" height="24" fill="#C8102E" />
      <rect x="0" y="11" width="24" height="2" fill="#C8102E" />
    </svg>
  );
}

function FlagDE({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ borderRadius: '50%', display: 'inline-block', verticalAlign: 'middle' }}>
      <circle cx="12" cy="12" r="12" fill="#000000" />
      <rect x="0" y="8" width="24" height="16" fill="#DD0000" />
      <rect x="0" y="16" width="24" height="8" fill="#FFCC00" />
    </svg>
  );
}

const getFlag = (country: string, size = 16) => {
  const c = country.toLowerCase();
  if (c.includes('nigeria')) return <FlagNG size={size} />;
  if (c.includes('kenya')) return <FlagKE size={size} />;
  if (c.includes('ghana')) return <FlagGH size={size} />;
  if (c.includes('south africa')) return <FlagZA size={size} />;
  if (c.includes('egypt')) return <FlagEG size={size} />;
  if (c.includes('united states') || c === 'us' || c.includes('america')) return <FlagUS size={size} />;
  if (c.includes('united kingdom') || c === 'gb' || c === 'uk' || c.includes('britain')) return <FlagGB size={size} />;
  if (c.includes('germany') || c === 'de') return <FlagDE size={size} />;
  return <Globe size={size} color="var(--text-secondary)" style={{ verticalAlign: 'middle' }} />;
};

const SCHEME_PREVIEWS = [
  { country: 'Nigeria', taxes: 'PAYE Income Tax, Pension (8%), National Housing Fund (NHF 2.5%), National Health Insurance Scheme (NHIS 5%)' },
  { country: 'Kenya', taxes: 'PAYE Income Tax, SHIF Medical (2.75%), NSSF Pension, Housing Levy (1.5%)' },
  { country: 'Ghana', taxes: 'PAYE Income Tax, SSNIT Pension (5.5%), Tier 2 Pension (5%)' },
  { country: 'South Africa', taxes: 'PAYE Income Tax, UIF (1%), SDL (1% Employer contribution)' },
  { country: 'Egypt', taxes: 'PAYE Income Tax, Social Insurance (11%)' },
  { country: 'United States', taxes: 'Federal & State Income Tax Withholding, FICA (Social Security & Medicare)' },
  { country: 'United Kingdom', taxes: 'PAYE Income Tax, National Insurance Contributions (NICs)' },
  { country: 'Germany', taxes: 'Lohnsteuer (Income Tax), Solidaritätszuschlag (Solidarity Surcharge), Pension, Health, Care, & Unemployment Insurances' }
];

export default function CompliancePage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReportCountry, setSelectedReportCountry] = useState<string | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const company = await getCompany();
      if (!company) {
        setLoading(false);
        return;
      }
      setCompanyId(company.id);

      const { data: empData } = await supabase
        .from('employees')
        .select('*')
        .eq('company_id', company.id);

      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('company_id', company.id)
        .eq('type', 'payroll')
        .eq('status', 'completed');

      if (empData) setEmployees(empData);
      if (txData) setTransactions(txData);
      setLoading(false);
    }
    loadData();

    const handleGlobalClick = () => {
      setActiveTooltip(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Calculate Next Deadline (the 15th of current/next month)
  const getNextDeadlineDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();
    
    let deadlineMonth = month;
    if (day > 15) {
      deadlineMonth += 1;
    }
    
    return new Date(year, deadlineMonth, 15).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Group active employees by country
  const countryGroups = employees.reduce((groups: Record<string, any[]>, emp) => {
    const country = emp.country;
    if (!groups[country]) groups[country] = [];
    groups[country].push(emp);
    return groups;
  }, {});

  // Compute compliance row details for each country represented
  const complianceRecords = Object.keys(countryGroups).map(countryName => {
    const countryEmployees = countryGroups[countryName];

    // Find all payroll runs (transactions) completed for employees in this country
    const countryEmployeeIds = countryEmployees.map(e => e.id);
    const countryTxs = transactions.filter(tx => tx.employee_id && countryEmployeeIds.includes(tx.employee_id));

    // Calculate sum of taxes paid
    let totalTaxPaid = 0;
    let lastFiledDateStr = 'No filing yet';

    if (countryTxs.length > 0) {
      // Find latest date
      const latestTx = countryTxs.reduce((latest, tx) => new Date(tx.date) > new Date(latest.date) ? tx : latest, countryTxs[0]);
      lastFiledDateStr = new Date(latestTx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // For each completed transaction, compute its proportional tax
      countryTxs.forEach(tx => {
        const emp = countryEmployees.find(e => e.id === tx.employee_id);
        if (emp) {
          const taxInfo = calculateTax(emp.salary, emp.country, emp.currency);
          totalTaxPaid += taxInfo.totalDeductions;
        }
      });
    }

    const hasPayrolls = countryTxs.length > 0;
    const currency = countryEmployees[0].currency;

    return {
      country: countryName,
      employeesCount: countryEmployees.length,
      status: hasPayrolls ? 'compliant' : 'pending',
      lastFiled: lastFiledDateStr,
      nextDeadline: getNextDeadlineDate(),
      totalTaxPaid,
      currency,
      employees: countryEmployees,
      txCount: countryTxs.length
    };
  });

  const selectedReport = selectedReportCountry ? complianceRecords.find(r => r.country === selectedReportCountry) : null;

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading compliance dashboard...</div>;
  }

  // Render onboarding/empty state if there are no employees added
  if (employees.length === 0) {
    return (
      <div className="animate-fade-in" style={{ maxWidth: '960px', margin: '0 auto' }}>
        <div className="page-header" style={{ marginBottom: '2rem' }}>
          <div>
            <h1 className="page-title">Tax & Compliance</h1>
            <p className="page-subtitle">Fully automated compliance, tax deductions, and local filings.</p>
          </div>
        </div>

        {/* Clear explanations panel */}
        <div className="card" style={{ background: 'var(--elevation-1)', padding: '2rem', marginBottom: '2rem', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
            <div style={{ background: 'var(--accent-teal-dim)', padding: '1rem', borderRadius: 'var(--radius-md)', color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={28} />
            </div>
            <div>
              <h3 style={{ marginBottom: '0.75rem' }}>How Automated Tax Compliance Works</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: 'var(--text-sm)' }}>
                Payzati operates localized compliance engines for global hires. Every time you process payroll, 
                our system auto-calculates employee income tax (PAYE), local pension rates, and state-mandated 
                health levies.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Calendar size={18} color="var(--accent-teal)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ fontSize: '0.875rem' }}>Filing Calendar</strong>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>Deductions are automatically processed and filed with local authorities on the 15th of each month.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Layers size={18} color="var(--accent-teal)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ fontSize: '0.875rem' }}>Split Remittance</strong>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>Net payouts route instantly to employees, while tax pools are locked in escrow for statutory submission.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Supported schemes flag row with hoverable glassmorphic tooltips */}
        <div className="card" style={{ background: 'var(--elevation-1)', padding: '2rem', marginBottom: '2rem', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
          <h4 style={{ marginBottom: '1.25rem', color: 'var(--text-secondary)' }}>Tap or hover flags to check localized tax schemes:</h4>
          
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '1.5rem', 
            justifyContent: 'center', 
            alignItems: 'center', 
            padding: '0.5rem 0' 
          }}>
            {SCHEME_PREVIEWS.map(s => {
              const isTooltipActive = activeTooltip === s.country;
              return (
                <div 
                  key={s.country}
                  style={{ position: 'relative', display: 'inline-block' }}
                  onMouseEnter={() => setActiveTooltip(s.country)}
                  onMouseLeave={() => setActiveTooltip(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTooltip(isTooltipActive ? null : s.country);
                  }}
                >
                  <div 
                    style={{ 
                      cursor: 'pointer', 
                      padding: '10px', 
                      borderRadius: '50%', 
                      background: isTooltipActive ? 'var(--elevation-2)' : 'transparent',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: isTooltipActive ? 'scale(1.15)' : 'scale(1)',
                      border: isTooltipActive ? '1px solid var(--accent-teal)' : '1px solid var(--border-default)',
                      boxShadow: isTooltipActive ? '0 0 15px rgba(0, 212, 170, 0.25)' : 'none'
                    }}
                  >
                    {getFlag(s.country, 32)}
                  </div>
                  
                  {/* Glassmorphic Pill Tooltip */}
                  <div 
                    style={{
                      position: 'absolute',
                      bottom: '125%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '280px',
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(18, 24, 38, 0.9)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      boxShadow: 'var(--shadow-lg), 0 0 30px rgba(0,0,0,0.5)',
                      zIndex: 100,
                      pointerEvents: isTooltipActive ? 'auto' : 'none',
                      opacity: isTooltipActive ? 1 : 0,
                      visibility: isTooltipActive ? 'visible' : 'hidden',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      transformOrigin: 'bottom center',
                      textAlign: 'left'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', gap: '6px' }}>
                      {getFlag(s.country, 16)}
                      <strong style={{ fontSize: '0.875rem', color: '#ffffff' }}>{s.country}</strong>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      <strong style={{ color: 'var(--accent-teal)' }}>Automated Contributions:</strong>
                      <div style={{ marginTop: '4px', color: 'var(--text-primary)' }}>{s.taxes}</div>
                    </div>
                    
                    {/* Tooltip Arrow */}
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 0,
                      height: 0,
                      borderLeft: '6px solid transparent',
                      borderRight: '6px solid transparent',
                      borderTop: '6px solid rgba(18, 24, 38, 0.9)',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Empty state panel */}
        <div className="card" style={{ 
          textAlign: 'center', 
          padding: '4rem 2rem', 
          background: 'var(--elevation-1)', 
          border: '1px dashed var(--border-default)',
          borderRadius: 'var(--radius-lg)' 
        }}>
          <Globe size={48} color="var(--text-tertiary)" style={{ margin: '0 auto 1.5rem' }} />
          <h2 style={{ marginBottom: '0.75rem', fontWeight: 600 }}>No Active Tax Registrations</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 2rem', fontSize: 'var(--text-sm)', lineHeight: '1.5' }}>
            To generate compliance tables and auto-filing schedules, you need to add your first global employee. 
            We will register their country under your tax dashboard immediately.
          </p>
          <Link href="/employer/employees" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            Add Global Employee <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  // Active status count calculations
  const totalTaxAllCountriesUSD = complianceRecords.reduce((sum, r) => {
    let usdTax = r.totalTaxPaid;
    if (r.currency === 'NGN') usdTax = r.totalTaxPaid / 1550;
    else if (r.currency === 'KES') usdTax = r.totalTaxPaid / 130;
    else if (r.currency === 'GHS') usdTax = r.totalTaxPaid / 12;
    else if (r.currency === 'ZAR') usdTax = r.totalTaxPaid / 18;
    else if (r.currency === 'EGP') usdTax = r.totalTaxPaid / 31;
    return sum + usdTax;
  }, 0);

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Tax & Compliance</h1>
          <p className="page-subtitle">Auto-calculated filing logs and statutory distributions.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => alert('Downloading consolidated compliance zip...')}>
          <Download size={16} /> Download CSV Logs
        </button>
      </div>

      {/* Explanatory Info Alert */}
      <div className="card" style={{ background: 'var(--elevation-1)', padding: '1rem 1.25rem', marginBottom: '2rem', display: 'flex', gap: '0.75rem', alignItems: 'center', borderLeft: '3px solid var(--accent-teal)' }}>
        <Info size={16} color="var(--accent-teal)" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          <strong>Automated Filings:</strong> Payzati holds statutory taxes in escrow and remits them automatically to local tax authorities on the <strong>15th of every month</strong>.
        </span>
      </div>

      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ background: 'var(--elevation-1)' }}>
          <div className="stat-card">
            <span className="stat-label">Covered Markets</span>
            <span className="stat-value">{complianceRecords.length}</span>
          </div>
        </div>
        <div className="card" style={{ background: 'var(--elevation-1)' }}>
          <div className="stat-card">
            <span className="stat-label">Total Remitted (USD Equiv.)</span>
            <span className="stat-value" style={{ color: 'var(--accent-teal)' }}>${Math.round(totalTaxAllCountriesUSD).toLocaleString()}</span>
          </div>
        </div>
        <div className="card" style={{ background: 'var(--elevation-1)' }}>
          <div className="stat-card">
            <span className="stat-label">Next Filing Cutoff</span>
            <span className="stat-value" style={{ fontSize: '1.25rem', color: 'var(--status-warning)' }}>{getNextDeadlineDate()}</span>
          </div>
        </div>
      </div>

      {/* Supported schemes flag row with hoverable glassmorphic tooltips (also shown when active records are present for convenience) */}
      <div className="card" style={{ background: 'var(--elevation-1)', padding: '1.25rem 2rem', marginBottom: '2rem', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', justifyContent: 'center', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Supported tax schemes:</span>
          {SCHEME_PREVIEWS.map(s => {
            const isTooltipActive = activeTooltip === s.country;
            return (
              <div 
                key={s.country}
                style={{ position: 'relative', display: 'inline-block' }}
                onMouseEnter={() => setActiveTooltip(s.country)}
                onMouseLeave={() => setActiveTooltip(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTooltip(isTooltipActive ? null : s.country);
                }}
              >
                <div 
                  style={{ 
                    cursor: 'pointer', 
                    padding: '6px', 
                    borderRadius: '50%', 
                    background: isTooltipActive ? 'var(--elevation-2)' : 'transparent',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: isTooltipActive ? 'scale(1.15)' : 'scale(1)',
                    border: isTooltipActive ? '1px solid var(--accent-teal)' : '1px solid var(--border-default)',
                  }}
                >
                  {getFlag(s.country, 24)}
                </div>
                
                {/* Glassmorphic Pill Tooltip */}
                <div 
                  style={{
                    position: 'absolute',
                    bottom: '135%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '280px',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(18, 24, 38, 0.9)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: 'var(--shadow-lg), 0 0 30px rgba(0,0,0,0.5)',
                    zIndex: 100,
                    pointerEvents: isTooltipActive ? 'auto' : 'none',
                    opacity: isTooltipActive ? 1 : 0,
                    visibility: isTooltipActive ? 'visible' : 'hidden',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    transformOrigin: 'bottom center',
                    textAlign: 'left'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', gap: '6px' }}>
                    {getFlag(s.country, 16)}
                    <strong style={{ fontSize: '0.875rem', color: '#ffffff' }}>{s.country}</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    <strong style={{ color: 'var(--accent-teal)' }}>Automated Contributions:</strong>
                    <div style={{ marginTop: '4px', color: 'var(--text-primary)' }}>{s.taxes}</div>
                  </div>
                  
                  {/* Tooltip Arrow */}
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderTop: '6px solid rgba(18, 24, 38, 0.9)',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'var(--elevation-1)' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Country</th>
              <th>Status</th>
              <th>Active Employees</th>
              <th>Last Filing Date</th>
              <th>Next Filing Deadline</th>
              <th>Total Tax Paid</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {complianceRecords.map((r, i) => (
              <tr key={r.country} className="animate-slide-up" style={{ animationDelay: `${0.05 * i}s`, opacity: 0, animationFillMode: 'forwards' }}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {getFlag(r.country, 18)}
                    <strong style={{ marginLeft: '6px' }}>{r.country}</strong>
                  </div>
                </td>
                <td>
                  <span className={`badge ${r.status === 'compliant' ? 'badge-success' : 'badge-warning'}`}>
                    {r.status === 'compliant' ? (
                      <><CheckCircle size={12} style={{ marginRight: '2px' }} /> Compliant</>
                    ) : (
                      <><AlertTriangle size={12} style={{ marginRight: '2px' }} /> No Active Payroll</>
                    )}
                  </span>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{r.employeesCount} {r.employeesCount === 1 ? 'employee' : 'employees'}</td>
                <td>{r.lastFiled}</td>
                <td>{r.nextDeadline}</td>
                <td style={{ fontWeight: 700 }}>{formatCurrency(r.totalTaxPaid, r.currency)}</td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelectedReportCountry(r.country)}>View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dynamic Detail Modal */}
      {selectedReport && (
        <div className="modal-overlay" onClick={() => setSelectedReportCountry(null)}>
          <div className="modal-content" style={{ maxWidth: '750px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {getFlag(selectedReport.country, 22)}
                <h3 style={{ marginLeft: '6px' }}>{selectedReport.country} Compliance & Tax Roster</h3>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setSelectedReportCountry(null)}><X size={16} /></button>
            </div>
            
            <div style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', background: 'var(--elevation-2)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '2px' }}>Roster Size</div>
                <strong>{selectedReport.employeesCount} Active Hires</strong>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '2px' }}>Total Remitted</div>
                <strong style={{ color: 'var(--accent-teal)' }}>{formatCurrency(selectedReport.totalTaxPaid, selectedReport.currency)}</strong>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '2px' }}>Filing Interval</div>
                <strong>Monthly (Every 15th)</strong>
              </div>
            </div>

            <h4 style={{ marginBottom: '0.75rem' }}>Local Employee Breakdowns</h4>
            <div style={{ maxHeight: '240px', overflowY: 'auto', marginBottom: '1.5rem', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
              <table className="data-table" style={{ width: '100%', fontSize: 'var(--text-xs)' }}>
                <thead>
                  <tr style={{ background: 'var(--elevation-2)' }}>
                    <th>Employee</th>
                    <th>Salary (Gross)</th>
                    <th>PAYE Tax</th>
                    <th>Pensions/Social</th>
                    <th>Net Payout</th>
                    <th>Payments Run</th>
                    <th>Total Remitted</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedReport.employees.map((emp: any) => {
                    const taxInfo = calculateTax(emp.salary, emp.country, emp.currency);
                    
                    // Count transactions for this employee
                    const empTxs = transactions.filter(t => t.employee_id === emp.id);
                    const txCount = empTxs.length;
                    const totalEmpRemitted = taxInfo.totalDeductions * txCount;

                    const pensionDeduction = taxInfo.socialContributions.reduce((sum: number, c: any) => sum + c.amount, 0);

                    return (
                      <tr key={emp.id}>
                        <td><strong>{emp.name}</strong></td>
                        <td>{formatCurrency(emp.salary, emp.currency)}</td>
                        <td style={{ color: 'var(--status-warning)' }}>{formatCurrency(taxInfo.incomeTax, emp.currency)}</td>
                        <td style={{ color: 'var(--status-warning)' }}>{formatCurrency(pensionDeduction, emp.currency)}</td>
                        <td style={{ color: 'var(--accent-teal)' }}>{formatCurrency(taxInfo.netSalary, emp.currency)}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center' }}>{txCount}</td>
                        <td style={{ fontWeight: 700 }}>{formatCurrency(totalEmpRemitted, emp.currency)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {selectedReport.status === 'pending' ? (
              <div style={{ padding: '1rem', background: 'rgba(255,170,0,0.06)', border: '1px solid rgba(255,170,0,0.2)', borderRadius: 'var(--radius-md)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <AlertTriangle size={16} color="var(--status-warning)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  No payroll payments have been completed yet for {selectedReport.country}. Run payroll to initiate the first tax filings.
                </span>
              </div>
            ) : (
              <div style={{ padding: '1rem', background: 'var(--accent-teal-dim)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 'var(--radius-md)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <ShieldCheck size={16} color="var(--accent-teal)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  All local tax and compliance filings for {selectedReport.country} are fully automated and managed via Payzati&apos;s Interledger Settlement layers.
                </span>
              </div>
            )}

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedReportCountry(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => alert('Generating localized PDF statement...')}>
                <FileText size={16} /> Download Tax Statement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
