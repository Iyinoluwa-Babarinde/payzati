'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/fx-engine';
import { Check, Sparkles } from 'lucide-react';

interface OnboardingTrackerProps {
  employee: any;
  onRefresh: () => void;
}

export default function OnboardingTracker({ employee, onRefresh }: OnboardingTrackerProps) {
  const [loading, setLoading] = useState(false);
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [counterAmount, setCounterAmount] = useState('');
  const step = employee.onboarding_step || 'requested';

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`employee_tracker_${employee.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'employees', 
        filter: `id=eq.${employee.id}` 
      }, () => {
        onRefresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [employee.id, onRefresh]);

  const visualSteps = [
    { id: 'requested', label: 'Request sent', desc: 'Waiting for HR to take a look' },
    { id: 'reviewed', label: 'Under review', desc: 'The team is putting together your offer details' },
    { id: 'offer_phase', label: 'Offer time!', desc: 'Take a look and negotiate if you&apos;d like' },
    { id: 'completed', label: 'All set!', desc: 'You&apos;re ready to roll!' }
  ];

  let visualStepId = step;
  if (['salary_proposed', 'negotiation_emp_1', 'negotiation_hr_final'].includes(step)) {
    visualStepId = 'offer_phase';
  }

  const currentStepIndex = visualSteps.findIndex(s => s.id === visualStepId);
  const [errorMsg, setErrorMsg] = useState('');
  
  const handleAcceptOffer = async () => {
    setLoading(true);
    setErrorMsg('');
    const supabase = createClient();
    const { error } = await supabase.from('employees').update({
      status: 'active',
      onboarding_step: 'completed'
    }).eq('id', employee.id);
    
    setLoading(false);
    if (!error) {
      onRefresh();
    } else {
      setErrorMsg("Failed to accept offer: " + error.message);
    }
  };

  const handleSubmitCounter = async () => {
    if (!counterAmount || isNaN(Number(counterAmount))) return;
    setLoading(true);
    setErrorMsg('');
    const supabase = createClient();
    const { error } = await supabase.from('employees').update({
      salary: Number(counterAmount),
      onboarding_step: 'negotiation_emp_1'
    }).eq('id', employee.id);
    
    setLoading(false);
    if (!error) {
      setIsNegotiating(false);
      onRefresh();
    } else {
      setErrorMsg("Failed to submit counter offer: " + error.message);
    }
  };

  const handleCancelRequest = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const supabase = createClient();
      console.log('Attempting to delete employee with ID:', employee.id);
      
      const { data, error, count } = await supabase
        .from('employees')
        .delete({ count: 'exact' })
        .eq('id', employee.id);
      
      console.log('Delete response:', { data, error, count });
      
      setLoading(false);
      if (error) {
        setErrorMsg("Failed to cancel request: " + error.message);
      } else if (count === 0) {
        setErrorMsg("Failed: Record could not be found or deleted (check database policies).");
      } else {
        // Successfully deleted
        onRefresh();
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg("Unexpected error: " + err.message);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '4rem auto', padding: '3rem 2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>Let&apos;s get you set up!</h2>
        <p style={{ color: 'var(--text-secondary)' }}>You&apos;re all linked up with the team at <strong>{employee.companies.name}</strong></p>
      </div>

      <div style={{ position: 'relative', marginBottom: '2rem' }}>
        <div style={{ position: 'absolute', top: '16px', left: '10%', right: '10%', height: '4px', background: 'var(--elevation-1)', zIndex: 0, borderRadius: '2px' }}>
          <div style={{ 
            height: '100%', 
            background: 'var(--accent-teal)', 
            width: `${(Math.max(currentStepIndex, 0) / (visualSteps.length - 1)) * 100}%`,
            transition: 'width 0.5s ease'
          }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          {visualSteps.map((s, i) => {
            const isActive = i === currentStepIndex;
            const isPast = i < currentStepIndex;
            return (
              <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div style={{ 
                  width: '36px', height: '36px', borderRadius: '50%', 
                  background: isActive || isPast ? 'var(--accent-teal)' : 'var(--elevation-1)',
                  color: isActive || isPast ? '#000' : 'var(--text-tertiary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, marginBottom: '0.75rem',
                  border: `4px solid var(--bg-primary)`,
                  boxShadow: isActive ? '0 0 0 4px rgba(0,212,170,0.2)' : 'none',
                  transition: 'all 0.3s ease'
                }}>
                  {isPast ? <Check size={12} /> : i + 1}
                </div>
                <strong style={{ fontSize: '0.875rem', color: isActive ? 'var(--text-primary)' : (isPast ? 'var(--text-secondary)' : 'var(--text-tertiary)'), textAlign: 'center' }}>{s.label}</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textAlign: 'center', marginTop: '0.25rem' }}>{s.desc}</span>
              </div>
            );
          })}
        </div>
      </div>

      {errorMsg && (
        <div style={{ background: 'var(--status-error)', color: 'white', padding: '0.75rem', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.875rem', textAlign: 'center' }}>
          {errorMsg}
        </div>
      )}

      {step === 'requested' && (
        <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--elevation-1)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>We&apos;ve let your HR team know you&apos;re here. Hang tight while they process your onboarding!</p>
        </div>
      )}

      {step === 'reviewed' && (
        <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(108,92,231,0.1)', border: '1px solid rgba(108,92,231,0.2)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ color: 'var(--accent-purple)', fontWeight: 600, fontSize: '0.9375rem' }}>The HR team is reviewing your profile and will put together your salary offer very soon!</p>
        </div>
      )}

      {step === 'salary_proposed' && (
        <div className="animate-fade-in" style={{ textAlign: 'center', padding: '2rem', background: 'rgba(0,212,170,0.05)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ color: 'var(--accent-teal)', display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}><Sparkles size={48} /></div>
          <h3 style={{ marginBottom: '0.5rem' }}>Your salary offer is ready!</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>The team has put together your salary details. Take a look below—you can accept it right away or negotiate if you want to adjust something.</p>
          
          <div style={{ display: 'inline-block', textAlign: 'left', background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid var(--border-subtle)', minWidth: '280px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '3rem', marginBottom: '0.75rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Country</span>
              <strong>{employee.country}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '3rem', marginBottom: '0.75rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Currency</span>
              <strong>{employee.currency}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '3rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Monthly Gross</span>
              <strong style={{ color: 'var(--accent-teal)', fontSize: '1.25rem' }}>{formatCurrency(employee.salary, employee.currency)}</strong>
            </div>
          </div>

          {!isNegotiating ? (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-secondary btn-lg" style={{ flex: 1, border: '1px solid var(--border-subtle)', background: 'var(--elevation-1)' }} onClick={() => setIsNegotiating(true)} disabled={loading}>
                Negotiate Offer
              </button>
              <button className="btn btn-primary btn-lg" style={{ flex: 1, background: 'var(--accent-teal)', color: '#000', border: 'none', boxShadow: '0 4px 14px 0 rgba(0,212,170,0.39)' }} onClick={handleAcceptOffer} disabled={loading}>
                {loading ? 'Finalizing...' : 'Accept & Complete'}
              </button>
            </div>
          ) : (
            <div className="animate-fade-in" style={{ textAlign: 'left', background: 'var(--elevation-1)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>
              <h4 style={{ marginBottom: '0.5rem', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-teal)" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                Make a counter-offer
              </h4>
              <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                Enter your desired amount. HR will review it and let you know if it works or if they have a final offer.
              </p>
              
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Amount ({employee.currency})</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontWeight: 600 }}>{employee.currency === 'USD' ? '$' : employee.currency === 'NGN' ? '₦' : employee.currency === 'EUR' ? '€' : ''}</span>
                    <input 
                      type="number" 
                      placeholder={`e.g. ${Math.round(employee.salary * 1.15)}`} 
                      value={counterAmount} 
                      onChange={e => setCounterAmount(e.target.value)} 
                      style={{ width: '100%', paddingLeft: ['USD','NGN','EUR'].includes(employee.currency) ? '2.5rem' : '1rem', fontSize: '1.125rem', height: '3rem' }} 
                    />
                  </div>
                </div>
                <button className="btn btn-primary" onClick={handleSubmitCounter} disabled={loading || !counterAmount} style={{ height: '3rem', padding: '0 2rem', fontWeight: 600 }}>
                  Submit Counter
                </button>
              </div>
              
              <button className="btn btn-ghost btn-sm" style={{ width: '100%', color: 'var(--text-tertiary)' }} onClick={() => setIsNegotiating(false)}>Cancel Negotiation</button>
            </div>
          )}
        </div>
      )}

      {step === 'negotiation_emp_1' && (
        <div className="animate-fade-in" style={{ textAlign: 'center', padding: '3rem 2rem', background: 'rgba(255,170,0,0.05)', border: '1px solid rgba(255,170,0,0.2)', borderRadius: 'var(--radius-lg)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.2)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,170,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FFAA00" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
          </div>
          <h3 style={{ marginBottom: '0.75rem', fontSize: '1.5rem' }}>Counter Offer Sent</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto', lineHeight: '1.6' }}>
            You sent a counter-offer of <strong style={{ color: '#FFAA00' }}>{formatCurrency(employee.salary, employee.currency)}</strong>. 
            We&apos;ve let HR know, and they&apos;ll take a look and get back to you shortly!
          </p>
        </div>
      )}

      {step === 'negotiation_hr_final' && (
        <div className="animate-fade-in" style={{ textAlign: 'center', padding: '3rem 2rem', background: 'linear-gradient(145deg, var(--elevation-1) 0%, rgba(108,92,231,0.05) 100%)', border: '1px solid rgba(108,92,231,0.3)', borderRadius: 'var(--radius-lg)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'inline-block', padding: '0.5rem 1rem', background: 'rgba(108,92,231,0.1)', color: 'var(--accent-purple)', borderRadius: '20px', fontSize: '0.875rem', fontWeight: 700, marginBottom: '1.5rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
            HR&apos;s Final Offer
          </div>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.75rem' }}>Take a look at the final offer</h3>
          
          <div style={{ background: 'var(--bg-primary)', padding: '2rem', borderRadius: 'var(--radius-md)', margin: '0 auto 2rem auto', border: '1px solid var(--border-subtle)', maxWidth: '320px' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Offered Base Salary</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{formatCurrency(employee.salary, employee.currency)}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>per month</div>
          </div>
          
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem auto', lineHeight: '1.6' }}>
            The team has reviewed your counter-offer and sent over this final offer to wrap things up.
          </p>
          
          <button className="btn btn-primary btn-lg" style={{ width: '100%', maxWidth: '320px', background: 'var(--accent-purple)', border: 'none', boxShadow: '0 4px 14px 0 rgba(108,92,231,0.39)' }} onClick={handleAcceptOffer} disabled={loading}>
            {loading ? 'Finalizing...' : 'Accept Final Offer'}
          </button>
        </div>
      )}

      {/* Cancel Request Button */}
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button className="btn btn-ghost" style={{ color: 'var(--status-error)' }} onClick={handleCancelRequest} disabled={loading}>
          {loading ? 'Processing...' : 'Cancel Request'}
        </button>
      </div>
    </div>
  );
}
