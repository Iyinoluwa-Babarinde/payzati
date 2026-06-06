'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/fx-engine';
import { calculateTax } from '@/lib/tax-engine';
import { getEmployeeProfile } from '@/lib/supabase/queries';
import { createClient } from '@/lib/supabase/client';
import LinkOrganization from '../LinkOrganization';
import { Lightbulb } from 'lucide-react';
import OnboardingTracker from '../OnboardingTracker';

export default function FinancePage() {
  const [employee, setEmployee] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
        .order('date', { ascending: true }); // Ascending for chart
      if (data) setTransactions(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <div style={{padding: '3rem', textAlign: 'center'}}>Loading financial data...</div>;

  if (!employee) return <LinkOrganization onLinked={loadData} />;

  if (employee.status === 'on_leave') return <OnboardingTracker employee={employee} onRefresh={loadData} />;

  const monthlySalary = employee.salary;
  const tax = calculateTax(monthlySalary, employee.country, employee.currency);
  
  // Dynamic chart data based on real transactions
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  // Initialize with zeros for the last 6 months
  const currentMonthIndex = new Date().getMonth();
  const chartLabels: string[] = [];
  const chartData: number[] = [];
  
  for (let i = 5; i >= 0; i--) {
    let mIndex = currentMonthIndex - i;
    if (mIndex < 0) mIndex += 12;
    chartLabels.push(months[mIndex]);
    
    // Sum real transactions for this month
    const monthTxs = transactions.filter(tx => {
      const d = new Date(tx.date);
      return d.getMonth() === mIndex;
    });
    const total = monthTxs.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    // If no data, use 0 (or fallback to projected net salary for UI demo purposes)
    chartData.push(total > 0 ? total : 0);
  }

  const maxEarning = Math.max(...chartData, tax.netSalary);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Financial Dashboard</h1><p className="page-subtitle">Complete visibility over your global income</p></div>
      </div>

      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="card"><div className="stat-card"><span className="stat-label">Annual Gross (Projected)</span><span className="stat-value">{formatCurrency(monthlySalary * 12, employee.currency)}</span></div></div>
        <div className="card"><div className="stat-card"><span className="stat-label">Annual Tax (Projected)</span><span className="stat-value" style={{ color: 'var(--status-warning)' }}>{formatCurrency(tax.totalDeductions * 12, employee.currency)}</span></div></div>
        <div className="card"><div className="stat-card"><span className="stat-label">Annual Net (Projected)</span><span className="stat-value" style={{ color: 'var(--accent-teal)' }}>{formatCurrency(tax.netSalary * 12, employee.currency)}</span></div></div>
      </div>

      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        {/* Earnings Chart */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Monthly Earnings (Real Net Settlements)</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', height: '200px', padding: '0 0.5rem' }}>
            {chartLabels.map((m, i) => (
              <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '100%',
                  height: maxEarning > 0 ? `${(chartData[i] / maxEarning) * 160}px` : '4px',
                  background: 'linear-gradient(180deg, var(--accent-teal), var(--accent-purple))',
                  borderRadius: '6px 6px 2px 2px',
                  transition: 'height 0.5s ease',
                  animation: 'slideUp 0.5s ease forwards',
                  animationDelay: `${i * 0.1}s`,
                  opacity: 0,
                }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{m}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tax Breakdown */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Monthly Tax Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Gross Salary</span><span style={{ fontWeight: 700 }}>{formatCurrency(tax.grossSalary, employee.currency)}</span>
            </div>
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--status-warning)' }}>Income Tax (PAYE)</span>
                <span style={{ color: 'var(--status-warning)' }}>-{formatCurrency(tax.incomeTax, employee.currency)}</span>
              </div>
              {tax.socialContributions.map((sc: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--status-warning)' }}>{sc.name}</span>
                  <span style={{ color: 'var(--status-warning)' }}>-{formatCurrency(sc.amount, employee.currency)}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '2px solid var(--accent-teal)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
              <strong>Net Salary</strong>
              <strong style={{ color: 'var(--accent-teal)', fontSize: '1.125rem' }}>{formatCurrency(tax.netSalary, employee.currency)}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Savings Insights</h3>
        <div style={{ background: 'var(--accent-teal-dim)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <p style={{ color: 'var(--accent-teal)', fontWeight: 700, marginBottom: '0.5rem' }}><Lightbulb size={14} style={{ marginRight: "4px" }} /> Payzati Insight</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            By receiving your salary through Payzati&apos;s ILP network, you save an estimated <strong style={{ color: 'var(--accent-teal)' }}>{formatCurrency(monthlySalary * 0.07, employee.currency)}</strong> per month compared to traditional cross-border payment methods. That&apos;s <strong style={{ color: 'var(--accent-teal)' }}>{formatCurrency(monthlySalary * 0.07 * 12, employee.currency)}</strong> annually!
          </p>
        </div>
      </div>
    </div>
  );
}
