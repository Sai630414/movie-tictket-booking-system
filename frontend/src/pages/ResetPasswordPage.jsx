import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, LockKeyhole } from 'lucide-react';
import { supabase } from '../services/supabase.js';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!supabase) return undefined;
    let recoverySession = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) recoverySession = true;
      if (recoverySession && session) setReady(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && window.location.hash.includes('access_token')) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!supabase) return setError('Authentication is not configured.');
    if (password.length < 8) return setError('Use a password with at least 8 characters.');
    if (password !== confirmPassword) return setError('The passwords do not match.');
    setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      navigate('/login', { replace: true, state: { message: 'Your password has been updated. Please sign in.' } });
    } catch (err) {
      setError(err.message || 'Could not update your password. Request a new reset link and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', backgroundColor: 'var(--bg-primary)', padding: '40px 20px' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}><LockKeyhole color="var(--accent-red)" /><h1 style={{ color: '#fff', fontSize: '1.5rem' }}>Choose a new password</h1></div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Use at least 8 characters for your new password.</p>
        {!ready ? (
          <div role="status" style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}><AlertCircle size={17} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Open this page from the password reset link in your email.</div>
        ) : (
          <form onSubmit={submit}>
            <label htmlFor="new-password" style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '7px' }}>New password</label>
            <input id="new-password" type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '12px 14px', marginBottom: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff' }} />
            <label htmlFor="confirm-password" style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '7px' }}>Confirm password</label>
            <input id="confirm-password" type="password" required autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{ width: '100%', padding: '12px 14px', marginBottom: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff' }} />
            {error && <div role="alert" style={{ display: 'flex', gap: '8px', color: 'var(--accent-red)', fontSize: '0.88rem', marginBottom: '16px' }}><AlertCircle size={17} />{error}</div>}
            <button className="btn-primary" disabled={saving} style={{ width: '100%', padding: '13px' }}>{saving ? 'Updating…' : 'Update password'}</button>
          </form>
        )}
        <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}><Link to="/login" style={{ color: 'var(--accent-red)' }}>Back to sign in</Link></p>
      </div>
    </div>
  );
}
