'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import styles from '../auth.module.css';
import { Building, User } from 'lucide-react';

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'employer' | 'employee'>('employer');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [country, setCountry] = useState('Nigeria');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          full_name: fullName,
          company_name: companyName,
          country,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      router.push(role === 'employee' ? '/employee/dashboard' : '/employer/dashboard');
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <div className={styles.logoSection}>
            <div className={styles.logoMark}>
              <div className={styles.logoSquares}><div className={styles.square}></div><div className={styles.square}></div></div>
              <div className={styles.logoCircles}><div className={styles.circle}></div><div className={styles.circle}></div></div>
            </div>
            <h1 className={styles.brandName}>Payzati</h1>
            <p className={styles.brandTagline}>Pay anyone. Anywhere. Instantly.</p>
          </div>

          <form onSubmit={handleRegister} className={styles.authForm}>
            <h2>Create Account</h2>
            <p className={styles.authSubtitle}>
              {step === 1 ? 'Choose your account type' : step === 2 ? 'Enter your details' : 'Set up credentials'}
            </p>

            {error && <div className={styles.errorMsg}>{error}</div>}

            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button type="button" className={`btn ${role === 'employer' ? 'btn-primary' : 'btn-secondary'} btn-lg`}
                  onClick={() => { setRole('employer'); setStep(2); }}
                  style={{ width: '100%', justifyContent: 'flex-start', padding: '1.25rem', height: 'auto', gap: '1rem' }}>
                  <Building size={28} style={{ color: role === 'employer' ? 'var(--bg-primary)' : 'var(--accent-teal)' }} />
                  <span style={{ textAlign: 'left' }}><strong>Employer</strong><br /><small style={{ opacity: 0.7 }}>Manage payroll for your team</small></span>
                </button>
                <button type="button" className={`btn ${role === 'employee' ? 'btn-primary' : 'btn-secondary'} btn-lg`}
                  onClick={() => { setRole('employee'); setStep(2); }}
                  style={{ width: '100%', justifyContent: 'flex-start', padding: '1.25rem', height: 'auto', gap: '1rem' }}>
                  <User size={28} style={{ color: role === 'employee' ? 'var(--bg-primary)' : 'var(--accent-teal)' }} />
                  <span style={{ textAlign: 'left' }}><strong>Employee</strong><br /><small style={{ opacity: 0.7 }}>Access your earnings & advances</small></span>
                </button>
              </div>
            )}

            {step === 2 && (
              <>
                <div className={styles.inputGroup}>
                  <label htmlFor="fullName">Full Name</label>
                  <input id="fullName" type="text" placeholder="Your full name" value={fullName}
                    onChange={e => setFullName(e.target.value)} required />
                </div>
                {role === 'employer' && (
                  <div className={styles.inputGroup}>
                    <label htmlFor="company">Company Name</label>
                    <input id="company" type="text" placeholder="Your company name" value={companyName}
                      onChange={e => setCompanyName(e.target.value)} required />
                  </div>
                )}
                <div className={styles.inputGroup}>
                  <label htmlFor="country">Country</label>
                  <select id="country" value={country} onChange={e => setCountry(e.target.value)}>
                    <option>Nigeria</option><option>Kenya</option><option>Ghana</option>
                    <option>South Africa</option><option>Egypt</option><option>United States</option>
                    <option>United Kingdom</option><option>Germany</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
                  <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={() => setStep(3)}>Continue</button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className={styles.inputGroup}>
                  <label htmlFor="regEmail">Email</label>
                  <input id="regEmail" type="email" placeholder="you@company.com" value={email}
                    onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="regPassword">Password</label>
                  <input id="regPassword" type="password" placeholder="Min 6 characters" value={password}
                    onChange={e => setPassword(e.target.value)} required minLength={6} />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>Back</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                    {loading ? 'Creating account...' : 'Create Account'}
                  </button>
                </div>
              </>
            )}

            <p className={styles.authLink}>
              Already have an account? <Link href="/auth/login">Sign in</Link>
            </p>
          </form>
        </div>

        <div className={styles.authVisual}>
          <div className={styles.visualContent}>
            <div className={styles.statsGrid}>
              <div className={styles.visualStat}><span className={styles.visualStatValue}>$0</span><span className={styles.visualStatLabel}>Hidden Fees</span></div>
              <div className={styles.visualStat}><span className={styles.visualStatValue}>&lt;3s</span><span className={styles.visualStatLabel}>Settlement</span></div>
              <div className={styles.visualStat}><span className={styles.visualStatValue}>100+</span><span className={styles.visualStatLabel}>Countries</span></div>
              <div className={styles.visualStat}><span className={styles.visualStatValue}>ILP</span><span className={styles.visualStatLabel}>Powered</span></div>
            </div>
            <div className={styles.networkViz}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={styles.networkNode} style={{ animationDelay: `${i * 0.3}s` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
