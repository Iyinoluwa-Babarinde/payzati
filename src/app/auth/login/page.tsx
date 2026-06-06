'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
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

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const role = data.user?.user_metadata?.role || 'employer';
    router.push(role === 'employee' ? '/employee/dashboard' : '/employer/dashboard');
  };

  const handleDemoLogin = async (role: 'employer' | 'employee') => {
    setLoading(true);
    setError('');
    const demoEmail = role === 'employer' ? 'demo-employer@payzati.com' : 'demo-employee@payzati.com';
    const demoPassword = 'demo123456';

    // Try sign in first, then sign up if not found
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: demoEmail,
      password: demoPassword,
    });

    if (authError) {
      // Create demo account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: demoEmail,
        password: demoPassword,
        options: {
          data: {
            role,
            full_name: role === 'employer' ? 'Demo Employer' : 'Demo Employee',
            company_name: 'Payzati Demo Corp',
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (signUpData.user) {
        router.push(role === 'employee' ? '/employee/dashboard' : '/employer/dashboard');
        return;
      }
    }

    if (data?.user) {
      router.push(role === 'employee' ? '/employee/dashboard' : '/employer/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
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
