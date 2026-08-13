'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import styles from '../auth.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        const msg = authError.message.includes('Failed to fetch') || authError.message.includes('fetch')
          ? 'Unable to connect to remote server right now. Click "Demo as Employer" or "Demo as Employee" to enter instant demo workspace!'
          : authError.message;
        setError(msg);
        setLoading(false);
        return;
      }

      const role = data.user?.user_metadata?.role || 'employer';
      router.push(role === 'employee' ? '/employee/dashboard' : '/employer/dashboard');
    } catch (err: any) {
      console.warn('[Auth] Login network issue:', err);
      setError('Unable to connect to remote database server. Click "Demo as Employer" or "Demo as Employee" to enter instant demo workspace.');
      setLoading(false);
    }
  };

  const handleDemoLogin = (role: 'employer' | 'employee') => {
    setLoading(true);
    setError('');

    if (typeof window !== 'undefined') {
      document.cookie = `payzati_demo_role=${role}; path=/; max-age=86400`;
      try {
        localStorage.setItem('payzati_demo_role', role);
      } catch (e) {}
    }

    const dest = role === 'employee' ? '/employee/dashboard' : '/employer/dashboard';
    window.location.href = dest;
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          {/* Back to Home Button */}
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--accent-teal)',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '1.25rem',
              textDecoration: 'none',
              transition: 'transform 0.2s ease',
            }}
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>

          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className={styles.logoSection}>
              <div className={styles.logoMark}>
                <div className={styles.logoSquares}>
                  <div className={styles.square}></div>
                  <div className={styles.square}></div>
                </div>
                <div className={styles.logoCircles}>
                  <div className={styles.circle}></div>
                  <div className={styles.circle}></div>
                </div>
              </div>
              <h1 className={styles.brandName}>Payzati</h1>
              <p className={styles.brandTagline}>Pay anyone. Anywhere. Instantly.</p>
            </div>
          </Link>

          <form onSubmit={handleLogin} className={styles.authForm}>
            <h2>Welcome Back</h2>
            <p className={styles.authSubtitle}>Sign in to your account</p>

            {error && <div className={styles.errorMsg}>{error}</div>}

            <div className={styles.inputGroup}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className={`btn btn-primary btn-lg ${styles.submitBtn}`} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className={styles.divider}><span>or try a demo</span></div>

            <div className={styles.demoButtons}>
              <button type="button" className="btn btn-secondary" onClick={() => handleDemoLogin('employer')} disabled={loading}>
                Demo as Employer
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => handleDemoLogin('employee')} disabled={loading}>
                Demo as Employee
              </button>
            </div>

            <p className={styles.authLink}>
              Don&apos;t have an account? <Link href="/auth/register">Create one</Link>
            </p>
          </form>
        </div>

        <div className={styles.authVisual}>
          <div className={styles.visualContent}>
            <div className={styles.statsGrid}>
              <div className={styles.visualStat}>
                <span className={styles.visualStatValue}>$0</span>
                <span className={styles.visualStatLabel}>Hidden Fees</span>
              </div>
              <div className={styles.visualStat}>
                <span className={styles.visualStatValue}>&lt;3s</span>
                <span className={styles.visualStatLabel}>Settlement Time</span>
              </div>
              <div className={styles.visualStat}>
                <span className={styles.visualStatValue}>100+</span>
                <span className={styles.visualStatLabel}>Countries</span>
              </div>
              <div className={styles.visualStat}>
                <span className={styles.visualStatValue}>ILP</span>
                <span className={styles.visualStatLabel}>Powered</span>
              </div>
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
