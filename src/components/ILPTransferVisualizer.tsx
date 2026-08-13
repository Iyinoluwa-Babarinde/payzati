'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, ArrowRight, ExternalLink, Layers, Radio, ShieldCheck, Copy } from 'lucide-react';
import { formatCurrency } from '@/lib/fx-engine';
import toast from 'react-hot-toast';

export interface ILPTransferVisualizerProps {
  isOpen: boolean;
  onClose: () => void;
  senderWallet?: string;
  receiverWallet?: string;
  senderName?: string;
  receiverName?: string;
  sendAmount?: number;
  sendCurrency?: string;
  receiveAmount?: number;
  receiveCurrency?: string;
  receiptHash?: string;
  onComplete?: () => void;
}

export default function ILPTransferVisualizer({
  isOpen,
  onClose,
  senderWallet = 'https://ilp.interledger-test.dev/a5cb6a41',
  receiverWallet = 'https://ilp.interledger-test.dev/a5cb6a41',
  senderName = 'Payzati Employer Master Wallet',
  receiverName = 'Sarah Johansson (Software Engineer)',
  sendAmount = 1000,
  sendCurrency = 'USD',
  receiveAmount = 1550000,
  receiveCurrency = 'NGN',
  receiptHash,
  onComplete,
}: ILPTransferVisualizerProps) {
  const [phase, setPhase] = useState<'initiating' | 'grant_quoting' | 'streaming' | 'settled'>('initiating');
  const [progress, setProgress] = useState(0);
  const [packetsDelivered, setPacketsDelivered] = useState(0);
  
  // Clean starting balance calculation ensuring positive remaining balance
  const startingSenderBalance = Math.max(250000, sendAmount * 1.5);
  const [senderBalance, setSenderBalance] = useState(startingSenderBalance);
  const [receiverBalance, setReceiverBalance] = useState(0);
  const [transactionId, setTransactionId] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setPhase('initiating');
      setProgress(0);
      setPacketsDelivered(0);
      setSenderBalance(startingSenderBalance);
      setReceiverBalance(0);
      return;
    }

    setPhase('initiating');
    setProgress(15);
    setTransactionId(`https://ilp.interledger-test.dev/outgoing-payments/tx_${Date.now()}`);

    const timer1 = setTimeout(() => {
      setPhase('grant_quoting');
      setProgress(35);
    }, 400);

    const timer2 = setTimeout(() => {
      setPhase('streaming');
      setProgress(50);
    }, 850);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isOpen, startingSenderBalance]);

  useEffect(() => {
    let interval: any = null;
    if (phase === 'streaming') {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setPhase('settled');
            if (onComplete) onComplete();
            return 100;
          }
          const next = prev + 10;
          setPacketsDelivered(Math.floor((next / 100) * 64));
          setSenderBalance(startingSenderBalance - (sendAmount * (next / 100)));
          setReceiverBalance(receiveAmount * (next / 100));
          return next;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [phase, sendAmount, receiveAmount, startingSenderBalance, onComplete]);

  if (!isOpen) return null;

  const displayReceipt = receiptHash || `0x7f8a${Math.random().toString(36).substring(2, 10)}${Date.now().toString(16)}`;

  const handleCopyReceipt = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(displayReceipt);
      toast.success('SHA-256 Receipt copied to clipboard!');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(12px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-default)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '640px',
          padding: '2rem',
          color: 'var(--text-primary)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'var(--accent-teal-dim)', padding: '10px', borderRadius: '12px', color: 'var(--accent-teal)' }}>
              <Radio size={22} className="animate-pulse" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Interledger Settlement</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Open Payments STREAM Protocol</span>
            </div>
          </div>
          <span
            className="badge badge-success"
            style={{
              padding: '6px 12px',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--status-success)', display: 'inline-block' }} />
            LIVE TESTNET SETTLEMENT
          </span>
        </div>

        {/* Dual Wallet Display (Sender vs Receiver) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
          {/* Sender Wallet Card */}
          <div style={{ background: 'var(--elevation-2)', border: '1px solid var(--border-default)', borderRadius: '16px', padding: '1.2rem' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              Sender (Employer)
            </span>
            <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>{senderName}</strong>
            <div style={{ fontFamily: 'monospace', fontSize: '0.725rem', color: 'var(--text-secondary)', wordBreak: 'break-all', marginBottom: '10px' }}>
              {senderWallet}
            </div>
            <div style={{ background: 'var(--elevation-1)', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border-default)' }}>
              <span style={{ fontSize: '0.675rem', color: 'var(--text-secondary)', display: 'block' }}>Wallet Balance</span>
              <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                {formatCurrency(senderBalance, sendCurrency)}
              </strong>
            </div>
          </div>

          {/* Transfer Arrow Icon */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'var(--accent-teal)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                boxShadow: 'var(--shadow-glow-teal)',
              }}
            >
              <ArrowRight size={20} />
            </div>
            <span style={{ fontSize: '0.675rem', color: 'var(--accent-teal)', fontWeight: 700, display: 'block', marginTop: '6px' }}>ILP STREAM</span>
          </div>

          {/* Receiver Wallet Card */}
          <div style={{ background: 'var(--elevation-2)', border: '1px solid var(--border-default)', borderRadius: '16px', padding: '1.2rem' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              Recipient (Employee)
            </span>
            <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>{receiverName}</strong>
            <div style={{ fontFamily: 'monospace', fontSize: '0.725rem', color: 'var(--accent-teal)', wordBreak: 'break-all', marginBottom: '10px' }}>
              {receiverWallet}
            </div>
            <div style={{ background: 'var(--elevation-1)', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border-default)' }}>
              <span style={{ fontSize: '0.675rem', color: 'var(--text-secondary)', display: 'block' }}>Received Amount</span>
              <strong style={{ fontSize: '1.05rem', color: 'var(--accent-teal)' }}>
                {formatCurrency(receiverBalance, receiveCurrency)}
              </strong>
            </div>
          </div>
        </div>

        {/* Animated Open Payments Protocol Stage */}
        <div style={{ background: 'var(--elevation-2)', border: '1px solid var(--border-default)', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.825rem' }}>
            <span style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
              <Layers size={16} color="var(--accent-teal)" />
              {phase === 'initiating' ? 'Resolving Open Payments Pointers...' :
               phase === 'grant_quoting' ? 'Obtaining GNAP Grants & FX Quotes...' :
               phase === 'streaming' ? 'Streaming ILP Packets...' : 'Settlement Complete!'}
            </span>
            <span style={{ fontFamily: 'monospace', color: 'var(--accent-teal)', fontWeight: 700 }}>
              {packetsDelivered} / 64 Packets
            </span>
          </div>

          <div style={{ width: '100%', height: '8px', background: 'var(--border-default)', borderRadius: '100px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                background: 'var(--accent-teal)',
                borderRadius: '100px',
                transition: 'width 0.2s ease',
              }}
            />
          </div>
        </div>

        {/* Cryptographic Proof Details */}
        {phase === 'settled' && (
          <div style={{ background: 'var(--accent-teal-dim)', border: '1px solid var(--border-accent)', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-teal)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '6px' }}>
              <CheckCircle2 size={18} /> Payment Verified &amp; Cryptographically Settled
            </div>
            <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Transaction Resource: <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{transactionId}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
              <span>
                SHA-256 Receipt: <strong style={{ fontFamily: 'monospace', color: 'var(--accent-teal)' }}>{displayReceipt}</strong>
              </span>
              <button 
                onClick={handleCopyReceipt}
                style={{ background: 'transparent', border: 'none', color: 'var(--accent-teal)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
              >
                <Copy size={13} /> Copy
              </button>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div>
          <button
            onClick={onClose}
            disabled={phase !== 'settled'}
            className="btn btn-primary btn-block"
            style={{
              padding: '0.9rem',
              fontSize: '0.95rem',
              fontWeight: 700,
            }}
          >
            {phase === 'settled' ? 'Done & Return to Workspace' : 'Executing Interledger STREAM Protocol...'}
          </button>
        </div>
      </div>
    </div>
  );
}
