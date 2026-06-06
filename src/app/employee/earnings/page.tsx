'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/fx-engine';
import { getEmployeeProfile } from '@/lib/supabase/queries';
import { createClient } from '@/lib/supabase/client';
import { calculateTax } from '@/lib/tax-engine';
import LinkOrganization from '../LinkOrganization';
import { Download, Check } from 'lucide-react';
import OnboardingTracker from '../OnboardingTracker';

export default function EarningsPage() {
  const [employee, setEmployee] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const emp = await getEmployeeProfile();
      if (emp) {
        setEmployee(emp);
        const supabase = createClient();
        const { data } = await supabase.from('transactions')
          .select('*')
          .eq('employee_id', emp.id)
          .eq('type', 'payroll')
          .order('date', { ascending: false });
        if (data) setPayments(data);
      }
      setLoading(false);
    }
    load();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const emp = await getEmployeeProfile();
    setEmployee(emp);
    if (emp) {
      const supabase = createClient();
      const { data } = await supabase.from('transactions')
        .select('*')
        .eq('employee_id', emp.id)
        .eq('type', 'payroll')
        .order('date', { ascending: false });
      if (data) setPayments(data);
    }
    setLoading(false);
  };

  if (loading) return <div style={{padding: '3rem', textAlign: 'center'}}>Loading profile...</div>;
  if (!employee) return <LinkOrganization onLinked={loadData} />;
  
  if (employee.status === 'on_leave') return <OnboardingTracker employee={employee} onRefresh={loadData} />;

  const taxInfo = calculateTax(employee.salary, employee.country, employee.currency);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Earnings History</h1><p className="page-subtitle">Your complete salary payment history</p></div>
        <button className="btn btn-secondary"><Download size={14} style={{ marginRight: "4px" }} /> Export CSV</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead><tr><th>Period</th><th>Gross</th><th>Income Tax</th><th>Total Social</th><th>Net Received</th><th>Status</th></tr></thead>
          <tbody>
            {payments.length === 0 ? <tr><td colSpan={6} style={{textAlign: 'center', padding: '2rem'}}>No payments recorded yet.</td></tr> :
            payments.map((p, i) => (
              <tr key={p.id}>
                <td><strong>{p.description}</strong><br /><small style={{ color: 'var(--text-tertiary)' }}>{new Date(p.date).toLocaleDateString()}</small></td>
                <td>{formatCurrency(employee.salary, employee.currency)}</td>
                <td style={{ color: 'var(--status-warning)' }}>{formatCurrency(taxInfo.incomeTax, employee.currency)}</td>
                <td style={{ color: 'var(--status-warning)' }}>{formatCurrency(taxInfo.socialContributions.reduce((s,c)=>s+c.amount,0), employee.currency)}</td>
                <td style={{ fontWeight: 700, color: 'var(--accent-teal)' }}>{formatCurrency(Math.abs(p.amount), p.currency)}</td>
                <td><span className="badge badge-success"><Check size={12} style={{ marginRight: "4px" }} /> Settled via ILP</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
