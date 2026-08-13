'use client';

import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, User, Building, FileCheck, X, Sparkles, RefreshCw, Award, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export interface KYCModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified?: (details: any) => void;
}

export default function KYCModal({ isOpen, onClose, onVerified }: KYCModalProps) {
  const [step, setStep] = useState(1);
  const [entityType, setEntityType] = useState<'individual' | 'business'>('individual');
  const [idType, setIdType] = useState('national_id');
  const [idNumber, setIdNumber] = useState('');
  const [country, setCountry] = useState('Nigeria');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleStartScan = () => {
    setVerifying(true);
    setStep(3);

    setTimeout(() => {
      const hash = `PZT-KYC-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${Date.now()}`;
      const result = {
        tier: 'Tier 2 — Verified Identity',
        status: 'VERIFIED',
        verificationHash: hash,
        verifiedAt: new Date().toLocaleDateString(),
        entityType,
        idType,
        country,
      };
      setVerificationResult(result);
      setVerifying(false);
      setStep(4);
      if (onVerified) onVerified(result);
      toast.success('Payzati Identity Verification Complete!');
    }, 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(10,15,26,0.85)',
        backdropFilter: 'blur(16px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          border: '1px solid rgba(0,212,170,0.4)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '540px',
          padding: '2rem',
          color: '#fff',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(0,212,170,0.15)', padding: '8px', borderRadius: '12px', color: '#00d4aa' }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Payzati Platform Identity &amp; Compliance</h3>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Cryptographic Zero-Knowledge KYC Verification</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Step Progress Dots */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '2px',
                background: step >= s ? '#00d4aa' : 'rgba(255,255,255,0.1)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>

        {/* Step 1: Entity Type */}
        {step === 1 && (
          <div>
            <h4 style={{ marginBottom: '1rem', color: '#cbd5e1' }}>Select Account Entity Type</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div
                onClick={() => setEntityType('individual')}
                style={{
                  background: entityType === 'individual' ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `2px solid ${entityType === 'individual' ? '#00d4aa' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '16px',
                  padding: '1.25rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <User size={32} color={entityType === 'individual' ? '#00d4aa' : '#94a3b8'} style={{ margin: '0 auto 8px' }} />
                <strong style={{ display: 'block', fontSize: '0.95rem' }}>Individual Worker</strong>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Personal Salary Wallet</span>
              </div>

              <div
                onClick={() => setEntityType('business')}
                style={{
                  background: entityType === 'business' ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `2px solid ${entityType === 'business' ? '#00d4aa' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '16px',
                  padding: '1.25rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <Building size={32} color={entityType === 'business' ? '#00d4aa' : '#94a3b8'} style={{ margin: '0 auto 8px' }} />
                <strong style={{ display: 'block', fontSize: '0.95rem' }}>Employer Business</strong>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Corporate Payroll Account</span>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #1dbb9c 0%, #00d4aa 100%)',
                color: '#0d1117',
                border: 'none',
                borderRadius: '12px',
                padding: '0.9rem',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
              }}
            >
              Continue to Document Setup
            </button>
          </div>
        )}

        {/* Step 2: Document Input */}
        {step === 2 && (
          <div>
            <h4 style={{ marginBottom: '1rem', color: '#cbd5e1' }}>Select Identification Document</h4>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>Country of Residence / Incorporation</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(15,23,42,0.8)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '10px',
                  padding: '0.75rem',
                  color: '#fff',
                  outline: 'none',
                }}
              >
                <option value="Nigeria" style={{ background: '#0f172a' }}>🇳🇬 Nigeria</option>
                <option value="Kenya" style={{ background: '#0f172a' }}>🇰🇪 Kenya</option>
                <option value="Ghana" style={{ background: '#0f172a' }}>🇬🇭 Ghana</option>
                <option value="South Africa" style={{ background: '#0f172a' }}>🇿🇦 South Africa</option>
                <option value="Egypt" style={{ background: '#0f172a' }}>🇪🇬 Egypt</option>
                <option value="United States" style={{ background: '#0f172a' }}>🇺🇸 United States</option>
                <option value="United Kingdom" style={{ background: '#0f172a' }}>🇬🇧 United Kingdom</option>
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>ID Document Type</label>
              <select
                value={idType}
                onChange={(e) => setIdType(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(15,23,42,0.8)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '10px',
                  padding: '0.75rem',
                  color: '#fff',
                  outline: 'none',
                }}
              >
                <option value="national_id" style={{ background: '#0f172a' }}>National Identity Number / Card</option>
                <option value="passport" style={{ background: '#0f172a' }}>International Passport</option>
                <option value="drivers_license" style={{ background: '#0f172a' }}>Driver&apos;s License</option>
                <option value="tax_id" style={{ background: '#0f172a' }}>Tax Identification Number (TIN / SSN / EIN)</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>Document / Identification Number</label>
              <input
                type="text"
                placeholder="e.g. 10928374928"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(15,23,42,0.8)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '10px',
                  padding: '0.75rem',
                  color: '#fff',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Back
              </button>
              <button
                onClick={handleStartScan}
                style={{
                  flex: 2,
                  background: 'linear-gradient(135deg, #1dbb9c 0%, #00d4aa 100%)',
                  color: '#0d1117',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0.9rem',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                }}
              >
                Verify Identity Now
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Verification Scanning Animation */}
        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 1.5rem' }}>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  border: '3px solid rgba(0,212,170,0.2)',
                  borderTopColor: '#00d4aa',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <ShieldCheck size={32} color="#00d4aa" style={{ position: 'absolute', top: '24px', left: '24px' }} />
            </div>
            <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Verifying Zero-Knowledge Proofs...</h4>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Checking validity against Payzati Interledger compliance protocol.</p>
          </div>
        )}

        {/* Step 4: Verification Result Badge */}
        {step === 4 && verificationResult && (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'rgba(0,212,170,0.15)',
                color: '#00d4aa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                border: '2px solid #00d4aa',
              }}
            >
              <Award size={36} />
            </div>

            <h3 style={{ color: '#00d4aa', marginBottom: '0.25rem', fontSize: '1.4rem' }}>{verificationResult.tier}</h3>
            <p style={{ color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Account successfully verified for compliant ILP cross-border transfers!
            </p>

            <div
              style={{
                background: 'rgba(15,23,42,0.8)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '14px',
                padding: '1rem',
                marginBottom: '1.5rem',
                textAlign: 'left',
                fontSize: '0.8rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#94a3b8' }}>Verification Hash</span>
                <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{verificationResult.verificationHash}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#94a3b8' }}>Issued Date</span>
                <span style={{ color: '#fff' }}>{verificationResult.verifiedAt}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Compliance Status</span>
                <span style={{ color: '#00d4aa', fontWeight: 700 }}>100% COMPLIANT</span>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #1dbb9c 0%, #00d4aa 100%)',
                color: '#0d1117',
                border: 'none',
                borderRadius: '12px',
                padding: '0.9rem',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
              }}
            >
              Done &amp; Return to Workspace
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
