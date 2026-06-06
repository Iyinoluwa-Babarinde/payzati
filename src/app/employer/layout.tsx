'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getCompany } from '@/lib/supabase/queries';
import styles from './employer.module.css';
import { Toaster } from 'react-hot-toast';
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
  Menu
} from 'lucide-react';

const navItems = [
  { href: '/employer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/employer/employees', label: 'Employees', icon: Users },
  { href: '/employer/payroll', label: 'Run Payroll', icon: Banknote },
  { href: '/employer/wallet', label: 'Wallet', icon: Wallet },
  { href: '/employer/compliance', label: 'Compliance', icon: Scale },
  { href: '/employer/settings', label: 'Settings', icon: Settings },
];

export default function EmployerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const comp = await getCompany();
      if (cancelled) return;
      setCompany(comp);
      setLoading(false);
    }
    init();

    return () => { cancelled = true; };
  }, [pathname]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/auth/login';
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: '50%' }}></div>
          <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>Loading workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--elevation-2)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
            backdropFilter: 'blur(12px)',
          },
          success: { iconTheme: { primary: 'var(--accent-teal)', secondary: '#000' } },
        }}
      />
      <aside className={`${styles.sidebar} ${sidebarOpen ? '' : styles.collapsed}`}>
        <div className={styles.sidebarHeader}>
          <Link href="/employer/dashboard" className={styles.sidebarLogo}>
            <div className={styles.logoMark}>
              <div className={styles.logoRow}><div className={styles.sq}></div><div className={styles.sq}></div></div>
              <div className={styles.logoRow}><div className={styles.cr}></div><div className={styles.cr}></div></div>
            </div>
            {sidebarOpen && <span className={styles.logoText}>Payzati</span>}
          </Link>
          <button className={styles.collapseBtn} onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              >
                <span className={styles.navIcon}>
                  <Icon size={18} color={isActive ? 'var(--accent-teal)' : 'var(--text-secondary)'} />
                </span>
                {sidebarOpen && <span className={styles.navLabel}>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={styles.signOutBtn} onClick={handleSignOut}>
            <LogOut size={18} color="var(--text-secondary)" />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <button className={styles.mobileMenuBtn} onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={24} />
          </button>
          <div className={styles.topbarRight}>
            <div className={styles.ilpBadge}>
              <span className={styles.ilpDot}></span>
              ILP Connected
            </div>
            {company && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '1rem', borderLeft: '1px solid var(--border-subtle)', marginLeft: '0.5rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-teal)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem' }}>
                  {company.name.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>{company.name}</span>
              </div>
            )}
          </div>
        </header>
        <div className={styles.content}>
          <div className={styles.contentWrapper}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
