'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, ExternalLink, ArrowLeft, RefreshCw } from 'lucide-react';
import { processMasterCallback } from './actions';

export default function AdminCallback() {
  const [phase, setPhase] = useState<'processing' | 'success' | 'rejected' | 'error'>('processing');
  const [message, setMessage] = useState('Finishing wallet approval...');

  useEffect(() => {
    async function process() {
      try {
        const parsed = new URL(window.location.href);
        const result = parsed.searchParams.get('result');
        const interactRef = parsed.searchParams.get('interact_ref');

        if (result === 'grant_rejected') {
          setPhase('rejected');
          setMessage(
            'Wallet approval was cancelled or forbidden. Make sure you are signed into wallet.interledger-test.dev with the account that owns your company wallet, then try again.'
          );
          return;
        }

        if (!interactRef) {
          setPhase('error');
          setMessage('No approval code was returned from Interledger. You can return to your dashboard and try again.');
          return;
        }

        await processMasterCallback(window.location.href);
        setPhase('success');
        setMessage('Payout budget approved. Returning to your workspace...');
        setTimeout(() => {
          window.location.href = '/employer/dashboard';
        }, 1400);
      } catch (e: any) {
        setPhase('error');
        setMessage(e?.message || 'Unable to complete wallet approval. Please try again.');
      }
    }
    process();
  }, []);

  return (
    <main
      style={{
        minHeight: '100dvh',
        width: '100%',
        background: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <div className="bezel-shell" style={{ maxWidth: '480px', width: '100%' }}>
        <div className="bezel-core" style={{ padding: '2.25rem 2rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            {phase === 'processing' && <RefreshCw size={28} color="var(--accent-teal)" className="animate-spin" />}
            {phase === 'success' && <CheckCircle2 size={32} color="var(--status-success)" />}
            {(phase === 'rejected' || phase === 'error') && <AlertCircle size={32} color="var(--status-warning)" />}
          </div>

          <h1 style={{ fontSize: '1.35rem', marginBottom: '0.6rem' }}>
            {phase === 'processing' && 'Connecting wallet'}
            {phase === 'success' && 'Budget approved'}
            {phase === 'rejected' && 'Wallet approval not completed'}
            {phase === 'error' && 'Could not finish approval'}
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
            {message}
          </p>

          {(phase === 'rejected' || phase === 'error') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <a
                href="https://wallet.interledger-test.dev"
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary btn-block"
              >
                Sign in to Interledger Wallet <ExternalLink size={15} strokeWidth={1.75} />
              </a>
              <Link href="/employer/dashboard" className="btn btn-secondary btn-block">
                <ArrowLeft size={15} strokeWidth={1.75} /> Back to company overview
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
