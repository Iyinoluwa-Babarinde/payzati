'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getEmployeeProfile } from '@/lib/supabase/queries';
import { Toaster } from 'react-hot-toast';
import styles from '../employer/employer.module.css'; // Reusing the exact same UI shell as the employer
import { 
  LayoutDashboard, 
  Receipt, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Menu
} from 'lucide-react';

const navItems = [
  { href: '/employee/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
  { href: '/employee/paystubs', label: 'Paystubs', icon: Receipt },
  { href: '/employee/settings', label: 'Bank & Tax Info', icon: Settings },
];

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const emp = await getEmployeeProfile();
      if (cancelled) return;
      if (!emp) {
        // Fallback for demo
        setEmployee({ name: 'Demo Employee', companies: { name: 'Demo Corp' } });
      } else {
        setEmployee(emp);
      }
      setLoading(false);
    }
    init();

    return () => { cancelled = true; };
  }, [pathname]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
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
          <Link href="/employee/dashboard" className={styles.sidebarLogo}>
            <div className={styles.logoMark}>
              <div className={styles.logoRow}><div className={styles.sq}></div><div className={styles.sq}></div></div>
              <div className={styles.logoRow}><div className={styles.cr}></div><div className={styles.cr}></div></div>
            </div>
            {sidebarOpen && <span className={styles.logoText}>Payzati <span style={{color:'var(--text-secondary)', fontWeight: 400}}>for Teams</span></span>}
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
          
          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: 'var(--text-secondary)' }}>
              Working at <strong style={{ color: 'var(--accent-teal)' }}>{employee?.companies?.name || 'Your Company'}</strong>
            </div>
            
            <div className={styles.topbarRight}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', background: 'var(--elevation-2)', border: '1px solid var(--border-default)' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-purple)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>
                  {employee?.name?.charAt(0).toUpperCase() || 'E'}
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>{employee?.name}</span>
              </div>
            </div>
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
