'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Banknote, Zap, Scale, Coins, Unlock, Globe, ArrowRight } from 'lucide-react';
import styles from './landing.module.css';

// SVG components to replace emojis
function CheckIcon({ className = '', size = 16, style }: { className?: string; size?: number; style?: React.CSSProperties }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
      style={style}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function GlobeIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

// Styled circular flag vectors
function FlagNG({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={styles.flagSvg}>
      <circle cx="12" cy="12" r="12" fill="#008751" />
      <rect x="8" y="0" width="8" height="24" fill="#FFFFFF" />
    </svg>
  );
}

function FlagKE({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={styles.flagSvg}>
      <circle cx="12" cy="12" r="12" fill="#000000" />
      <rect x="0" y="6" width="24" height="12" fill="#FF0000" />
      <rect x="0" y="12" width="24" height="6" fill="#006600" />
      <path d="M10 12 L12 8 L14 12 L12 16 Z" fill="#FFFFFF" />
    </svg>
  );
}

function FlagGH({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={styles.flagSvg}>
      <circle cx="12" cy="12" r="12" fill="#E2231A" />
      <rect x="0" y="8" width="24" height="16" fill="#FCD116" />
      <rect x="0" y="16" width="24" height="8" fill="#006B3F" />
      <polygon points="12,10 13.5,13 16.5,13 14,15 15,18 12,16 9,18 10,15 7.5,13 10.5,13" fill="#000000" />
    </svg>
  );
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [activeView, setActiveView] = useState<'employer' | 'employee'>('employer');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={styles.landing}>
      {/* Navbar */}
      <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
        <div className={styles.navContent}>
          <Link href="/" className={`${styles.navLogo} ${styles.navItem}`}>
            <div className={styles.logoMark}>
              <div className={styles.logoRow}><div className={styles.sq}></div><div className={styles.sq}></div></div>
              <div className={styles.logoRow}><div className={styles.cr}></div><div className={styles.cr}></div></div>
            </div>
            <span>Payzati</span>
          </Link>
          <div className={`${styles.navLinks} ${styles.navItem}`}>
            <a href="#how-it-works">How it works</a>
            <a href="#features">Inside</a>
            <a href="#pricing">Pricing</a>
          </div>
          <div className={styles.navItem} style={{ gap: '1rem' }}>
            <Link href="/auth/login" className="btn btn-ghost btn-sm">Log in</Link>
            <Link href="/auth/register" className="btn btn-primary btn-sm">Try it free</Link>
          </div>
        </div>
      </nav>

      {/* 1. HERO */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={`${styles.heroTitle} text-gradient-teal`}>
            Global payroll.<br/>Instant settlement.
          </h1>
          <p className={styles.heroSubtitle}>
            Stop paying wire fees. Stop waiting days. Just pay your team.
          </p>
          <div className={styles.heroCTA}>
            <Link href="/auth/register" className="btn btn-primary btn-lg">
              Start now
            </Link>
            <Link href="#how-it-works" className="btn btn-secondary btn-lg">
              See how
            </Link>
          </div>
        </div>
        
        {/* Product Visual / Demo Mockup */}
        <div className={styles.productVisual}>
          <div className={styles.browserHeader} style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '6px', width: '80px' }}>
              <div className={`${styles.dot} ${styles.dotR}`}></div>
              <div className={`${styles.dot} ${styles.dotY}`}></div>
              <div className={`${styles.dot} ${styles.dotG}`}></div>
            </div>
            
            <div className={styles.viewSelector}>
              <button 
                onClick={() => setActiveView('employer')}
                className={`${styles.viewBtn} ${activeView === 'employer' ? styles.activeViewBtn : ''}`}
              >
                Employer
              </button>
              <button 
                onClick={() => setActiveView('employee')}
                className={`${styles.viewBtn} ${activeView === 'employee' ? styles.activeViewBtn : ''}`}
              >
                Employee
              </button>
            </div>
            
            <div style={{ width: '80px' }}></div>
          </div>
          
          <div style={{ background: 'var(--bg-primary)', display: 'flex', height: '380px', overflow: 'hidden' }}>
            {activeView === 'employer' ? (
              <>
                {/* Employer Sidebar Replica - collapsed to 160px */}
                <div style={{ width: '160px', borderRight: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ width: '70%', height: '18px', background: 'var(--elevation-2)', borderRadius: '4px', marginBottom: '1.25rem', marginTop: '0.25rem' }}></div>
                  <div style={{ width: '100%', height: '30px', background: 'var(--accent-teal-dim)', borderRadius: '6px' }}></div>
                  <div style={{ width: '100%', height: '30px', background: 'var(--elevation-2)', borderRadius: '6px' }}></div>
                  <div style={{ width: '100%', height: '30px', background: 'var(--elevation-2)', borderRadius: '6px' }}></div>
                </div>
                
                {/* Employer Main Replica */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
                  <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ padding: '3px 10px', background: 'var(--accent-teal-dim)', border: '1px solid rgba(0, 212, 170, 0.2)', color: 'var(--accent-teal)', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 700 }}>ILP Connected</div>
                  </div>
                  <div style={{ padding: '1.5rem', overflow: 'hidden' }}>
                    {/* Collapsed 2x2 Stats Grid to prevent overflow */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                      <div className={styles.mockCard} style={{ background: 'var(--elevation-1)' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', marginBottom: '0.25rem', fontWeight: 700, textTransform: 'uppercase' }}>Total People</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>142</div>
                      </div>
                      <div className={styles.mockCard} style={{ background: 'var(--elevation-1)' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', marginBottom: '0.25rem', fontWeight: 700, textTransform: 'uppercase' }}>Countries</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>12</div>
                      </div>
                      <div className={styles.mockCard} style={{ background: 'var(--elevation-1)' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', marginBottom: '0.25rem', fontWeight: 700, textTransform: 'uppercase' }}>Monthly Total</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>$145k</div>
                      </div>
                      <div className={styles.mockCard} style={{ background: 'var(--elevation-1)' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', marginBottom: '0.25rem', fontWeight: 700, textTransform: 'uppercase' }}>Balance</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>$12.4k</div>
                      </div>
                    </div>
                    
                    <div className={styles.mockCard} style={{ height: '110px', background: 'var(--elevation-1)' }}>
                      <table style={{ width: '100%', fontSize: '0.75rem', textAlign: 'left', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
                            <th style={{ paddingBottom: '0.35rem' }}>Run</th>
                            <th style={{ paddingBottom: '0.35rem' }}>Amount</th>
                            <th style={{ paddingBottom: '0.35rem' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={{ padding: '8px 0', fontFamily: 'var(--font-mono)' }}>PR-9281</td>
                            <td>$145,000.00</td>
                            <td>
                              <span className="badge badge-success" style={{ padding: '2px 6px', fontSize: '0.65rem' }}>
                                <CheckIcon size={10} style={{ marginRight: '2px' }} /> Success
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Employee Topbar Replica */}
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Welcome back, Sarah</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Globex Corp</div>
                  </div>
                  <div style={{ width: '32px', height: '32px', background: 'var(--accent-teal-dim)', borderRadius: '50%', color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>SJ</div>
                </div>
                {/* Employee Main Replica */}
                <div style={{ padding: '1.5rem', display: 'flex', gap: '1rem', flex: 1, overflow: 'hidden' }}>
                  <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className={styles.mockCard} style={{ background: 'var(--elevation-1)' }}>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Next Payday</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>in 12 days</div>
                      <div className={styles.mockProgressContainer}><div className={styles.mockProgressFill} style={{ width: '60%' }}></div></div>
                    </div>
                    <div className={styles.mockCard} style={{ flex: 1, background: 'var(--elevation-1)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Recent paystubs</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.75rem' }}>
                        <span>May 2026</span><span style={{ fontWeight: 700 }}>KES 145,000</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.75rem' }}>
                        <span>Apr 2026</span><span style={{ fontWeight: 700 }}>KES 145,000</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ flex: 1.2 }}>
                    <div className={styles.mockCard} style={{ background: 'var(--elevation-2)', borderLeft: '4px solid var(--accent-teal)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Wage Access</div>
                      <div style={{ color: 'var(--text-primary)', fontSize: '0.75rem', marginBottom: '1.25rem', lineHeight: 1.4 }}>Withdraw accrued earnings instantly.</div>
                      <div style={{ marginTop: 'auto' }}>
                        <button className="btn btn-primary btn-sm btn-block" style={{ width: '100%', fontSize: '0.7rem' }}>Withdraw</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. SOCIAL PROOF */}
      <section className={styles.socialProof}>
        <h3 className={styles.socialProofTitle}>Trusted by</h3>
        <div className={styles.socialLogos}>
          <span>AFRICA TECH</span>
          <span>GLOBEX CORP</span>
          <span>INTERLEDGER</span>
          <span>FINTECH ORG</span>
        </div>
      </section>

      {/* 3. PROBLEM / PAIN */}
      <section className={styles.problemSection}>
        <div className={styles.painBox}>
          <h3>Cross-border payroll is broken.</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem' }}>
            Your team is waiting days for their money while you pay exorbitant fees. We fixed it.
          </p>
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section id="how-it-works" className={styles.section}>
        <h2 className={styles.sectionTitle}>How it works.</h2>
        <p className={styles.sectionSubtitle}>Fund. Review. Send.</p>
        
        <div className={styles.stepsContainer}>
          <div className={styles.stepGlass}>
            <div className={styles.stepNum}>1</div>
            <h3 style={{ marginBottom: '1rem' }}>Fund balance.</h3>
            <p style={{ color: 'var(--text-secondary)' }}>We hold it securely on the Interledger network.</p>
          </div>
          <div className={styles.stepGlass}>
            <div className={styles.stepNum}>2</div>
            <h3 style={{ marginBottom: '1rem' }}>Review roster.</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Taxes and compliance are already calculated.</p>
          </div>
          <div className={styles.stepGlass}>
            <div className={styles.stepNum}>3</div>
            <h3 style={{ marginBottom: '1rem' }}>Hit send.</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Funds arrive instantly in local currency.</p>
          </div>
        </div>
      </section>

      {/* 5. FEATURES AS BENEFITS */}
      <section id="features" className={styles.section}>
        <h2 className={styles.sectionTitle}>Built for speed.</h2>
        <p className={styles.sectionSubtitle}>Everything you need. Nothing you don't.</p>
        
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}><Banknote size={24} color="var(--accent-teal)" /></div>
            <h3 style={{ marginBottom: '0.75rem' }}>Zero wire fees</h3>
            <p style={{ color: 'var(--text-secondary)' }}>No intermediary banks. Just direct routes.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}><Zap size={24} color="var(--accent-gold)" /></div>
            <h3 style={{ marginBottom: '0.75rem' }}>Instant settlement</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Funds clear in seconds, not days.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}><Scale size={24} color="var(--accent-purple)" /></div>
            <h3 style={{ marginBottom: '0.75rem' }}>Automated compliance</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Tax math is calculated automatically.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}><Coins size={24} color="var(--status-success)" /></div>
            <h3 style={{ marginBottom: '0.75rem' }}>Salary advances</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Employees can request early payroll.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}><Unlock size={24} color="var(--accent-blue)" /></div>
            <h3 style={{ marginBottom: '0.75rem' }}>Earned wage access</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Draw down accrued earnings instantly.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}><GlobeIcon size={24} className={styles.tealIcon} /></div>
            <h3 style={{ marginBottom: '0.75rem' }}>Open standards</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Built on Open Payments and Interledger.</p>
          </div>
        </div>
      </section>

      {/* 6. TESTIMONIALS */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Built for builders</h2>
        
        <div className={styles.testimonialGrid}>
          <div className={styles.testimonialCard}>
            <p className={styles.testimonialText}>
              "Honestly, it used to take me a full day just to figure out who I was paying and how to get the money to Nigeria. Now I just click a button and go grab breakfast."
            </p>
            <div className={styles.testimonialAuthor}>
              <div className={styles.authorAvatar}></div>
              <div>
                <div style={{ fontWeight: 700 }}>Treasure Anosike</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Founder</div>
              </div>
            </div>
          </div>
          <div className={styles.testimonialCard}>
            <p className={styles.testimonialText}>
              "The automatic tax compliance alone is a lifesaver. I don't have to keep a spreadsheet of housing levies for three different countries anymore."
            </p>
            <div className={styles.testimonialAuthor}>
              <div className={styles.authorAvatar}></div>
              <div>
                <div style={{ fontWeight: 700 }}>Inioluwa Babarinde</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Head of People</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PRICING WITH TRANSPARENCY BIAS */}
      <section id="pricing" className={styles.section}>
        <h2 className={styles.sectionTitle}>Simple pricing.</h2>
        <p className={styles.sectionSubtitle}>No hidden fees.</p>
        
        <div className={styles.pricingWrapper}>
          <div className={styles.singlePriceCard}>
            <div className={styles.priceHeader}>
              <span className={styles.pricePlanLabel}>Flat Rate Payroll</span>
              <div className={styles.priceNumber}>
                <span className={styles.priceDollar}>$</span>
                <span className={styles.priceAmountBig}>49</span>
                <span className={styles.pricePerMonth}>/mo</span>
              </div>
            </div>
            
            <div className={styles.priceDescription}>
              <p>
                Complete access to all multi-country payroll tools. We charge a single monthly fee for your company.
              </p>
            </div>
            
            <div className={styles.safetyNet}>
              <div className={styles.safetyNetItem}>
                <CheckIcon className={styles.safetyIcon} />
                <span><strong>Transparency Bias Safety Net:</strong> Free for up to 5 employees. We only charge when you execute your payroll. No setup fees, no compliance markup, cancel in 1-click.</span>
              </div>
              <div className={styles.safetyNetItem}>
                <CheckIcon className={styles.safetyIcon} />
                <span><strong>Evaluative Ease:</strong> One fixed price. No complex tiers, no per-employee additions, no surprise tax filing premiums.</span>
              </div>
            </div>

            <div className={styles.priceCTA}>
              <Link href="/auth/register" className="btn btn-primary btn-lg btn-block">
                Start free trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>FAQ</h2>
        
        <div className={styles.faqSection}>
          <div className={styles.faqItem}>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Is it really instant?</div>
            <div style={{ color: 'var(--text-secondary)' }}>Yep! Because we use the Interledger network, your funds are routed quickly and securely without relying on old bank clearing houses. It takes seconds, not days.</div>
          </div>
          <div className={styles.faqItem}>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>How do you handle the taxes?</div>
            <div style={{ color: 'var(--text-secondary)' }}>We keep our system updated with the latest tax brackets and rules for over 100 countries. When it's time to run payroll, we automatically figure out exactly what needs to be deducted based on where your employee lives.</div>
          </div>
          <div className={styles.faqItem}>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Does my team need crypto wallets?</div>
            <div style={{ color: 'var(--text-secondary)' }}>Not at all. They just need a standard account that supports Open Payments, and they'll receive everything in their own local currency.</div>
          </div>
        </div>
      </section>

      {/* 9. FINAL CTA */}
      <section className={styles.finalCta}>
        <h2>Ready for payroll?</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.25rem' }}>Join the companies that are paying their global teams instantly.</p>
        <Link href="/auth/register" className="btn btn-primary btn-lg">
          Get started
        </Link>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div>
            <div className={styles.navLogo} style={{ marginBottom: '1rem' }}>
              <div className={styles.logoMark}>
                <div className={styles.logoRow}><div className={styles.sq}></div><div className={styles.sq}></div></div>
                <div className={styles.logoRow}><div className={styles.cr}></div><div className={styles.cr}></div></div>
              </div>
              <span>Payzati</span>
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>Making global payroll actually pleasant.</p>
            <p style={{ marginTop: '2rem', fontSize: '0.875rem', opacity: 0.7, color: 'var(--text-tertiary)' }}>© 2026 Payzati. Interledger Foundation Grant Submission.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <h4 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-primary)' }}>Links</h4>
              <ul style={{ listStyle: 'none', lineHeight: '2' }}>
                <li><a href="#how-it-works">How it works</a></li>
                <li><a href="#features">What's inside</a></li>
                <li><a href="#pricing">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-primary)' }}>Legal</h4>
              <ul style={{ listStyle: 'none', lineHeight: '2' }}>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
                <li><a href="#">Compliance</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
