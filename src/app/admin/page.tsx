'use client';

import { useState, useEffect } from 'react';
import { initiateMasterAuthorization, getAdminConfigStatus } from './actions';
import { 
  Zap, 
  ShieldCheck, 
  AlertTriangle, 
  Key, 
  Settings, 
  Info,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

export default function AdminPortal() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [limitUSD, setLimitUSD] = useState<number>(1000); // Default to $1000 for standard testing

  const fetchConfig = async () => {
    setChecking(true);
    setError('');
    try {
      const status = await getAdminConfigStatus();
      setConfig(status);
    } catch (e: any) {
      setError('Failed to load setup status: ' + e.message);
    }
    setChecking(false);
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleAuthorize = async () => {
    setLoading(true);
    setError('');
    try {
      const redirectUrl = await initiateMasterAuthorization(limitUSD);
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    } catch (e: any) {
      console.error(e);
      const errorMsg = e.message || '';
      if (errorMsg.includes('Server Components render') || errorMsg.includes('digest')) {
        setError(
          "Ah, looks like the server had a tiny hiccup. This usually means a signature key or wallet link isn't quite right, or the testnet bank is taking a quick nap. Double-check your settings and let's try that again!"
        );
      } else {
        setError(e.message || "Oops! An unexpected issue came up while linking the wallet.");
      }
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div style={{ height: '100vh', width: '100vw', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          <RefreshCw className="animate-spin" size={24} color="var(--accent-teal)" />
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Just making sure everything is in order... one moment!</span>
        </div>
      </div>
    );
  }

  // Detect missing keys
  const isConfigIncomplete = !config?.walletAddress || !config?.hasPrivateKey || !config?.hasKeyId;

  return (
    <div style={{ minHeight: '100vh', width: '100vw', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div className="card" style={{ maxWidth: '680px', width: '100%', padding: '3rem 2.5rem', background: 'var(--elevation-1)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
          <div style={{ background: 'var(--accent-teal-dim)', padding: '8px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Settings size={22} color="var(--accent-teal)" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Admin Dashboard</h1>
            <span style={{ fontSize: '0.78125rem', color: 'var(--text-tertiary)' }}>Hey there! Let&apos;s get your main wallet linked up so we can get started.</span>
          </div>
        </div>

        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6', fontSize: 'var(--text-sm)' }}>
          Welcome! Before we can start sending out payments to your wonderful team, let&apos;s link up your main wallet. 
          This lets us handle all the heavy lifting in the background so you can sit back and relax, without having to manually approve every single person&apos;s salary.
        </p>

        {/* Configuration Status Card */}
        <div style={{ background: 'var(--elevation-2)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '0.875rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Key size={14} color="var(--accent-teal)" /> Let&apos;s check if we&apos;ve got everything ready to go
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Your wallet&apos;s address</span>
              {config?.walletAddress ? (
                <span style={{ color: 'var(--accent-teal)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{config.walletAddress}</span>
              ) : (
                <span className="badge badge-warning" style={{ color: 'var(--status-warning)' }}>Missing</span>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Your private signature key</span>
              {config?.hasPrivateKey ? (
                <span style={{ color: 'var(--accent-teal)', fontWeight: 600 }}>Active</span>
              ) : (
                <span className="badge badge-warning" style={{ color: 'var(--status-warning)' }}>Missing</span>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Key ID check</span>
              {config?.hasKeyId ? (
                <span style={{ color: 'var(--accent-teal)', fontWeight: 600 }}>Configured</span>
              ) : (
                <span className="badge badge-warning" style={{ color: 'var(--status-warning)' }}>Missing</span>
              )}
            </div>
          </div>
        </div>

        {/* Missing configuration alerts */}
        {isConfigIncomplete ? (
          <div style={{ padding: '1.25rem', background: 'rgba(255,170,0,0.08)', border: '1px solid rgba(255,170,0,0.25)', borderRadius: 'var(--radius-md)', color: 'var(--status-warning)', fontSize: 'var(--text-sm)', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <strong>Oops! Looks like a few details are still missing</strong>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', lineHeight: '1.5', margin: 0 }}>
              No worries! Just head over to your Vercel settings, drop in the missing keys, and trigger a quick redeploy. 
              We&apos;ll be right here waiting for you!
            </p>
          </div>
        ) : (
          <>
            {/* Interactive Limit Selector */}
            <div style={{ background: 'var(--elevation-2)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <label htmlFor="limit-select" style={{ fontSize: '0.875rem', fontWeight: 600 }}>How much of a safety limit would you like to set?</label>
                <select 
                  id="limit-select"
                  value={limitUSD} 
                  onChange={(e) => setLimitUSD(Number(e.target.value))}
                  style={{
                    background: 'var(--elevation-1)',
                    border: '1px solid var(--border-subtle)',
                    color: '#ffffff',
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value={100}>$100 (Great for small tests)</option>
                  <option value={1000}>$1,000 (Recommended for sandbox testing)</option>
                  <option value={10000}>$10,000 (For slightly larger payouts)</option>
                  <option value={100000}>$100,000 (Enterprise sandbox cap)</option>
                  <option value={10000000}>$10,000,000 (Unlimited cap)</option>
                </select>
              </div>

              {/* Informative explanation about how the limit works */}
              <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <Info size={16} color="var(--accent-teal)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  <strong>Wait, how does this limit work?</strong><br />
                  Think of this as a friendly safety cap. It&apos;s just a quick heads-up to the system so we know the max amount we can send out on your behalf before checking in with you. 
                  <span style={{ color: 'var(--accent-teal)' }}> Don&apos;t worry, you don&apos;t need to have this exact amount sitting in your account right now</span> — it&apos;s just a budget boundary to keep your funds safe and sound!
                </div>
              </div>
            </div>
          </>
        )}

        {error && (
          <div style={{ padding: '1.25rem', background: 'rgba(235,94,85,0.1)', border: '1px solid rgba(235,94,85,0.3)', color: 'var(--status-error)', borderRadius: 'var(--radius-md)', marginBottom: '2rem', fontSize: 'var(--text-sm)' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '0.5rem' }}>
              <AlertTriangle size={16} />
              <strong>Oops, something didn&apos;t quite work!</strong>
            </div>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{error}</p>
          </div>
        )}

        {/* Action Button */}
        {isConfigIncomplete ? (
          <button 
            className="btn btn-secondary btn-lg" 
            disabled 
            style={{ width: '100%', cursor: 'not-allowed', opacity: 0.6 }}
          >
            Let&apos;s get those settings filled in first!
          </button>
        ) : (
          <button 
            className="btn btn-primary btn-lg" 
            onClick={handleAuthorize} 
            disabled={loading}
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
          >
            {loading ? 'Connecting...' : 'All set! Let\'s link your wallet'} <ChevronRight size={18} />
          </button>
        )}

      </div>
    </div>
  );
}
