'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Layers,
  Radio,
  Copy,
  X,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { formatCurrency } from '@/lib/fx-engine';
import { toast } from 'sonner';

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

const SPRING_TRANSITION = {
  type: 'spring',
  damping: 24,
  stiffness: 260,
  mass: 0.8,
} as const;

export default function ILPTransferVisualizer({
  isOpen,
  onClose,
  senderWallet = 'https://ilp.interledger-test.dev/da071cb6',
  receiverWallet = 'https://ilp.interledger-test.dev/da071cb6',
  senderName = 'Payzati Master Treasury',
  receiverName = 'Team Member',
  sendAmount = 1000,
  sendCurrency = 'EUR',
  receiveAmount = 1550000,
  receiveCurrency = 'NGN',
  receiptHash,
  onComplete,
}: ILPTransferVisualizerProps) {
  const [phase, setPhase] = useState<'initiating' | 'grant_quoting' | 'streaming' | 'settled'>('initiating');
  const [progress, setProgress] = useState(0);
  const [packetsDelivered, setPacketsDelivered] = useState(0);

  const startingSenderBalance = Math.max(25000, sendAmount * 1.5);
  const [senderBalance, setSenderBalance] = useState(startingSenderBalance);
  const [receiverBalance, setReceiverBalance] = useState(0);
  const [transactionId, setTransactionId] = useState('');

  // Handle ESC key for interruptibility (Apple HIG & Emil principles)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && phase === 'settled') {
        onClose();
      }
    },
    [onClose, phase]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

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
          setSenderBalance(startingSenderBalance - sendAmount * (next / 100));
          setReceiverBalance(receiveAmount * (next / 100));
          return next;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [phase, sendAmount, receiveAmount, startingSenderBalance, onComplete]);

  const displayReceipt =
    receiptHash || `0x7f8a${Math.random().toString(36).substring(2, 10)}${Date.now().toString(16)}`;

  const handleCopyReceipt = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(displayReceipt);
      toast.success('SHA-256 Receipt copied to clipboard');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="visualizer-scrim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 22, 0.62)',
            backdropFilter: 'blur(22px) saturate(160%)',
            WebkitBackdropFilter: 'blur(22px) saturate(160%)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && phase === 'settled') onClose();
          }}
        >
          {/* Double-Bezel (Doppelrand) Modal Dialog */}
          <motion.div
            key="visualizer-dialog"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={SPRING_TRANSITION}
            className="bezel-shell"
            style={{
              width: '100%',
              maxWidth: '640px',
              boxShadow: '0 32px 72px -16px rgba(11, 110, 92, 0.28), 0 16px 36px -8px rgba(0, 0, 0, 0.22)',
            }}
          >
            <div
              className="bezel-core"
              style={{
                padding: '2rem',
                position: 'relative',
                background: 'var(--elevation-1)',
              }}
            >
              {/* Close button (only active after settlement to avoid interrupting live flight) */}
              {phase === 'settled' && (
                <button
                  onClick={onClose}
                  style={{
                    position: 'absolute',
                    top: '1.25rem',
                    right: '1.25rem',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: '1px solid var(--border-default)',
                    background: 'var(--elevation-2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    transition: 'all var(--transition-fast)',
                  }}
                  title="Close (Esc)"
                >
                  <X size={16} />
                </button>
              )}

              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.75rem',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      background: 'var(--accent-teal-dim)',
                      padding: '10px',
                      borderRadius: '12px',
                      color: 'var(--accent-teal)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Radio size={20} className={phase !== 'settled' ? 'animate-pulse' : ''} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.025em' }}>
                      {phase === 'settled' ? 'Payment sent' : 'Sending payment'}
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Instant transfer via Interledger
                    </span>
                  </div>
                </div>

                <span
                  className="badge badge-success"
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'var(--status-success)',
                      display: 'inline-block',
                    }}
                  />
                  Live transfer
                </span>
              </div>

              {/* Dual Wallet Display (Sender vs Receiver) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto 1fr',
                  gap: '0.85rem',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                }}
              >
                {/* Sender Wallet Card */}
                <div
                  style={{
                    background: 'var(--elevation-2)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '16px',
                    padding: '1.15rem',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.68rem',
                      color: 'var(--text-tertiary)',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      display: 'block',
                      marginBottom: '3px',
                    }}
                  >
                    Sender (Employer)
                  </span>
                  <strong
                    style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-primary)',
                      display: 'block',
                      marginBottom: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {senderName}
                  </strong>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.72rem',
                      color: 'var(--text-secondary)',
                      wordBreak: 'break-all',
                      marginBottom: '8px',
                      lineHeight: '1.3',
                    }}
                  >
                    {senderWallet}
                  </div>
                  <div
                    style={{
                      background: 'var(--elevation-1)',
                      padding: '8px 10px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-default)',
                    }}
                  >
                    <span style={{ fontSize: '0.675rem', color: 'var(--text-tertiary)', display: 'block' }}>
                      Treasury Balance
                    </span>
                    <strong
                      className="tabular-nums"
                      style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700 }}
                    >
                      {formatCurrency(senderBalance, sendCurrency)}
                    </strong>
                  </div>
                </div>

                {/* Transfer Kinetic Icon */}
                <div style={{ textAlign: 'center', padding: '0 4px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
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
                    <ArrowRight size={18} strokeWidth={2} />
                  </div>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      color: 'var(--accent-teal)',
                      fontWeight: 700,
                      display: 'block',
                      marginTop: '6px',
                      letterSpacing: '0.06em',
                    }}
                  >
                    ILP STREAM
                  </span>
                </div>

                {/* Receiver Wallet Card */}
                <div
                  style={{
                    background: 'var(--elevation-2)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '16px',
                    padding: '1.15rem',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.68rem',
                      color: 'var(--text-tertiary)',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      display: 'block',
                      marginBottom: '3px',
                    }}
                  >
                    Recipient (Employee)
                  </span>
                  <strong
                    style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-primary)',
                      display: 'block',
                      marginBottom: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {receiverName}
                  </strong>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.72rem',
                      color: 'var(--accent-teal)',
                      wordBreak: 'break-all',
                      marginBottom: '8px',
                      lineHeight: '1.3',
                    }}
                  >
                    {receiverWallet}
                  </div>
                  <div
                    style={{
                      background: 'var(--elevation-1)',
                      padding: '8px 10px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-default)',
                    }}
                  >
                    <span style={{ fontSize: '0.675rem', color: 'var(--text-tertiary)', display: 'block' }}>
                      Settled In Real Time
                    </span>
                    <strong
                      className="tabular-nums"
                      style={{ fontSize: '1rem', color: 'var(--accent-teal)', fontWeight: 700 }}
                    >
                      {formatCurrency(receiverBalance, receiveCurrency)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Protocol Phase Meter */}
              <div
                style={{
                  background: 'var(--elevation-2)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '16px',
                  padding: '1.15rem 1.25rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                    fontSize: '0.825rem',
                  }}
                >
                  <span
                    style={{
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      fontWeight: 600,
                    }}
                  >
                    <Layers size={16} strokeWidth={1.75} color="var(--accent-teal)" />
                    {phase === 'initiating'
                      ? 'Checking accounts...'
                      : phase === 'grant_quoting'
                      ? 'Locking in exchange rate...'
                      : phase === 'streaming'
                      ? 'Moving money...'
                      : 'Money delivered'}
                  </span>
                  <span
                    className="tabular-nums"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--accent-teal)',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                    }}
                  >
                    {progress}%
                  </span>
                </div>

                <div
                  style={{
                    width: '100%',
                    height: '6px',
                    background: 'var(--elevation-3)',
                    borderRadius: '9999px',
                    overflow: 'hidden',
                  }}
                >
                  <motion.div
                    style={{
                      height: '100%',
                      background: 'var(--accent-teal)',
                      borderRadius: '9999px',
                    }}
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: [0.32, 0.72, 0, 1], duration: 0.2 }}
                  />
                </div>
              </div>

              {/* Cryptographic Proof Details (Revealed smoothly on settled) */}
              {phase === 'settled' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  style={{
                    background: 'var(--accent-teal-dim)',
                    border: '1px solid var(--border-accent)',
                    borderRadius: '16px',
                    padding: '1.15rem 1.25rem',
                    marginBottom: '1.5rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: 'var(--accent-teal)',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      marginBottom: '6px',
                    }}
                  >
                    <CheckCircle2 size={17} strokeWidth={2} /> Payment delivered &amp; verified
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Transfer ID:{' '}
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                      {transactionId}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.76rem',
                      color: 'var(--text-secondary)',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}
                  >
                    <span>
                      Receipt code:{' '}
                      <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-teal)' }}>
                        {displayReceipt.substring(0, 32)}...
                      </strong>
                    </span>
                    <button
                      onClick={handleCopyReceipt}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--accent-teal)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: 600,
                        fontSize: '0.76rem',
                      }}
                    >
                      <Copy size={12} /> Copy receipt
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Modal Action CTA */}
              <div>
                <button
                  onClick={onClose}
                  disabled={phase !== 'settled'}
                  className="btn btn-primary btn-block btn-lg"
                  style={{
                    justifyContent: 'center',
                    opacity: phase !== 'settled' ? 0.65 : 1,
                    cursor: phase !== 'settled' ? 'wait' : 'pointer',
                  }}
                >
                  {phase === 'settled' ? (
                    'Done'
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <Zap size={16} className="animate-spin" /> Sending payment...
                    </span>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
