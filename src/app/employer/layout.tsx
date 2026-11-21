'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getCompany, clearProfileCache } from '@/lib/supabase/queries';
import styles from './employer.module.css';
import ThemeToggle from '@/components/ThemeToggle';
import {
  LayoutDashboard,
  Users,
  Banknote,
  Wallet,
  Scale,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
} from 'lucide-react';

const primaryNavItems = [
  { href: '/employer/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/employer/employees', label: 'Team', icon: Users },
  { href: '/employer/payroll', label: 'Payroll', icon: Banknote },
  { href: '/employer/wallet', label: 'Wallet', icon: Wallet },
];

const secondaryNavItems = [
  { href: '/employer/compliance', label: 'Compliance', icon: Scale },
  { href: '/employer/settings', label: 'Settings', icon: Settings },
];

export default function EmployerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [company, setCompany] = useState<any>({ name: 'Payzati Global Inc.' });

  // Load once on mount without blocking render — tab switches are instantaneous
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const comp = await getCompany();
      if (!cancelled && comp?.name) {
        setCompany(comp);
      }
    }
    init();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    clearProfileCache();
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      document.cookie = 'payzati_demo_role=; path=/; max-age=0';
      localStorage.removeItem('payzati_demo_role');
      window.location.href = '/auth/login';
    }
  };

  return (
    <div className={styles.layout}>
      <aside className={`${styles.sidebar} ${sidebarOpen ? '' : styles.collapsed}`}>
        <div className={styles.sidebarHeader}>
          <Link href="/employer/dashboard" className={styles.sidebarLogo}>
            <div className={styles.logoMark}>
              <div className={styles.logoRow}><div className={styles.sq} /><div className={styles.sq} /></div>
              <div className={styles.logoRow}><div className={styles.cr} /><div className={styles.cr} /></div>
            </div>
            {sidebarOpen && <span className={styles.logoText}>Payzati</span>}
          </Link>
          <button className={styles.collapseBtn} onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              >
                <span className={styles.navIcon}>
                  <Icon size={18} strokeWidth={1.65} color={isActive ? 'var(--accent-teal)' : 'var(--text-secondary)'} />
                </span>
                {sidebarOpen && <span className={styles.navLabel}>{item.label}</span>}
              </Link>
            );
          })}

          <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {secondaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                  style={{ opacity: 0.85 }}
                >
                  <span className={styles.navIcon}>
                    <Icon size={16} strokeWidth={1.65} color={isActive ? 'var(--accent-teal)' : 'var(--text-tertiary)'} />
                  </span>
                  {sidebarOpen && <span className={styles.navLabel} style={{ fontSize: '0.82rem' }}>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={styles.signOutBtn} onClick={handleSignOut}>
            <LogOut size={17} strokeWidth={1.65} color="var(--text-secondary)" />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <button className={styles.mobileMenuBtn} onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={22} strokeWidth={1.65} />
          </button>

          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'inline-flex', padding: '3px', borderRadius: '9999px', background: 'var(--elevation-2)', border: '1px solid var(--border-default)' }}>
              <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, background: 'var(--elevation-1)', color: 'var(--text-primary)', boxShadow: 'var(--shadow-sm)' }}>
                Employer
              </span>
              <button
                onClick={() => {
                  document.cookie = 'payzati_demo_role=employee; path=/; max-age=86400';
                  localStorage.setItem('payzati_demo_role', 'employee');
                  router.push('/employee/dashboard');
                }}
                style={{ border: 'none', background: 'transparent', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                Switch to Employee →
              </button>
            </div>

            <div className={styles.topbarRight} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <ThemeToggle />

              {company && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', paddingLeft: '0.85rem', borderLeft: '1px solid var(--border-default)' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '10px', background: 'var(--accent-teal)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
                    {company.name.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>{company.name}</span>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className={styles.content}>
          <div key={pathname} className={`${styles.contentWrapper} page-transition`}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
