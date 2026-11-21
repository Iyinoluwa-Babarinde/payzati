'use client';

import React, { useState, useEffect } from 'react';
import { getFXQuote, formatCurrency, FXQuote } from '@/lib/fx-engine';
import { ArrowUpDown, RefreshCw, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
  { code: 'NGN', name: 'Nigerian Naira', flag: '🇳🇬' },
  { code: 'KES', name: 'Kenyan Shilling', flag: '🇰🇪' },
  { code: 'GHS', name: 'Ghanaian Cedi', flag: '🇬🇭' },
  { code: 'ZAR', name: 'South African Rand', flag: '🇿🇦' },
  { code: 'EGP', name: 'Egyptian Pound', flag: '🇪🇬' },
];

export default function LiveFXQuoteWidget() {
  const [fromCurrency, setFromCurrency] = useState('GBP');
  const [toCurrency, setToCurrency] = useState('NGN');
  const [amount, setAmount] = useState<number>(1000);
  const [quote, setQuote] = useState<FXQuote | null>(null);
  const [testingPayment, setTestingPayment] = useState(false);

  useEffect(() => {
    setQuote(getFXQuote(fromCurrency, toCurrency, amount));
  }, [fromCurrency, toCurrency, amount]);

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handleTestQuotePayment = async () => {
    if (!quote) return;
    setTestingPayment(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverWallet: `https://ilp.interledger-test.dev/da071cb6`,
          amount: quote.toAmount,
          currency: toCurrency,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Sent ${formatCurrency(quote.toAmount, toCurrency)} in under a second.`);
      } else {
        toast.error('Could not send test payment. Please try again.');
      }
    } catch {
      toast.error('Connection issue. Please try again.');
    } finally {
      setTestingPayment(false);
    }
  };

  return (
    <div
      style={{
        background: 'var(--elevation-2)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '18px',
        padding: '1.25rem',
        width: '100%',
      }}
    >
      {/* You send */}
      <div style={{ marginBottom: '0.65rem' }}>
        <label
          htmlFor="fx-send-amount"
          style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}
        >
          You send
        </label>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--elevation-1)',
            border: '1px solid var(--border-default)',
            borderRadius: '14px',
            padding: '0.55rem 0.75rem',
            gap: '0.5rem',
          }}
        >
          <input
            id="fx-send-amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
            className="tabular-nums"
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              boxShadow: 'none',
              color: 'var(--text-primary)',
              fontSize: '1.35rem',
              fontWeight: 700,
              width: '100%',
              padding: '0.2rem 0.25rem',
            }}
          />
          <select
            aria-label="Send currency"
            value={fromCurrency}
            onChange={(e) => setFromCurrency(e.target.value)}
            style={{
              background: 'var(--elevation-2)',
              border: '1px solid var(--border-default)',
              borderRadius: '10px',
              color: 'var(--text-primary)',
              padding: '0.45rem 0.65rem',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.code}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Swap */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '-0.35rem 0' }}>
        <button
          type="button"
          onClick={handleSwap}
          aria-label="Swap currencies"
          style={{
            background: 'var(--elevation-1)',
            border: '1px solid var(--border-default)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            boxShadow: 'var(--shadow-sm)',
            zIndex: 2,
          }}
        >
          <ArrowUpDown size={14} strokeWidth={1.75} />
        </button>
      </div>

      {/* They receive */}
      <div style={{ marginBottom: '1rem' }}>
        <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
          They receive
        </span>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--elevation-1)',
            border: '1px solid var(--border-accent)',
            borderRadius: '14px',
            padding: '0.55rem 0.75rem',
            gap: '0.5rem',
          }}
        >
          <div className="tabular-nums" style={{ width: '100%', fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-teal)', padding: '0.2rem 0.25rem' }}>
            {quote ? formatCurrency(quote.toAmount, toCurrency) : '—'}
          </div>
          <select
            aria-label="Receive currency"
            value={toCurrency}
            onChange={(e) => setToCurrency(e.target.value)}
            style={{
              background: 'var(--elevation-2)',
              border: '1px solid var(--border-default)',
              borderRadius: '10px',
              color: 'var(--text-primary)',
              padding: '0.45rem 0.65rem',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.code}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Simple rate summary */}
      {quote && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            marginBottom: '1rem',
            padding: '0 0.25rem',
          }}
        >
          <span className="tabular-nums">
            1 {fromCurrency} = <strong style={{ color: 'var(--text-primary)' }}>{quote.effectiveRate} {toCurrency}</strong>
          </span>
          <span style={{ color: 'var(--accent-teal)', fontWeight: 600 }}>Arrives in ~1 second</span>
        </div>
      )}

      <button
        type="button"
        onClick={handleTestQuotePayment}
        disabled={testingPayment || !quote}
        className="btn btn-primary btn-block"
      >
        {testingPayment ? (
          <>
            <RefreshCw size={15} className="animate-spin" /> Sending test transfer...
          </>
        ) : (
          <>
            <CheckCircle2 size={15} strokeWidth={1.75} /> Send test transfer
          </>
        )}
      </button>
    </div>
  );
}
