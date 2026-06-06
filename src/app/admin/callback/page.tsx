'use client';

import { useEffect, useState } from 'react';
import { processMasterCallback } from './actions';

export default function AdminCallback() {
  const [status, setStatus] = useState('Processing authorization...');
  const [error, setError] = useState('');

  useEffect(() => {
    async function process() {
      try {
        const url = window.location.href;
        if (!url.includes('interact_ref')) {
          setStatus('No interact_ref found in URL.');
          return;
        }

        await processMasterCallback(url);
        setStatus('Authorization Complete! Master Token Saved.');
        setTimeout(() => {
          window.location.href = '/admin';
        }, 2000);
      } catch (e: any) {
        setError(e.message);
        setStatus('Authorization Failed');
      }
    }
    process();
  }, []);

  return (
    <div style={{ height: '100vh', width: '100vw', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '3rem', textAlign: 'center', background: 'var(--bg-surface)' }}>
        <h2 style={{ marginBottom: '1rem' }}>{status}</h2>
        {error && (
          <div style={{ padding: '1rem', background: 'var(--status-error)', color: 'white', borderRadius: 'var(--radius-md)', textAlign: 'left', wordBreak: 'break-all' }}>
            <strong>Error: </strong> {error}
          </div>
        )}
      </div>
    </div>
  );
}
