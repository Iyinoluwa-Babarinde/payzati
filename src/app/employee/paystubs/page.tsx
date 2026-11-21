'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/fx-engine';
import { calculateTax } from '@/lib/tax-engine';
import { getStoredTransactions, type DemoTransaction } from '@/lib/demo-ledger';
import { createClient } from '@/lib/supabase/client';
import { getEmployeeProfile } from '@/lib/supabase/queries';
import { Receipt, CheckCircle2, Download, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function EmployeePaystubs() {
  const [employee, setEmployee] = useState<any>({
    id: 'demo-emp',
    name: 'Amara Okafor',
    country: 'Canada',
    salary: 6500,
    currency: 'CAD',
  });
  const [paystubs, setPaystubs] = useState<DemoTransaction[]>([]);

  useEffect(() => {
    const loadLocal = () => {
      const stored = getStoredTransactions();
      setPaystubs(stored);
    };

    loadLocal();
    window.addEventListener('payzati:sync', loadLocal);
    window.addEventListener('storage', loadLocal);

    async function loadRemote() {
      const emp = await getEmployeeProfile();
      if (emp) {
        setEmployee({
          ...emp,
          country: emp.country || 'Canada',
          salary: Number(emp.salary || 6500),
          currency: emp.currency || 'CAD',
        });

        if (emp.company_id) {
          try {
            const supabase = createClient();
            const { data } = await supabase
              .from('payroll_runs')
              .select('*')
              .eq('company_id', emp.company_id)
              .order('date', { ascending: false });

            if (data && data.length > 0) {
              const remoteStubs: DemoTransaction[] = data.map((pr: any) => ({
                id: pr.id,
                type: 'payroll',
                amount: Number(emp.salary || 6500) * 0.78,
                currency: emp.currency || 'CAD',
                status: 'completed',
                description: 'Monthly payroll settlement',
                receipt: pr.receipt || `0x${String(pr.id).slice(0, 16)}`,
                created_at: pr.date || pr.created_at || new Date().toISOString(),
              }));
              setPaystubs((prev) => {
                const merged = [...prev, ...remoteStubs.filter((r) => !prev.some((p) => p.id === r.id))];
                return merged;
              });
            }
          } catch {
            // Keep local synced paystubs
          }
        }
      }
    }

    loadRemote();
    return () => {
      window.removeEventListener('payzati:sync', loadLocal);
      window.removeEventListener('storage', loadLocal);
    };
  }, []);

  const handleDownloadStub = (stub: DemoTransaction) => {
    const content = [
      'PAYZATI VERIFIED PAYSTUB',
      '========================',
      `Employee: ${employee.name}`,
      `Country: ${employee.country}`,
      `Date: ${new Date(stub.created_at).toLocaleString()}`,
      `Description: ${stub.description}`,
      `Net Amount: ${formatCurrency(Math.abs(Number(stub.amount)), stub.currency || employee.currency)}`,
      `Receipt ID: ${stub.receipt}`,
      `Tax Provider: External Tax APIs (Avalara / TaxJar)`,
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payzati-paystub-${stub.id.slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Paystub receipt downloaded.');
  };

  const taxPreview = calculateTax(Number(employee.salary || 6500), employee.country || 'Canada', employee.currency || 'CAD');

  return (
    <div className="animate-fade-in" style={{ maxWidth: '980px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <span className="eyebrow-pill" style={{ marginBottom: '0.6rem' }}>
            <Sparkles size={12} strokeWidth={1.75} color="var(--accent-teal)" />
            Synced live from payroll
          </span>
          <h1 className="page-title">Paystubs</h1>
          <p className="page-subtitle">
            Every salary payout and early withdrawal appears here instantly with its verified receipt.
          </p>
        </div>
      </div>

      <div className="bezel-shell">
        <div className="bezel-core" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Gross Pay</th>
                <th>Tax Withheld (External API)</th>
                <th>Net Received</th>
                <th style={{ textAlign: 'right' }}>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {paystubs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                    <Receipt size={34} strokeWidth={1.5} style={{ opacity: 0.35, margin: '0 auto 10px', display: 'block' }} />
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                      No paystubs yet. Run payroll on the Employer side or withdraw earned wages to see your first synced paystub here immediately.
                    </p>
                  </td>
                </tr>
              ) : (
                paystubs.map((stub) => {
                  const isWithdrawal = stub.type === 'withdrawal';
                  const amountAbs = Math.abs(Number(stub.amount));
                  const curr = stub.currency || employee.currency || 'CAD';
                  const d = new Date(stub.created_at || Date.now());

                  return (
                    <tr key={stub.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{d.toLocaleDateString()}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{stub.description}</div>
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                          {stub.receipt ? `${stub.receipt.substring(0, 18)}...` : 'Verified'}
                        </div>
                      </td>
                      <td className="tabular-nums">
                        {isWithdrawal ? formatCurrency(amountAbs, curr) : formatCurrency(employee.salary || amountAbs, curr)}
                      </td>
                      <td className="tabular-nums" style={{ color: 'var(--status-warning)' }}>
                        {isWithdrawal ? '0% fee advance' : `- ${formatCurrency(taxPreview.totalDeductions, curr)}`}
                      </td>
                      <td className="tabular-nums" style={{ fontWeight: 700, color: 'var(--accent-teal)' }}>
                        {formatCurrency(amountAbs, curr)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <span className="badge badge-success">
                            <CheckCircle2 size={12} /> Settled
                          </span>
                          <button
                            onClick={() => handleDownloadStub(stub)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem' }}
                          >
                            <Download size={13} /> Save
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
