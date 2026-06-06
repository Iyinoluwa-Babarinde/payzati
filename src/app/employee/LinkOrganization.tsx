'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Link2 } from 'lucide-react';

export default function LinkOrganization({ onLinked }: { onLinked: () => void }) {
  const [inviteCode, setInviteCode] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode || !walletAddress) return;
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      
      const { data: companies, error: fetchError } = await supabase.from('companies').select('id, name');
      if (fetchError || !companies) {
        setError("Failed to verify invite code.");
        setLoading(false);
        return;
      }

      const company = companies.find(c => {
        const cSlug = c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const cShortId = c.id.substring(0, 6);
        return inviteCode.toLowerCase().trim() === `${cSlug}-${cShortId}`;
      });

      if (!company) {
        setError('Invalid invite code. Please check with your employer.');
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('You must be logged in.');
        setLoading(false);
        return;
      }

      const { data: existing } = await supabase
        .from('employees')
        .select('*')
        .eq('email', user.email)
        .single();
        
      if (existing) {
        setError('You are already linked to an organization.');
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase.from('employees').insert({
        company_id: company.id,
        name: user.user_metadata?.full_name || 'Employee',
        email: user.email,
        country: 'Nigeria', // default, employer will update
        currency: 'NGN',    // default, employer will update
        salary: 0,          // 0 indicates pending
        status: 'on_leave', // Hack for MVP: "on_leave" means pending setup
        wallet_address: walletAddress,
        bank_name: null,
        bank_account_number: null,
        onboarding_step: 'requested'
      });

      if (insertError) {
        console.error('Insert error:', insertError);
        setError('Failed to link account. Please try again.');
        setLoading(false);
        return;
      }

      onLinked();
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto', textAlign: 'center' }} className="animate-fade-in">
      <div style={{ width: '64px', height: '64px', background: 'var(--elevation-1)', border: '1px solid var(--border-subtle)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 1.5rem auto' }}>
        <Link2 size={32} color="var(--accent-teal)" />
      </div>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Link Organization</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Just enter the invite code your employer gave you, plus your Interledger wallet address, and we&apos;ll link you up!</p>

      <form onSubmit={handleLink} className="card">
        {error && <div style={{ color: 'var(--status-error)', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}
        
        <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Organization Invite Code</label>
          <input 
            type="text" 
            placeholder="e.g. your-company-1a2b3c" 
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            required
            style={{ fontFamily: 'var(--font-mono)', width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-subtle)', background: 'var(--elevation-1)' }}
          />
        </div>

        <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Interledger Wallet Address</label>
          <input 
            type="text" 
            placeholder="https://ilp.interledger-test.dev/your-wallet" 
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            required
            style={{ fontFamily: 'var(--font-mono)', width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-subtle)', background: 'var(--elevation-1)' }}
          />
          <small style={{ color: 'var(--text-tertiary)', display: 'block', marginTop: '0.5rem' }}>Make sure to use a valid testnet wallet address so you can receive payments!</small>
        </div>

        <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Linking...' : 'Connect Account'}
        </button>
      </form>

      <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
        Once you link up, your employer will review your profile and set up your salary details. Then you&apos;ll be good to go!
      </p>
    </div>
  );
}
