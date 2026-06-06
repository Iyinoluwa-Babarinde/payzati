'use client';

import { useState } from 'react';
import { initiateMasterAuthorization } from './actions';
import { Zap } from 'lucide-react';

export default function AdminPortal() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuthorize = async () => {
    setLoading(true);
    setError('');
    try {
      const redirectUrl = await initiateMasterAuthorization();
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', width: '100vw', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="card" style={{ maxWidth: '600px', width: '100%', padding: '4rem 3rem', background: 'var(--elevation-1)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)' }}>
        <h1 style={{ fontSize: 'var(--text-lg)', marginBottom: '1rem', fontWeight: 700 }}>Admin Portal</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', lineHeight: '1.6' }}>
          This portal is strictly for Payzati administrators. Authorize the Master Wallet on the ILP testnet to enable frictionless payroll for all employers.
        </p>

        <div style={{ background: 'var(--accent-teal-dim)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '2rem', fontSize: 'var(--text-xs)', color: 'var(--accent-teal)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <Zap size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Master Wallet Address:</strong> {process.env.NEXT_PUBLIC_PAYZATI_WALLET_ADDRESS || 'https://ilp.interledger-test.dev/a5cb6a41'}<br/><br/>
            This will request a $10,000,000 outgoing payment grant from the testnet. You must log in to the testnet bank to approve it.
          </div>
        </div>

        {error && (
          <div style={{ padding: '1rem', background: 'var(--status-error)', color: 'white', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
            <strong>Error: </strong> {error}
          </div>
        )}

        <button 
          className="btn btn-primary btn-lg" 
          onClick={handleAuthorize} 
          disabled={loading}
          style={{ width: '100%' }}
        >
          {loading ? 'Requesting Grant...' : 'Authorize Master Wallet on Testnet'}
        </button>
      </div>
    </div>
  );
}
