'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, Check, Fingerprint, Globe2, Sparkles, Zap } from 'lucide-react';
import styles from './landing.module.css';
import LiveFXQuoteWidget from '@/components/LiveFXQuoteWidget';

const SPRING_EASE = [0.32, 0.72, 0, 1] as const;

export default function LandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState<'employer' | 'employee'>('employer');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const enterDemo = (role: 'employer' | 'employee') => {
    document.cookie = `payzati_demo_role=${role}; path=/; max-age=86400`;
    localStorage.setItem('payzati_demo_role', role);
    router.push(role === 'employer' ? '/employer/dashboard' : '/employee/dashboard');
  };

  return (
    <div className={styles.landing}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      {/* Fluid Island Floating Pill Navbar */}
      <header className={styles.navWrapper}>
        <nav className={`${styles.islandNav} ${scrolled ? styles.islandNavScrolled : ''}`} aria-label="Primary">
          <Link href="/" className={styles.navLogo}>
            <span className={styles.logoMark} aria-hidden="true">
              <span className={styles.sq} />
              <span className={styles.sq} />
              <span className={styles.cr} />
              <span className={styles.cr} />
            </span>
            <span>Payzati</span>
          </Link>

          <div className={styles.navLinks}>
            <a href="#features">Platform</a>
            <a href="#how-it-works">How it works</a>
            <a href="#fx-rates">Live FX</a>
          </div>

          <div className={styles.navActions}>
            <Link href="/auth/login" className="btn btn-ghost btn-sm">
              Sign in
            </Link>
            <button onClick={() => enterDemo('employer')} className="btn btn-primary btn-sm">
              Try live demo
            </button>
          </div>

          <button
            className={`${styles.menuToggle} ${menuOpen ? styles.menuOpen : ''}`}
            onClick={() => setMenuOpen(prev => !prev)}
            aria-label="Toggle menu"
          >
            <span className={`${styles.menuLine} ${styles.menuLineTop}`} />
            <span className={`${styles.menuLine} ${styles.menuLineBottom}`} />
          </button>
        </nav>
      </header>

      {/* Mobile Glass Overlay */}
      {menuOpen && (
        <motion.div
          className={styles.mobileOverlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: SPRING_EASE }}
        >
          <a href="#features" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Platform</a>
          <a href="#how-it-works" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>How it works</a>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => { setMenuOpen(false); enterDemo('employer'); }}
          >
            Launch Employer Demo
            <span className="btn-icon-nest"><ArrowUpRight size={16} strokeWidth={1.75} /></span>
          </button>
          <button
            className="btn btn-secondary btn-lg"
            onClick={() => { setMenuOpen(false); enterDemo('employee'); }}
          >
            Preview Employee App
            <span className="btn-icon-nest"><ArrowUpRight size={16} strokeWidth={1.75} /></span>
          </button>
        </motion.div>
      )}

      {/* 1. EDITORIAL SPLIT HERO */}
      <main id="main-content">
        <section className={styles.hero}>
          <div className={`${styles.heroLeft} animate-fade-in`}>
            <span className="eyebrow-pill">
              <Sparkles size={12} strokeWidth={1.75} color="var(--accent-teal)" />
              Instant global payroll · Powered by Interledger
            </span>

            <h1 className={styles.heroTitle}>
              Pay anyone, anywhere,{' '}
              <span className="serif-accent" style={{ color: 'var(--accent-teal)' }}>instantly</span>.
            </h1>

            <p className={styles.heroSubtitle}>
              Send salaries across Nigeria, Kenya, Ghana, and worldwide in seconds. No 5-day bank delays, no hidden fees, and nothing technical for your team to learn.
            </p>

            <div className={styles.heroCTAs}>
              <button onClick={() => enterDemo('employer')} className="btn btn-primary btn-lg">
                Try as an employer
                <span className="btn-icon-nest">
                  <ArrowUpRight size={16} strokeWidth={1.75} />
                </span>
              </button>

              <button onClick={() => enterDemo('employee')} className="btn btn-secondary btn-lg">
                Try as an employee
                <span className="btn-icon-nest">
                  <ArrowUpRight size={16} strokeWidth={1.75} />
                </span>
              </button>
            </div>

            <div className={styles.trustStrip}>
              <div className={styles.trustStat}>
                <span className={styles.trustValue}>~1 sec</span>
                <span className={styles.trustLabel}>Time to arrive</span>
              </div>
              <div className={styles.trustStat}>
                <span className={styles.trustValue}>$0.02</span>
                <span className={styles.trustLabel}>Transfer fee</span>
              </div>
              <div className={styles.trustStat}>
                <span className={styles.trustValue}>100%</span>
                <span className={styles.trustLabel}>Instant receipts</span>
              </div>
            </div>
          </div>

          {/* Double-Bezel Interactive Workspace Preview */}
          <div className="bezel-shell animate-slide-up">
            <div className="bezel-core">
              <div
                className={styles.previewHeader}
                style={{
                  background: 'var(--navy-primary, #132048)',
                  color: '#ffffff',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'rgba(255,255,255,0.78)', fontFamily: 'var(--font-mono)' }}>
                  Company · London → Lagos
                </span>
                <div className={styles.previewSwitcher} style={{ background: 'rgba(255, 255, 255, 0.12)' }} role="tablist">
                  <button
                    role="tab"
                    aria-selected={activeView === 'employer'}
                    className={`${styles.previewTab} ${activeView === 'employer' ? styles.previewTabActive : ''}`}
                    style={{ color: activeView === 'employer' ? 'var(--navy-primary, #132048)' : 'rgba(255,255,255,0.82)' }}
                    onClick={() => setActiveView('employer')}
                  >
                    Employer
                  </button>
                  <button
                    role="tab"
                    aria-selected={activeView === 'employee'}
                    className={`${styles.previewTab} ${activeView === 'employee' ? styles.previewTabActive : ''}`}
                    style={{ color: activeView === 'employee' ? 'var(--navy-primary, #132048)' : 'rgba(255,255,255,0.82)' }}
                    onClick={() => setActiveView('employee')}
                  >
                    Employee
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait" initial={false}>
                {activeView === 'employer' ? (
                  <motion.div
                    key="employer-preview"
                    className={styles.previewBody}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22, ease: SPRING_EASE }}
                  >
                    <div className={styles.previewBalanceRow}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>
                          Active Master Treasury (Testnet EUR)
                        </span>
                        <div className={styles.previewAmount}>€14,820.40</div>
                      </div>
                      <span className="badge badge-success">
                        <Check size={12} strokeWidth={2.5} /> Ready to settle
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      <div className={styles.previewRow}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Amara Okafor</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Lagos, Nigeria · Product Engineer</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="tabular-nums" style={{ fontWeight: 700, fontSize: '0.875rem' }}>₦1,247,500</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--status-success)' }}>Payroll sent · 0.7s</div>
                        </div>
                      </div>

                      <div className={styles.previewRow}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Amina Ochieng</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Nairobi, Kenya · Brand Designer</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="tabular-nums" style={{ fontWeight: 700, fontSize: '0.875rem' }}>KES 184,200</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--status-success)' }}>Settled · 0.9s</div>
                        </div>
                      </div>

                      <div className={styles.previewRow}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Kwame Mensah</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Accra, Ghana · QA Specialist</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="tabular-nums" style={{ fontWeight: 700, fontSize: '0.875rem' }}>GHS 16,450</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--accent-teal)', fontWeight: 600 }}>Ready to pay</div>
                        </div>
                      </div>
                    </div>

                    <button onClick={() => enterDemo('employer')} className="btn btn-primary btn-block">
                      Open live employer cockpit
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="employee-preview"
                    className={styles.previewBody}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22, ease: SPRING_EASE }}
                  >
                    <div className={styles.previewBalanceRow}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>
                          Amara · Earned so far this month
                        </span>
                        <div className={styles.previewAmount} style={{ color: 'var(--accent-teal)' }}>₦584,320</div>
                      </div>
                      <span className="badge badge-success">0% interest</span>
                    </div>

                    <div className={styles.previewRow}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Instant salary withdrawal</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Arrives directly in local currency</div>
                      </div>
                      <span className="tabular-nums" style={{ fontWeight: 700, color: 'var(--accent-teal)' }}>₦150,000</span>
                    </div>

                    <div className={styles.previewRow}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Verified payment receipt</div>
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>0x8e4a...9c12 · Open Payments</div>
                      </div>
                      <span className="badge badge-success">Verified</span>
                    </div>

                    <button onClick={() => enterDemo('employee')} className="btn btn-primary btn-block">
                      Try employee withdrawal flow
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* 2. ASYMMETRICAL BENTO GRID */}
        <section id="features" className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className="eyebrow-pill">Simple by design</span>
            <h2 className={styles.sectionTitle}>
              Pay your team like they live{' '}
              <span className="serif-accent">next door</span>.
            </h2>
            <p className={styles.sectionLead}>
              Approve your monthly budget once. Your team gets paid in their local currency and can withdraw what they have earned anytime.
            </p>
          </div>

          <div className={styles.bentoGrid}>
            <div className={`bezel-shell ${styles.col7}`} id="fx-rates">
              <div className={`bezel-core ${styles.bentoInner}`}>
                <div>
                  <Globe2 size={22} strokeWidth={1.5} color="var(--accent-teal)" style={{ marginBottom: '0.85rem' }} />
                  <h3 className={styles.bentoHeading}>See the exact amount they get</h3>
                  <p className={styles.bentoText}>
                    No surprise deductions or hidden exchange markups. What you see here is what lands in their account.
                  </p>
                </div>
                <LiveFXQuoteWidget />
              </div>
            </div>

            <div className={`bezel-shell ${styles.col5}`}>
              <div className={`bezel-core ${styles.bentoInner}`}>
                <div>
                  <Zap size={22} strokeWidth={1.5} color="var(--accent-teal)" style={{ marginBottom: '0.85rem' }} />
                  <h3 className={styles.bentoHeading}>Get paid as you work</h3>
                  <p className={styles.bentoText}>
                    No need to wait until the end of the month when rent or bills come early. Workers can withdraw earned pay in one tap—with zero interest.
                  </p>
                </div>
                <div style={{ padding: '1.1rem', borderRadius: '14px', background: 'var(--elevation-2)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Month progress</span>
                    <span className="tabular-nums" style={{ fontWeight: 700, color: 'var(--accent-teal)' }}>Day 21 of 30</span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '9999px', background: 'var(--elevation-3)', overflow: 'hidden' }}>
                    <div style={{ width: '70%', height: '100%', background: 'var(--accent-teal)', borderRadius: '9999px' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className={`bezel-shell ${styles.col5}`}>
              <div className={`bezel-core ${styles.bentoInner}`}>
                <div>
                  <Fingerprint size={22} strokeWidth={1.5} color="var(--accent-teal)" style={{ marginBottom: '0.85rem' }} />
                  <h3 className={styles.bentoHeading}>Instant proof for every payment</h3>
                  <p className={styles.bentoText}>
                    Every transfer creates a verified receipt automatically—easy to read for employees, and ready to audit for finance teams.
                  </p>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', padding: '0.85rem 1rem', borderRadius: '12px', background: 'var(--elevation-2)', color: 'var(--text-secondary)' }}>
                  Receipt saved · Verified on Interledger
                </div>
              </div>
            </div>

            <div className={`bezel-shell ${styles.col7}`} id="how-it-works">
              <div className={`bezel-core ${styles.bentoInner}`}>
                <div>
                  <h3 className={styles.bentoHeading}>Three steps to payday</h3>
                  <p className={styles.bentoText}>
                    Set up in minutes. Anyone on your team can use it right away.
                  </p>
                </div>

                <div className={styles.stepsGrid}>
                  <div>
                    <span className={styles.stepNum}>01</span>
                    <div style={{ fontWeight: 700, marginBottom: '4px' }}>Connect your wallet</div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      Approve your company payout limit once.
                    </p>
                  </div>
                  <div>
                    <span className={styles.stepNum}>02</span>
                    <div style={{ fontWeight: 700, marginBottom: '4px' }}>Add your team</div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      Enter their local currency salary and payout address.
                    </p>
                  </div>
                  <div>
                    <span className={styles.stepNum}>03</span>
                    <div style={{ fontWeight: 700, marginBottom: '4px' }}>Send pay in seconds</div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      Pay everyone at once, or let staff withdraw early.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. FINAL CTA */}
        <section className={styles.section} style={{ paddingTop: '1rem' }}>
          <div className="bezel-shell">
            <div className={`bezel-core ${styles.ctaCore}`}>
              <div>
                <h2 style={{ fontSize: 'clamp(1.6rem, 2.8vw, 2.3rem)', marginBottom: '0.5rem' }}>
                  Experience both sides in under 60 seconds.
                </h2>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '48ch' }}>
                  No signup required for the interactive walkthrough. Jump straight into the live Employer or Employee workspace.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button onClick={() => enterDemo('employer')} className="btn btn-primary btn-lg">
                  Employer demo
                  <span className="btn-icon-nest"><ArrowUpRight size={16} strokeWidth={1.75} /></span>
                </button>
                <button onClick={() => enterDemo('employee')} className="btn btn-secondary btn-lg">
                  Employee demo
                  <span className="btn-icon-nest"><ArrowUpRight size={16} strokeWidth={1.75} /></span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>Payzati</strong> · Global Payroll on Interledger Open Payments
        </div>
        <div className={styles.footerLinks}>
          <Link href="/auth/login">Sign in</Link>
          <Link href="/auth/register">Create account</Link>
          <a href="https://ilp.interledger-test.dev/da071cb6" target="_blank" rel="noreferrer">Testnet Master Wallet</a>
        </div>
      </footer>
    </div>
  );
}
