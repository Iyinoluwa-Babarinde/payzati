'use client';

import { useState, useEffect } from 'react';
import { SUPPORTED_COUNTRIES } from '@/lib/tax-engine';
import { formatCurrency } from '@/lib/fx-engine';
import { createClient } from '@/lib/supabase/client';
import { getCompany } from '@/lib/supabase/queries';
import toast from 'react-hot-toast';
import { 
  Users, 
  Search, 
  Link2, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Globe, 
  FileText, 
  ArrowRight,
  AlertCircle,
  X
} from 'lucide-react';

// Circular Flag SVGs replacing emojis
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

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [newEmp, setNewEmp] = useState({ name: '', email: '', country: 'Nigeria', currency: 'NGN', salary: '' });
  const [approveData, setApproveData] = useState({ country: 'Nigeria', currency: 'NGN', salary: '' });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'pending'>('active');
  const supabase = createClient();

  useEffect(() => {
    async function fetchEmployees() {
      const comp = await getCompany();
      if (comp) {
        setCompany(comp);
        const { data } = await supabase.from('employees').select('*').eq('company_id', comp.id);
        if (data) setEmployees(data);
      }
      setLoading(false);
    }
    fetchEmployees();

    const supabaseClient = createClient();
    const channel = supabaseClient.channel('employer_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, () => {
        fetchEmployees();
      })
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, []);

  const activeEmployees = employees.filter(e => e.status === 'active' && (
    e.name.toLowerCase().includes(search.toLowerCase()) || 
    e.country.toLowerCase().includes(search.toLowerCase()) ||
    e.status.toLowerCase().includes(search.toLowerCase())
  ));
  const pendingEmployees = employees.filter(e => e.status === 'on_leave');
  const pendingBankChanges = employees.filter(e => e.pending_bank_details != null);

  const handleAdd = async () => {
    if (!newEmp.name || !newEmp.email || !newEmp.salary || !company) return;
    
    const defaultWallet = `https://ilp.interledger-test.dev/${newEmp.name.toLowerCase().replace(/\s/g, '-')}`;

    const { data, error } = await supabase.from('employees').insert({
      company_id: company.id,
      name: newEmp.name,
      email: newEmp.email,
      country: newEmp.country,
      currency: newEmp.currency,
      salary: Number(newEmp.salary),
      wallet_address: defaultWallet,
      status: 'active'
    }).select().single();

    if (!error && data) {
      setEmployees([...employees, data]);
      setNewEmp({ name: '', email: '', country: 'Nigeria', currency: 'NGN', salary: '' });
      setShowModal(false);
      toast.success(`${newEmp.name} added to the roster`);
    } else {
      toast.error("Error adding employee: " + error?.message);
    }
  };

  const handleAcknowledge = async (id: string) => {
    const { data, error } = await supabase.from('employees').update({
      onboarding_step: 'reviewed'
    }).eq('id', id).select().single();
    
    if (!error && data) {
      setEmployees(employees.map(e => e.id === data.id ? data : e));
    }
  };

  const handleProposeSalary = async () => {
    if (!approveData.salary || !showApproveModal) return;

    const stepToSet = showApproveModal.onboarding_step === 'negotiation_emp_1' 
      ? 'negotiation_hr_final' 
      : 'salary_proposed';

    const { data, error } = await supabase.from('employees').update({
      country: approveData.country,
      currency: approveData.currency,
      salary: Number(approveData.salary),
      onboarding_step: stepToSet
    }).eq('id', showApproveModal.id).select().single();

    if (!error && data) {
      setEmployees(employees.map(e => e.id === data.id ? data : e));
      setShowApproveModal(null);
    } else {
      alert("Error proposing salary: " + error?.message);
    }
  };

  const handleAcceptCounter = async (id: string) => {
    const { data, error } = await supabase.from('employees').update({
      status: 'active',
      onboarding_step: 'completed'
    }).eq('id', id).select().single();

    if (!error && data) {
      setEmployees(employees.map(e => e.id === data.id ? data : e));
    } else {
      alert("Error accepting counter offer: " + error?.message);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('employees').delete().eq('id', id);
    setEmployees(employees.filter(e => e.id !== id));
  };

  const handleApproveBankChange = async (id: string, details: any) => {
    const { data, error } = await supabase.from('employees').update({
      bank_name: details.bank_name,
      bank_account_number: details.bank_account_number,
      pending_bank_details: null
    }).eq('id', id).select().single();

    if (!error && data) {
      setEmployees(employees.map(e => e.id === data.id ? data : e));
    } else {
      alert("Error approving bank change: " + error?.message);
    }
  };

  const handleRejectBankChange = async (id: string) => {
    const { data, error } = await supabase.from('employees').update({
      pending_bank_details: null
    }).eq('id', id).select().single();

    if (!error && data) {
      setEmployees(employees.map(e => e.id === data.id ? data : e));
    }
  };

  const inviteCode = company ? `${company.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${company.id.substring(0, 6)}` : '';

  const copyInviteCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      toast.success('Invite code copied!');
    }
  };

  const getFlag = (country: string) => {
    switch(country.toLowerCase()) {
      case 'nigeria': return <FlagNG />;
      case 'kenya': return <FlagKE />;
      case 'ghana': return <FlagGH />;
      case 'south africa': return <FlagZA />;
      case 'egypt': return <FlagEG />;
      default: return <Globe size={14} color="var(--text-secondary)" />;
    }
  };

  // Clickable search suggestions
  const searchSuggestions = ['Nigeria', 'Kenya', 'Active', 'Ghana'];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">The Roster</h1>
          <p className="page-subtitle">Your cross-border team accounts.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={copyInviteCode}>
            <Link2 size={16} /> Copy Invite Code
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Add Employee
          </button>
        </div>
      </div>

      {company && (
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', background: 'var(--elevation-1)' }}>
          <div>
            <strong>Organization Invite Code</strong>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', marginTop: '2px' }}>Share this code with employees to link their accounts directly.</p>
          </div>
          <div style={{ background: 'var(--elevation-2)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-md)', color: 'var(--accent-teal)', fontWeight: 700, border: '1px solid var(--border-default)' }}>
            {inviteCode}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
        <button className="btn" style={{ 
          background: activeTab === 'active' ? 'var(--elevation-2)' : 'transparent',
          color: activeTab === 'active' ? 'var(--text-primary)' : 'var(--text-secondary)',
          border: '1px solid transparent',
          borderBottomColor: activeTab === 'active' ? 'var(--accent-teal)' : 'transparent',
          borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
          fontWeight: activeTab === 'active' ? 700 : 400
        }} onClick={() => setActiveTab('active')}>
          Active Roster ({activeEmployees.length})
        </button>
        <button className="btn" style={{ 
          background: activeTab === 'pending' ? 'var(--elevation-2)' : 'transparent',
          color: activeTab === 'pending' ? 'var(--text-primary)' : 'var(--text-secondary)',
          border: '1px solid transparent',
          borderBottomColor: activeTab === 'pending' ? 'var(--accent-teal)' : 'transparent',
          borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
          fontWeight: activeTab === 'pending' ? 700 : 400
        }} onClick={() => setActiveTab('pending')}>
          Pending ({pendingEmployees.length + pendingBankChanges.length})
          {(pendingEmployees.length + pendingBankChanges.length) > 0 && (
            <span style={{ background: 'var(--status-error)', color: 'white', padding: '1px 6px', borderRadius: '10px', fontSize: '0.65rem', marginLeft: '0.25rem', fontWeight: 700 }}>
              {pendingEmployees.length + pendingBankChanges.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'active' && (
        <>
          {/* Search Box with pre-populated suggestions */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative', maxWidth: '400px' }}>
              <input 
                type="text" 
                placeholder="Search roster..." 
                value={search}
                onChange={e => setSearch(e.target.value)} 
                style={{ paddingLeft: '2.5rem' }}
              />
              <Search size={16} color="var(--text-tertiary)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
            
            {/* Search Suggestions badges */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Suggestions:</span>
              {searchSuggestions.map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => setSearch(suggestion)}
                  style={{
                    background: 'var(--elevation-1)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-secondary)',
                    borderRadius: '100px',
                    padding: '2px 10px',
                    fontSize: 'var(--text-xs)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent-teal)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  {suggestion}
                </button>
              ))}
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--status-error)', fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: '2px', cursor: 'pointer' }}
                >
                  <X size={12} /> Clear
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              <div className="skeleton" style={{ height: '180px', borderRadius: 'var(--radius-lg)' }}></div>
              <div className="skeleton" style={{ height: '180px', borderRadius: 'var(--radius-lg)' }}></div>
            </div>
          ) : activeEmployees.length === 0 ? (
            /* Blank state onboarding engine card */
            <div className="card" style={{ padding: '3rem', textAlign: 'center', background: 'var(--elevation-1)' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent-teal-dim)', color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <Users size={32} />
              </div>
              <h3 style={{ marginBottom: '0.5rem' }}>Roster is empty</h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 2rem', fontSize: 'var(--text-sm)', lineHeight: '1.5' }}>
                Add your first employee manually, or share your organization invite code so they can join and onboard themselves.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                  <Plus size={16} /> Add Employee
                </button>
                <button className="btn btn-secondary" onClick={copyInviteCode}>
                  <Link2 size={16} /> Copy Invite Code
                </button>
              </div>
            </div>
          ) : (
            /* Visual Card Grid instead of a cheap list table */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {activeEmployees.map((emp, i) => (
                <div 
                  key={emp.id} 
                  className="card card-interactive animate-slide-up" 
                  style={{ animationDelay: `${i * 0.05}s`, opacity: 0, animationFillMode: 'forwards', background: 'var(--elevation-1)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '210px' }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <h4 style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>{emp.name}</h4>
                        <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>{emp.email}</span>
                      </div>
                      <span className={`badge ${emp.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                        {emp.status === 'active' ? 'Active' : 'On Leave'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', margin: '0.75rem 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                        {getFlag(emp.country)}
                        <span>{emp.country}</span>
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                        {emp.wallet_address.substring(0, 32)}...
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', marginTop: 'auto' }}>
                    <div>
                      <small style={{ display: 'block', color: 'var(--text-tertiary)', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 700 }}>Monthly gross</small>
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {formatCurrency(emp.salary, emp.currency)}
                      </span>
                    </div>
                    
                    <button 
                      className="btn btn-danger btn-sm" 
                      onClick={() => handleDelete(emp.id)}
                      style={{ padding: '0 8px', height: '28px' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'pending' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Pending Onboarding Cards */}
          <div className="card" style={{ background: 'var(--elevation-1)', padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Pending Team Onboardings</h3>
            
            {pendingEmployees.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', padding: '1rem 0', fontSize: 'var(--text-sm)' }}>No pending onboarding requests.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                {pendingEmployees.map(emp => (
                  <div key={emp.id} className="card" style={{ background: 'var(--elevation-2)', border: '1px solid var(--border-default)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <h4 style={{ fontSize: 'var(--text-sm)' }}>{emp.name}</h4>
                        <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>{emp.email}</span>
                      </div>
                      <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
                        {emp.onboarding_step === 'requested' ? 'New Request' : 
                         emp.onboarding_step === 'reviewed' ? 'Reviewing' : 
                         emp.onboarding_step === 'salary_proposed' ? 'Offer Sent' : 
                         emp.onboarding_step === 'negotiation_emp_1' ? 'Counter Offer' : 
                         emp.onboarding_step === 'negotiation_hr_final' ? 'Awaiting Answer' : 'Pending'}
                      </span>
                    </div>

                    <div style={{ margin: '0.75rem 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        {getFlag(emp.country)}
                        <span>{emp.country}</span>
                      </div>
                      {emp.onboarding_step === 'negotiation_emp_1' && (
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-teal)', fontWeight: 700 }}>
                          Counter: {formatCurrency(emp.salary, emp.currency)}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                      {(!emp.onboarding_step || emp.onboarding_step === 'requested') && (
                        <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => handleAcknowledge(emp.id)}>Acknowledge</button>
                      )}
                      
                      {emp.onboarding_step === 'reviewed' && (
                        <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => {
                          setApproveData({ country: emp.country, currency: emp.currency, salary: '' });
                          setShowApproveModal(emp);
                        }}>Propose Salary</button>
                      )}

                      {emp.onboarding_step === 'negotiation_emp_1' && (
                        <>
                          <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => handleAcceptCounter(emp.id)}>Accept Counter</button>
                          <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => {
                            setApproveData({ country: emp.country, currency: emp.currency, salary: '' });
                            setShowApproveModal(emp);
                          }}>Final Offer</button>
                        </>
                      )}

                      {(emp.onboarding_step === 'salary_proposed' || emp.onboarding_step === 'negotiation_hr_final') && (
                         <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontStyle: 'italic', margin: 'auto 0' }}>Awaiting response</span>
                      )}
                      
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(emp.id)}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Bank Info Updates */}
          {pendingBankChanges.length > 0 && (
            <div className="card" style={{ background: 'var(--elevation-1)', padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--status-warning)' }}>Bank Change Requests</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                {pendingBankChanges.map(emp => (
                  <div key={`bank-${emp.id}`} className="card" style={{ background: 'var(--elevation-2)', border: '1px solid var(--border-default)' }}>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <h4 style={{ fontSize: 'var(--text-sm)' }}>{emp.name}</h4>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>{emp.email}</span>
                    </div>

                    <div style={{ background: 'var(--elevation-1)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', borderLeft: '3px solid var(--accent-teal)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Proposed Bank Info</span>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginTop: '2px' }}>{emp.pending_bank_details.bank_name}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{emp.pending_bank_details.bank_account_number}</div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                      <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => handleApproveBankChange(emp.id, emp.pending_bank_details)}>Approve</button>
                      <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => handleRejectBankChange(emp.id)}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Manual Employee Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Employee</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)' }}>Full Name</label>
                <input placeholder="Name" value={newEmp.name} onChange={e => setNewEmp({ ...newEmp, name: e.target.value })} />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)' }}>Email</label>
                <input type="email" placeholder="email@company.com" value={newEmp.email} onChange={e => setNewEmp({ ...newEmp, email: e.target.value })} />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)' }}>Country</label>
                <select value={newEmp.country} onChange={e => {
                  const c = SUPPORTED_COUNTRIES.find(sc => sc.name === e.target.value);
                  setNewEmp({ ...newEmp, country: e.target.value, currency: c?.currency || 'USD' });
                }}>
                  {SUPPORTED_COUNTRIES.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)' }}>Monthly Salary ({newEmp.currency})</label>
                <input type="number" placeholder="Amount" value={newEmp.salary} onChange={e => setNewEmp({ ...newEmp, salary: e.target.value })} />
              </div>
              
              <button className="btn btn-primary btn-lg" onClick={handleAdd}>Add Employee</button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Pending Employee Modal */}
      {showApproveModal && (
        <div className="modal-overlay" onClick={() => setShowApproveModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{showApproveModal.onboarding_step === 'negotiation_emp_1' ? 'Final Offer: ' : 'Propose Salary: '}{showApproveModal.name}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowApproveModal(null)}><X size={16} /></button>
            </div>
            
            {showApproveModal.onboarding_step === 'negotiation_emp_1' && (
              <div style={{ background: 'var(--accent-teal-dim)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', borderLeft: '4px solid var(--accent-teal)' }}>
                <small style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: 'var(--text-xs)', fontWeight: 700 }}>Employee Counter</small>
                <div style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(showApproveModal.salary, showApproveModal.currency)}</div>
              </div>
            )}
            
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: 'var(--text-sm)' }}>
              {showApproveModal.onboarding_step === 'negotiation_emp_1' 
                ? 'Submit your final salary offering for review.' 
                : 'Propose location and payment scale details.'}
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)' }}>Country</label>
                <select value={approveData.country} onChange={e => {
                  const c = SUPPORTED_COUNTRIES.find(sc => sc.name === e.target.value);
                  setApproveData({ ...approveData, country: e.target.value, currency: c?.currency || 'USD' });
                }}>
                  {SUPPORTED_COUNTRIES.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)' }}>Monthly Salary ({approveData.currency})</label>
                <input type="number" placeholder="Amount" value={approveData.salary} onChange={e => setApproveData({ ...approveData, salary: e.target.value })} />
              </div>
              
              <button className="btn btn-primary btn-lg" onClick={handleProposeSalary}>
                {showApproveModal.onboarding_step === 'negotiation_emp_1' ? 'Send Final Offer' : 'Send Offer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
