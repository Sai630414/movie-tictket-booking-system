import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Film, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import PhoneAuthPanel from '../components/PhoneAuthPanel.jsx';

export default function LoginPage() {
  const { login, loginWithGoogle, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Make the OTP sign-in flow immediately visible; email/password remains available.
  const [loginMode, setLoginMode] = useState('phone');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.email || !formData.password) { setError('Please fill in all fields.'); return; }
    setIsSubmitting(true);
    try {
      const result = await login(formData.email, formData.password);
      if (result?.success) {
        navigate(location.state?.from || '/profile', { replace: true });
      } else {
        setError(result?.error || 'Login failed. Check your credentials.');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    const result = await loginWithGoogle();
    if (!result?.success) setError(result?.error || 'Google sign in failed. Please try again.');
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'var(--bg-primary)',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(229,9,20,0.15) 0%, transparent 70%)',
      padding: '40px 20px'
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--accent-red), #b20710)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(229,9,20,0.4)' }}>
              <Film size={26} color="#fff" />
            </div>
            <span style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fff' }}>
              CINE<span style={{ color: 'var(--accent-red)' }}>VERSE</span>
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="glass-card">
          <h2 style={{ fontSize: '1.8rem', color: '#fff', textAlign: 'center', marginBottom: '8px' }}>Welcome back</h2>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '32px', fontSize: '0.92rem' }}>
            Sign in to access your tickets and bookings
          </p>

          <div role="tablist" aria-label="Sign in method" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', padding: '5px', borderRadius: '10px', background: 'var(--bg-secondary)', marginBottom: '22px' }}>
            {[['email', 'Email'], ['phone', 'Phone OTP']].map(([mode, label]) => (
              <button key={mode} type="button" role="tab" aria-selected={loginMode === mode} onClick={() => { setLoginMode(mode); setError(''); }} style={{ padding: '9px', borderRadius: '7px', color: '#fff', background: loginMode === mode ? 'var(--accent-red)' : 'transparent', fontWeight: 600 }}>{label}</button>
            ))}
          </div>

          {loginMode === 'phone' ? (
            <PhoneAuthPanel onAuthenticated={() => navigate(location.state?.from || '/profile', { replace: true })} />
          ) : <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.88rem', fontWeight: '500' }}>Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                style={{
                  width: '100%', padding: '13px 16px', backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)', borderRadius: '8px',
                  color: '#fff', fontSize: '0.95rem', outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', fontWeight: '500' }}>Password</label>
                <Link to="/forgot-password" style={{ color: 'var(--accent-red)', fontSize: '0.82rem' }}>Forgot password?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData(f => ({ ...f, password: e.target.value }))}
                  placeholder="Enter your password"
                  style={{
                    width: '100%', padding: '13px 48px 13px 16px', backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)', borderRadius: '8px',
                    color: '#fff', fontSize: '0.95rem', outline: 'none'
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', color: 'var(--text-muted)' }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                display: 'flex', gap: '10px', alignItems: 'center',
                padding: '12px 16px', backgroundColor: 'rgba(229,9,20,0.1)',
                border: '1px solid rgba(229,9,20,0.3)', borderRadius: '8px', marginBottom: '20px'
              }}>
                <AlertCircle size={16} color="var(--accent-red)" />
                <span style={{ color: '#fff', fontSize: '0.88rem' }}>{error}</span>
              </div>
            )}
            {location.state?.message && (
              <div role="status" style={{ padding: '12px 16px', color: '#22c55e', backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '8px', marginBottom: '20px', fontSize: '0.88rem' }}>
                {location.state.message}
              </div>
            )}

            <div style={{ textAlign: 'right', marginTop: '-8px', marginBottom: '18px' }}>
              <Link to="/forgot-password" style={{ color: 'var(--accent-cyan)', fontSize: '0.82rem' }}>Forgot password?</Link>
            </div>
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '1rem', marginBottom: '20px' }}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>

            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: 'var(--accent-red)', fontWeight: '600' }}>Create one</Link>
            </p>
          </form>}

          <button type="button" onClick={handleGoogleSignIn} className="btn-outline" style={{ width: '100%', padding: '12px', marginTop: loginMode === 'email' ? '18px' : '22px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <span aria-hidden="true" style={{ fontWeight: '800', color: '#4285F4' }}>G</span> Continue with Google
          </button>
          {loginMode === 'phone' && <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>New to CineVerse? <Link to="/register" style={{ color: 'var(--accent-red)', fontWeight: 600 }}>Create an account</Link></p>}
        </div>
      </div>
    </div>
  );
}
