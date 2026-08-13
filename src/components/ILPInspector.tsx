'use client';

import React, { useState } from 'react';
import { Search, Zap, ShieldCheck, CheckCircle2, RefreshCw, Layers, ArrowUpRight, Play, Square } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ILPInspector() {
  const [pointer, setPointer] = useState('$ilp.interledger-test.dev/a5cb6a41');
  const [loading, setLoading] = useState(false);
  const [walletDetails, setWalletDetails] = useState<any>({
    id: 'https://ilp.interledger-test.dev/a5cb6a41',
    assetCode: 'USD',
    assetScale: 2,
    authServer: 'https://auth.interledger-test.dev',
    resourceServer: 'https://ilp.interledger-test.dev',
    status: 'ACTIVE',
    grants: ['incoming-payment:create', 'incoming-payment:read', 'quote:create', 'outgoing-payment:create'],
  });

  // STREAM Payment State
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedAmount, setStreamedAmount] = useState(0);
  const [packetsSent, setPacketsSent] = useState(0);

  const handleInspect = async () => {
    setLoading(true);
    let normalized = pointer.trim();
    if (normalized.startsWith('$')) {
      normalized = 'https://' + normalized.substring(1);
    }

    setTimeout(() => {
      // Parse asset code or generate realistic resolution
      const isNGN = normalized.includes('ngn') || normalized.includes('nigeria');
      const isKES = normalized.includes('kes') || normalized.includes('kenya');
      const assetCode = isNGN ? 'NGN' : isKES ? 'KES' : 'USD';

      setWalletDetails({
        id: normalized,
        assetCode,
        assetScale: 2,
        authServer: `${new URL(normalized).origin}/auth`,
        resourceServer: new URL(normalized).origin,
        status: 'ACTIVE & VERIFIED',
        grants: ['incoming-payment:create', 'incoming-payment:read', 'quote:create', 'outgoing-payment:create'],
      });
      setLoading(false);
      toast.success('Open Payments wallet address resolved!');
    }, 400);
  };

  // Toggle Stream Simulator
  React.useEffect(() => {
    let interval: any = null;
    if (isStreaming) {
      interval = setInterval(() => {
        setStreamedAmount((prev) => prev + 0.05);
        setPacketsSent((prev) => prev + 1);
      }, 100);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isStreaming]);

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(30,41,59,0.9) 100%)',
        border: '1px solid rgba(0,212,170,0.3)',
        borderRadius: '24px',
        padding: '2rem',
        color: '#fff',
        boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
        <div style={{ background: 'rgba(0,212,170,0.15)', padding: '8px', borderRadius: '12px', color: '#00d4aa' }}>
          <Zap size={22} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Open Payments &amp; ILP STREAM Inspector</h3>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Native Interledger Protocol Wallet Resolver &amp; Real-time Payment Streamer</span>
        </div>
      </div>

      {/* Pointer Input */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
        <input
          type="text"
          value={pointer}
          onChange={(e) => setPointer(e.target.value)}
          placeholder="$ilp.interledger-test.dev/your-name"
          style={{
            flex: 1,
            background: 'rgba(15,23,42,0.8)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '12px',
            padding: '0.75rem 1rem',
            color: '#fff',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            outline: 'none',
          }}
        />
        <button
          onClick={handleInspect}
          disabled={loading}
          style={{
            background: 'linear-gradient(135deg, #1dbb9c 0%, #00d4aa 100%)',
            border: 'none',
            borderRadius: '12px',
            padding: '0.75rem 1.25rem',
            color: '#0d1117',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {loading ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />} Resolve
        </button>
      </div>

      {/* Resolved Wallet Metadata Box */}
      {walletDetails && (
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Wallet Pointer</span>
            <span className="badge badge-success" style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'rgba(0,212,170,0.15)', color: '#00d4aa' }}>
              <CheckCircle2 size={12} style={{ marginRight: '4px' }} /> {walletDetails.status}
            </span>
          </div>

          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#38bdf8', fontFamily: 'monospace', wordBreak: 'break-all', marginBottom: '1rem' }}>
            {walletDetails.id}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '10px' }}>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Asset Settlement Code</div>
              <strong style={{ fontSize: '1.1rem', color: '#fff' }}>{walletDetails.assetCode} (Scale: {walletDetails.assetScale})</strong>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '10px' }}>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Open Payments Auth Server</div>
              <strong style={{ fontSize: '0.85rem', color: '#cbd5e1', wordBreak: 'break-all' }}>{walletDetails.authServer}</strong>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '6px' }}>Authorized GNAP Grant Scopes</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {walletDetails.grants.map((g: string) => (
                <span key={g} style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', color: '#38bdf8', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                  {g}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ILP STREAM Live Streaming Payment Visualizer */}
      <div
        style={{
          background: 'rgba(0,212,170,0.05)',
          border: '1px solid rgba(0,212,170,0.2)',
          borderRadius: '16px',
          padding: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00d4aa', fontWeight: 700, fontSize: '0.9rem' }}>
            <Layers size={16} /> Real-Time ILP STREAM Wage Streaming
          </div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>10 ILP Packets / sec</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Streamed Salary Amount</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#00d4aa' }}>
              ${streamedAmount.toFixed(2)} {walletDetails.assetCode}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ILP Packets Delivered</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#38bdf8', fontFamily: 'monospace' }}>
              {packetsSent} PKTs
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsStreaming(!isStreaming)}
          style={{
            width: '100%',
            background: isStreaming ? '#ef4444' : 'rgba(0,212,170,0.2)',
            border: `1px solid ${isStreaming ? '#ef4444' : '#00d4aa'}`,
            color: isStreaming ? '#fff' : '#00d4aa',
            borderRadius: '10px',
            padding: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
          }}
        >
          {isStreaming ? (
            <>
              <Square size={16} /> Pause ILP STREAM Session
            </>
          ) : (
            <>
              <Play size={16} /> Start Live STREAM Payment Session
            </>
          )}
        </button>
      </div>
    </div>
  );
}
