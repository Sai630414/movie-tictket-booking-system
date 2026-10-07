import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Film, LoaderCircle, MailWarning } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase } from '../services/supabase.js';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Confirming your CineVerse account…');

  useEffect(() => {
    let active = true;
    const finishAuthentication = async () => {
      try {
        if (!supabase) throw new Error('Authentication is not configured. Please contact CineVerse support.');

        const url = new URL(window.location.href);
        const params = new URLSearchParams(url.hash.replace(/^#/, ''));
        const callbackError = url.searchParams.get('error_description') || params.get('error_description') || url.searchParams.get('error') || params.get('error');
        if (callbackError) {
          if (callbackError === 'access_denied' || /cancel/i.test(callbackError)) {
            throw new Error('Google sign in was cancelled or could not be completed. Try again or sign in with email.');
          }
          throw new Error('This verification link is invalid or has expired. Request a new link and try again.');
        }

        const code = url.searchParams.get('code');
        const tokenHash = url.searchParams.get('token_hash');
        const hasImplicitSession = Boolean(params.get('access_token'));
        if (!code && !tokenHash && !hasImplicitSession) {
          throw new Error('No authentication response was received. Request a fresh verification email, or sign in again.');
        }

        let { data: { session } } = await supabase.auth.getSession();
        if (!session && code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          session = data.session;
        }

        const type = url.searchParams.get('type');
        if (!session && tokenHash && ['signup', 'email', 'magiclink'].includes(type)) {
          const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
          if (error) throw error;
          session = data.session;
        }

        if (!session) throw new Error('No active session was created. The link may have expired; request a new verification email.');
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw userError || new Error('We could not verify this account. Please sign in again.');

        await refreshProfile();
        window.history.replaceState({}, document.title, '/auth/callback');
        if (!active) return;
        setStatus('success');
        setMessage('Your email is verified. Taking you to your CineVerse account…');
        window.setTimeout(() => navigate('/profile', { replace: true }), 1000);
      } catch (error) {
        window.history.replaceState({}, document.title, '/auth/callback');
        if (!active) return;
        setStatus('error');
        const knownMessage = error?.message?.includes('Authentication is not configured') || error?.message?.startsWith('Google sign in was cancelled');
        setMessage(knownMessage
          ? error.message
          : 'This sign-in or verification link could not be completed. Request a fresh verification email, or try signing in again.');
      }
    };
    finishAuthentication();
    return () => { active = false; };
  }, [navigate, refreshProfile]);

  const isSuccess = status === 'success';
  const StatusIcon = status === 'loading' ? LoaderCircle : isSuccess ? CheckCircle : MailWarning;

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', backgroundColor: 'var(--bg-primary)', backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(229,9,20,0.15) 0%, transparent 70%)', padding: '32px 20px' }}>
      <section className="glass-card" style={{ width: '100%', maxWidth: '480px', textAlign: 'center' }}>
        <Link to="/" aria-label="CineVerse home" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
          <span style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--accent-red)', display: 'grid', placeItems: 'center' }}><Film size={24} color="#fff" /></span>
          <span style={{ fontSize: '1.6rem', fontWeight: '800', color: '#fff' }}>CINE<span style={{ color: 'var(--accent-red)' }}>VERSE</span></span>
        </Link>
        <div style={{ display: 'grid', placeItems: 'center', marginBottom: '16px' }}>
          <StatusIcon size={42} color={isSuccess ? '#22c55e' : status === 'error' ? 'var(--accent-red)' : 'var(--accent-cyan)'} className={status === 'loading' ? 'animate-spin' : undefined} />
        </div>
        <h1 style={{ color: '#fff', fontSize: '1.55rem', marginBottom: '10px' }}>{status === 'loading' ? 'Verifying your email' : isSuccess ? 'Email verified' : 'We could not complete that link'}</h1>
        <p role={status === 'error' ? 'alert' : 'status'} style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{message}</p>
        {status === 'error' && <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '24px' }}><Link to="/register" className="btn-primary">Create account</Link><Link to="/login" className="btn-outline">Sign in</Link></div>}
      </section>
    </main>
  );
}
