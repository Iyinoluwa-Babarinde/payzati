'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/fx-engine';
import { createClient } from '@/lib/supabase/client';
import { getEmployeeProfile } from '@/lib/supabase/queries';
import { Banknote, Receipt, Check, X, CheckCircle, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EmployeeDashboard() {
  const [employee, setEmployee] = useState<any>(null);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState('');
  
  useEffect(() => {
    async function loadData() {
      const emp = await getEmployeeProfile();
      if (!emp) {
        setEmployee({
          id: 'demo',
          name: 'Demo Employee',
          salary: 1500000,
          currency: 'NGN',
          bank_name: 'Guaranty Trust Bank',
          bank_account_number: '0123456789'
        });
        setLoading(false);
        return;
      }
      
      setEmployee(emp);
      
      const supabase = createClient();
      const { data } = await supabase.from('payroll_runs').select('*').eq('company_id', emp.company_id).order('date', { ascending: false }).limit(5);
      if (data) {
        const myPayrolls = data.map(pr => ({
          ...pr,
          net_received: emp.salary * 0.75,
          currency: emp.currency
        }));
        setPayrolls(myPayrolls);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleRequestAdvance = async () => {
    if (!advanceAmount || isNaN(Number(advanceAmount))) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    toast.success(`Request for ${formatCurrency(Number(advanceAmount), employee?.currency || 'USD')} sent to HR.`);
    setShowAdvanceModal(false);
    setAdvanceAmount('');
  };

  if (loading) return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div className="skeleton skeleton-title"></div>
        <div className="skeleton skeleton-row" style={{ width: '40%' }}></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card skeleton" style={{ height: '160px' }}></div>
        <div className="card skeleton" style={{ height: '160px' }}></div>
      </div>
      <div className="card skeleton" style={{ height: '300px' }}></div>
    </div>
  );

  const today = new Date();
  const nextPayday = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 'var(--text-lg)', marginBottom: '0.25rem' }}>Welcome, {employee?.name.split(' ')[0]}.</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Here&apos;s a quick look at your earnings and payment history.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ background: 'var(--elevation-1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Next Payday</div>
            <div style={{ background: 'var(--accent-teal-dim)', color: 'var(--accent-teal)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 700 }}>
              {Math.ceil((nextPayday.getTime() - today.getTime()) / (1000 * 3600 * 24))} days until payday
            </div>
          </div>
          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            {nextPayday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>
            Your estimated take-home pay: <strong>{formatCurrency(employee.salary * 0.75, employee.currency)}</strong>
          </p>
        </div>

        <div className="card" style={{ background: 'var(--elevation-1)', borderLeft: '4px solid var(--accent-purple)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Need cash early?</div>
            <div style={{ color: 'var(--text-secondary)' }}><Banknote size={24} color="var(--accent-teal)" /></div>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: 'var(--text-xs)', lineHeight: 1.5 }}>
            Need to cover an unexpected bill? You can withdraw some of your earned salary early. It arrives in seconds!
          </p>
          <button className="btn btn-secondary btn-block" onClick={() => setShowAdvanceModal(true)}>
            Request early pay
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'var(--elevation-1)' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 style={{ margin: 0 }}>Recent Paystubs</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Gross Amount</th>
              <th>Net Received</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {payrolls.length === 0 ? (
              <tr>
                <td colSpan={5} style={{textAlign:'center', padding:'3rem'}}>
                  <div style={{opacity:0.3,marginBottom:'0.5rem', display: 'flex', justifyContent: 'center'}}><Receipt size={48} /></div>
                  <p style={{color: 'var(--text-secondary)'}}>No paystubs yet. Once you receive your first payment, they&apos;ll appear here!</p>
                </td>
              </tr>
            ) : payrolls.map((pr, i) => (
              <tr key={pr.id} className="animate-slide-up" style={{animationDelay: `${0.1 * i}s`, opacity: 0, animationFillMode: 'forwards'}}>
                <td>{new Date(pr.date).toLocaleDateString()}</td>
                <td>{formatCurrency(employee.salary, employee.currency)}</td>
                <td style={{ fontWeight: 700, color: 'var(--accent-teal)' }}>{formatCurrency(pr.net_received, employee.currency)}</td>
                <td>
                  <span className="badge badge-success">
                    <CheckCircle size={12} style={{ marginRight: '2px' }} /> Deposited
                  </span>
                </td>
                <td><button className="btn btn-ghost btn-sm">Download PDF</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdvanceModal && (
        <div className="modal-overlay" onClick={() => setShowAdvanceModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Request early pay</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAdvanceModal(false)}><X size={16} /></button>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: 'var(--text-sm)' }}>
              You can request up to half of your estimated take-home salary early. We&apos;ll automatically deduct this from your next payday.
            </p>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>How much do you need? ({employee.currency})</label>
              <input 
                type="number" 
                placeholder="Enter amount" 
                value={advanceAmount}
                onChange={e => setAdvanceAmount(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', background: 'var(--elevation-2)', color: 'var(--text-primary)' }}
              />
              <div style={{ marginTop: '0.5rem', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                Max you can request right now: {formatCurrency(employee.salary * 0.75 * 0.5, employee.currency)}
              </div>
            </div>
            
            <div style={{ background: 'var(--elevation-2)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Receiving Bank Account</div>
              <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>{employee.bank_name || 'No bank linked'}</div>
              <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>{employee.bank_account_number || 'Please add your bank account details in Settings first'}</div>
            </div>

            <button className="btn btn-primary btn-lg btn-block" onClick={handleRequestAdvance} disabled={!employee.bank_name}>
              Send request
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
