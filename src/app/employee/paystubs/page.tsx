'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/fx-engine';
import { createClient } from '@/lib/supabase/client';
import { getEmployeeProfile } from '@/lib/supabase/queries';
import { Receipt, Check } from 'lucide-react';

export default function EmployeePaystubs() {
  const [employee, setEmployee] = useState<any>(null);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadData() {
      const emp = await getEmployeeProfile();
      if (!emp) {
        setEmployee({
          id: 'demo',
          name: 'Demo Employee',
          salary: 1500000,
          currency: 'NGN',
        });
        setLoading(false);
        return;
      }
      
      setEmployee(emp);
      
      const supabase = createClient();
      const { data } = await supabase.from('payroll_runs').select('*').eq('company_id', emp.company_id).order('date', { ascending: false });
      if (data) {
        const myPayrolls = data.map(pr => ({
          ...pr,
          net_received: emp.salary * 0.75, // approximate net after tax
          currency: emp.currency
        }));
        setPayrolls(myPayrolls);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) return null;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Paystubs</h1>
        <p style={{ color: 'var(--text-secondary)' }}>View and download your historical paystubs and tax documents.</p>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Period</th>
              <th>Gross Amount</th>
              <th>Taxes Withheld</th>
              <th>Net Received</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {payrolls.length === 0 ? (
              <tr><td colSpan={6} style={{textAlign:'center', padding:'3rem'}}><div style={{opacity:0.3,marginBottom:'0.5rem', display: 'flex', justifyContent: 'center'}}><Receipt size={40} /></div><p style={{color: 'var(--text-secondary)'}}>No paystubs available yet.</p></td></tr>
            ) : payrolls.map((pr, i) => {
              const d = new Date(pr.date);
              const month = d.toLocaleString('en-US', { month: 'long' });
              const year = d.getFullYear();
              const taxes = employee.salary * 0.25;

              return (
                <tr key={pr.id} className="animate-slide-up" style={{animationDelay: `${0.1 * i}s`, opacity: 0, animationFillMode: 'forwards'}}>
                  <td>{d.toLocaleDateString()}</td>
                  <td>{month} {year}</td>
                  <td>{formatCurrency(employee.salary, employee.currency)}</td>
                  <td style={{ color: 'var(--status-warning)' }}>- {formatCurrency(taxes, employee.currency)}</td>
                  <td style={{ fontWeight: 600, color: 'var(--accent-teal)' }}>{formatCurrency(pr.net_received, employee.currency)}</td>
                  <td><button className="btn btn-secondary btn-sm">Download</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
