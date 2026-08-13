'use client';

import React, { useState, useEffect } from 'react';
import { getFXQuote, formatCurrency, FXQuote } from '@/lib/fx-engine';
import { ArrowRightLeft, RefreshCw, Zap, ShieldCheck, CheckCircle, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'NGN', name: 'Nigerian Naira', flag: '🇳🇬' },
  { code: 'KES', name: 'Kenyan Shilling', flag: '🇰🇪' },
  { code: 'GHS', name: 'Ghanaian Cedi', flag: '🇬🇭' },
  { code: 'ZAR', name: 'South African Rand', flag: '🇿🇦' },
  { code: 'EGP', name: 'Egyptian Pound', flag: '🇪🇬' },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
];

export default function LiveFXQuoteWidget() {
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('NGN');
  const [amount, setAmount] = useState<number>(1000);
  const [quote, setQuote] = useState<FXQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [testingPayment, setTestingPayment] = useState(false);

  const fetchQuote = () => {
    setLoading(true);
    setTimeout(() => {
      const newQuote = getFXQuote(fromCurrency, toCurrency, amount);
      setQuote(newQuote);
      setLoading(false);
    }, 250);
  };

  useEffect(() => {
    fetchQuote();
  }, [fromCurrency, toCurrency, amount]);

  const handleSwap = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  const handleTestQuotePayment = async () => {
    if (!quote) return;
    setTestingPayment(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverWallet: `https://ilp.interledger-test.dev/demo-${toCurrency.toLowerCase()}`,
          amount: quote.toAmount,
          currency: toCurrency,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Demo payment of ${formatCurrency(quote.toAmount, toCurrency)} settled via Interledger!`);
      } else {
        toast.error('Payment simulation failed.');
      }
    } catch (e) {
      toast.error('Failed to trigger payment simulation.');
    } finally {
      setTestingPayment(false);
    }
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '24px',
        padding: '2rem',
        color: '#ffffff',
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        maxWidth: '520px',
        margin: '0 auto',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #1dbb9c 0%, #00d4aa 100%)',
              borderRadius: '10px',
              padding: '6px',
              display: 'flex',
            }}
          >
            <Sparkles size={18} color="#0d1117" />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Live FX Rate Quote</h3>
        </div>
        <button
          onClick={fetchQuote}
          disabled={loading}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            borderRadius: '10px',
            padding: '8px 12px',
            color: '#aaa',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem',
            transition: 'all 0.2s ease',
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Amount Input */}
      <div style={{ marginBottom: '1.25rem' }}>
        <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>Send Amount</label>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(15,23,42,0.6)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '14px',
            padding: '0.75rem 1rem',
          }}
        >
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#fff',
              fontSize: '1.5rem',
              fontWeight: 700,
              width: '100%',
            }}
          />
          <select
            value={fromCurrency}
            onChange={(e) => setFromCurrency(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '10px',
              color: '#fff',
              padding: '6px 12px',
              fontWeight: 600,
              fontSize: '0.95rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code} style={{ background: '#0f172a', color: '#fff' }}>
                {c.flag} {c.code}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Swap Button */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '-0.5rem 0 0.75rem 0' }}>
        <button
          onClick={handleSwap}
          style={{
            background: 'linear-gradient(135deg, #1dbb9c 0%, #00d4aa 100%)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0,212,170,0.4)',
            zIndex: 2,
          }}
        >
          <ArrowRightLeft size={16} color="#0d1117" />
        </button>
      </div>

      {/* Receive Amount */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>Recipient Takes Home</label>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(15,23,42,0.6)',
            border: '1px solid rgba(0,212,170,0.3)',
            borderRadius: '14px',
            padding: '0.75rem 1rem',
          }}
        >
          <div style={{ width: '100%', fontSize: '1.5rem', fontWeight: 700, color: '#00d4aa' }}>
            {quote ? formatCurrency(quote.toAmount, toCurrency) : '...'}
          </div>
          <select
            value={toCurrency}
            onChange={(e) => setToCurrency(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '10px',
              color: '#fff',
              padding: '6px 12px',
              fontWeight: 600,
              fontSize: '0.95rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code} style={{ background: '#0f172a', color: '#fff' }}>
                {c.flag} {c.code}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* FX Rate & Fee Breakdown */}
      {quote && (
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '14px',
            padding: '1rem',
            marginBottom: '1.5rem',
            border: '1px solid rgba(255,255,255,0.06)',
            fontSize: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#cbd5e1' }}>
            <span>Exchange Rate</span>
            <span>1 {fromCurrency} = {quote.effectiveRate} {toCurrency}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#cbd5e1' }}>
            <span>Payzati Spread (Transparent)</span>
            <span style={{ color: '#00d4aa' }}>0.2% (vs 3-5% traditional bank)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
            <span>Settlement Rail</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#38bdf8' }}>
              <Zap size={13} /> Interledger Open Payments
            </span>
          </div>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handleTestQuotePayment}
        disabled={testingPayment || !quote}
        style={{
          width: '100%',
          background: 'linear-gradient(135deg, #1dbb9c 0%, #00d4aa 100%)',
          color: '#0d1117',
          border: 'none',
          borderRadius: '14px',
          padding: '1rem',
          fontWeight: 700,
          fontSize: '1rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          boxShadow: '0 8px 24px rgba(0,212,170,0.3)',
          transition: 'all 0.2s ease',
        }}
      >
        {testingPayment ? (
          <>
            <RefreshCw size={18} className="animate-spin" /> Processing Interledger Settlement...
          </>
        ) : (
          <>
            <ShieldCheck size={18} /> Test Instant Quote Settlement
          </>
        )}
      </button>
    </div>
  );
}
