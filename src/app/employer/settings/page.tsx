'use client';

import { useState } from 'react';
import { ShieldCheck, Award, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import KYCModal from '@/components/KYCModal';

export default function SettingsPage() {
  const [companyName, setCompanyName] = useState('Payzati Demo Corp');
  const [country, setCountry] = useState('Nigeria');
  const [isKYCOpen, setIsKYCOpen] = useState(false);
  const [kycStatus, setKycStatus] = useState<any>(null);

  const handleSave = () => {
    toast.success('Company profile updated successfully');
  };

  const handleCancelSubscription = () => {
    toast.success('Subscription status: Cancelled');
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings &amp; Identity Compliance</h1>
          <p className="page-subtitle">Configure workspace profile, zero-knowledge KYC verification, and billing.</p>
        </div>
      </div>

      <div className="grid-2">
        {/* Company Profile Card */}
        <div className="card" style={{ background: 'var(--elevation-1)' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Company Profile</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)' }}>Company Name</label>
              <input value={companyName} onChange={e => setCompanyName(e.target.value)} />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)' }}>Country</label>
              <select value={country} onChange={e => setCountry(e.target.value)}>
                <option>Nigeria</option>
                <option>Kenya</option>
                <option>Ghana</option>
                <option>South Africa</option>
                <option>Egypt</option>
              </select>
            </div>
            
            <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
          </div>
        </div>

        {/* KYC Verification Card */}
        <div className="card" style={{ background: 'var(--elevation-1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3>Payzati Identity Verification</h3>
            {kycStatus ? (
              <span className="badge badge-success">
                <CheckCircle2 size={12} style={{ marginRight: '4px' }} /> Verified
              </span>
            ) : (
              <span className="badge badge-warning">Tier 1 Basic</span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: 'var(--elevation-2)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
              {kycStatus ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-teal)', marginBottom: '0.5rem' }}>
                    <Award size={24} />
                    <strong style={{ fontSize: '1.1rem' }}>{kycStatus.tier}</strong>
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                    Verification Hash: {kycStatus.verificationHash}
                  </div>
                </div>
              ) : (
                <div>
                  <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Cryptographic Zero-Knowledge Verification</h4>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    Verify your business entity for unlimited ILP payment volumes and compliant international cross-border payroll runs.
                  </p>
                </div>
              )}
            </div>

            <button className="btn btn-primary" onClick={() => setIsKYCOpen(true)}>
              <ShieldCheck size={16} /> {kycStatus ? 'View Verification Badge' : 'Complete Verification'}
            </button>
          </div>
        </div>

        {/* Subscription billing details following Transparency Bias */}
        <div className="card" style={{ background: 'var(--elevation-1)', gridColumn: 'span 2' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Billing &amp; License</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: 'var(--elevation-2)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Active Plan</span>
                <span className="badge badge-success">Active</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>$49</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', marginLeft: '2px' }}>/month flat</span>
              </div>
              
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                Unlimited roster. Direct Interledger rails.
              </span>
            </div>

            <div style={{ background: 'rgba(0, 212, 170, 0.05)', border: '1px solid rgba(0, 212, 170, 0.2)', borderRadius: 'var(--radius-md)', padding: '1rem', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <ShieldCheck size={16} color="var(--accent-teal)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Transparency Bias Guarantee:</strong> You only pay for months in which you execute a payroll run. If you don&apos;t run payroll, billing is paused automatically. No setup fees, cancel in 1-click.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button className="btn btn-secondary btn-block" onClick={handleCancelSubscription} style={{ flex: 1 }}>
                Pause Billing
              </button>
            </div>
          </div>
        </div>
      </div>

      <KYCModal
        isOpen={isKYCOpen}
        onClose={() => setIsKYCOpen(false)}
        onVerified={(res) => setKycStatus(res)}
      />
    </div>
  );
}
