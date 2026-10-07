import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Film, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../services/supabase.js';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    if (!supabase) return setError('Authentication is not configured.');
    setSubmitting(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setMessage('If an account exists for that email, a password reset link is on its way.');
    } catch (err) {
      setError(err.message || 'Could not send a reset link. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', backgroundColor: 'var(--bg-primary)', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
            <Film size={28} color="var(--accent-red)" />
            <span style={{ fontSize: '1.6rem', fontWeight: '800' }}>CINE<span style={{ color: 'var(--accent-red)' }}>VERSE</span></span>
          </Link>
        </div>
        <div className="glass-card">
          <h1 style={{ color: '#fff', fontSize: '1.6rem', marginBottom: '8px' }}>Reset your password</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Enter your account email and we’ll send you a secure reset link.</p>
          <form onSubmit={submit}>
            <label htmlFor="reset-email" style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.88rem' }}>Email address</label>
            <input id="reset-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', marginBottom: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff' }} />
            {message && <div role="status" style={{ display: 'flex', gap: '8px', color: '#22c55e', fontSize: '0.88rem', marginBottom: '16px' }}><CheckCircle size={17} />{message}</div>}
            {error && <div role="alert" style={{ display: 'flex', gap: '8px', color: 'var(--accent-red)', fontSize: '0.88rem', marginBottom: '16px' }}><AlertCircle size={17} />{error}</div>}
            <button className="btn-primary" disabled={submitting} style={{ width: '100%', padding: '13px' }}>{submitting ? 'Sending…' : 'Send reset link'}</button>
          </form>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '20px', fontSize: '0.88rem' }}><Link to="/login" style={{ color: 'var(--accent-red)', fontWeight: '600' }}>Back to sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
