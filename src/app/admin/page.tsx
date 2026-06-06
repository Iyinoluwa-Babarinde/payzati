'use client';

import { useState, useEffect } from 'react';
import { initiateMasterAuthorization, getAdminConfigStatus } from './actions';
import { 
  Zap, 
  ShieldCheck, 
  AlertTriangle, 
  Key, 
  Layers, 
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
      setError('Failed to fetch admin config status: ' + e.message);
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
      // Catch production next.js server action exceptions gracefully
      const errorMsg = e.message || '';
      if (errorMsg.includes('Server Components render') || errorMsg.includes('digest')) {
        setError(
          'Authorization request failed on the server. This usually means the Interledger key signature or wallet address is invalid, or the testnet bank could not be reached. Double-check your Vercel credentials.'
        );
      } else {
        setError(e.message || 'An unexpected error occurred during authorization.');
      }
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div style={{ height: '100vh', width: '100vw', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          <RefreshCw className="animate-spin" size={24} color="var(--accent-teal)" />
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Verifying Vercel Environment Configuration...</span>
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
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Payzati Admin Console</h1>
            <span style={{ fontSize: '0.78125rem', color: 'var(--text-tertiary)' }}>Interledger Node & Escrow Wallet Manager</span>
          </div>
        </div>

        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6', fontSize: 'var(--text-sm)' }}>
          Establish the liquidity pipeline for automated payroll payouts. Setting up a master payment grant 
          enables employers to run frictionless bulk payroll without requiring manual approvals for individual employee transactions.
        </p>

        {/* Configuration Status Card */}
        <div style={{ background: 'var(--elevation-2)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '0.875rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Key size={14} color="var(--accent-teal)" /> Credentials Checklist
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Master Wallet Pointer (PAYZATI_WALLET_ADDRESS)</span>
              {config?.walletAddress ? (
                <span style={{ color: 'var(--accent-teal)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{config.walletAddress}</span>
              ) : (
                <span className="badge badge-warning" style={{ color: 'var(--status-warning)' }}>Missing</span>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Signature Private Key (ILP_PRIVATE_KEY)</span>
              {config?.hasPrivateKey ? (
                <span style={{ color: 'var(--accent-teal)', fontWeight: 600 }}>Active</span>
              ) : (
                <span className="badge badge-warning" style={{ color: 'var(--status-warning)' }}>Missing</span>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Key Identifier (ILP_KEY_ID)</span>
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
              <strong>Missing Environment Configuration</strong>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', lineHeight: '1.5', margin: 0 }}>
              The application requires you to set the missing variables in your Vercel Project Settings. 
              Once added, deploy a new build of the site to complete authentication setup.
            </p>
          </div>
        ) : (
          <>
            {/* Interactive Limit Selector */}
            <div style={{ background: 'var(--elevation-2)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <label htmlFor="limit-select" style={{ fontSize: '0.875rem', fontWeight: 600 }}>Set Outgoing Payment Cap</label>
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
                  <option value={100}>$100.00 (Single Transaction testing)</option>
                  <option value={1000}>$1,000.00 (Recommended Sandbox Limit)</option>
                  <option value={10000}>$10,000.00 (Business payroll test)</option>
                  <option value={100000}>$100,000.00 (Medium Enterprise cap)</option>
                  <option value={10000000}>$10,000,000.00 (Maximum platform allowance)</option>
                </select>
              </div>

              {/* Informative explanation about how the limit works */}
              <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <Info size={16} color="var(--accent-teal)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  <strong>How does this cap work?</strong><br />
                  This is a <strong>direct debit mandate</strong> limit. It authorizes Payzati to execute payments on your behalf up to a cumulative maximum of <strong>${limitUSD.toLocaleString()}</strong> over the lifetime of this key. 
                  <span style={{ color: 'var(--accent-teal)' }}> You do NOT need this amount deposited in your account.</span> It is simply a budget limit for security.
                </div>
              </div>
            </div>
          </>
        )}

        {error && (
          <div style={{ padding: '1.25rem', background: 'rgba(235,94,85,0.1)', border: '1px solid rgba(235,94,85,0.3)', color: 'var(--status-error)', borderRadius: 'var(--radius-md)', marginBottom: '2rem', fontSize: 'var(--text-sm)' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '0.5rem' }}>
              <AlertTriangle size={16} />
              <strong>Authorization Failed</strong>
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
            Configure environment variables to authorize
          </button>
        ) : (
          <button 
            className="btn btn-primary btn-lg" 
            onClick={handleAuthorize} 
            disabled={loading}
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
          >
            {loading ? 'Initiating Handshake...' : 'Authorize Master Wallet on Testnet'} <ChevronRight size={18} />
          </button>
        )}

      </div>
    </div>
  );
}
