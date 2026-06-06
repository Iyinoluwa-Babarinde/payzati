'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getEmployeeProfile } from '@/lib/supabase/queries';
import toast from 'react-hot-toast';
import { FileText } from 'lucide-react';

export default function EmployeeSettings() {
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bankDetails, setBankDetails] = useState({ bank_name: '', bank_account_number: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const emp = await getEmployeeProfile();
      if (!emp) {
        setEmployee({
          id: 'demo',
          name: 'Demo Employee',
          email: 'demo-employee@payzati.com',
          bank_name: 'Guaranty Trust Bank',
          bank_account_number: '0123456789'
        });
        setBankDetails({ bank_name: 'Guaranty Trust Bank', bank_account_number: '0123456789' });
      } else {
        setEmployee(emp);
        setBankDetails({ bank_name: emp.bank_name || '', bank_account_number: emp.bank_account_number || '' });
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleUpdateBank = async () => {
    setIsSubmitting(true);
    
    // In demo mode
    if (employee.id === 'demo') {
      setTimeout(() => {
        toast.success('Bank details update requested. Awaiting HR approval.');
        setIsSubmitting(false);
      }, 1000);
      return;
    }

    const { error } = await supabase.from('employees').update({
      pending_bank_details: {
        bank_name: bankDetails.bank_name,
        bank_account_number: bankDetails.bank_account_number,
        requested_at: new Date().toISOString()
      }
    }).eq('id', employee.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Bank details update requested. Awaiting HR approval.');
    }
    setIsSubmitting(false);
  };

  if (loading) return null;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Bank & Tax Info</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your payment details and tax information.</p>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>Receiving Bank Account</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          This is where your salary and earned wage access advances will be deposited. Changes to these details require HR approval.
        </p>

        {employee.pending_bank_details && (
          <div style={{ background: 'rgba(255,170,0,0.1)', border: '1px solid rgba(255,170,0,0.3)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FFAA00', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              <span>⏳</span> Pending HR Approval
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
              Requested change to: <strong>{employee.pending_bank_details.bank_name}</strong> ending in {employee.pending_bank_details.bank_account_number.slice(-4)}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Bank Name</label>
            <input 
              type="text" 
              placeholder="e.g. Access Bank" 
              value={bankDetails.bank_name}
              onChange={e => setBankDetails({ ...bankDetails, bank_name: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Account Number</label>
            <input 
              type="text" 
              placeholder="10 digit account number" 
              value={bankDetails.bank_account_number}
              onChange={e => setBankDetails({ ...bankDetails, bank_account_number: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
            />
          </div>
          
          <button 
            className="btn btn-primary" 
            onClick={handleUpdateBank}
            disabled={isSubmitting || (bankDetails.bank_name === employee.bank_name && bankDetails.bank_account_number === employee.bank_account_number)}
          >
            {isSubmitting ? 'Requesting...' : 'Request Change'}
          </button>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>Tax Information</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--elevation-1)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
          <div style={{ color: 'var(--text-secondary)', display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}><FileText size={32} /></div>
          <div>
            <div style={{ fontWeight: 600 }}>Tax Identification Number</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontFamily: 'var(--font-mono)' }}>Not provided</div>
          </div>
          <button className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }}>Update</button>
        </div>
        <p style={{ marginTop: '1rem', fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
          Payzati automatically calculates and withholds your local income taxes based on your jurisdiction.
        </p>
      </div>
    </div>
  );
}
