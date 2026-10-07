import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Film, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', city: 'Mumbai' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const { name, email, password, phone, city } = formData;
    if (!name || !email || !password) { setError('Name, email, and password are required.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setIsSubmitting(true);
    try {
      const result = await register(email, password, name, phone, city);
      if (result?.success) {
        navigate('/');
      } else {
        setError(result?.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const CITIES = ['Mumbai', 'Delhi-NCR', 'Bengaluru', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad'];

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'var(--bg-primary)',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(229,9,20,0.15) 0%, transparent 70%)',
      padding: '40px 20px'
    }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--accent-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Film size={24} color="#fff" />
            </div>
            <span style={{ fontSize: '1.6rem', fontWeight: '800', color: '#fff' }}>CINE<span style={{ color: 'var(--accent-red)' }}>VERSE</span></span>
          </Link>
        </div>

        <div className="glass-card">
          <h2 style={{ fontSize: '1.8rem', color: '#fff', textAlign: 'center', marginBottom: '8px' }}>Create Account</h2>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '28px', fontSize: '0.9rem' }}>
            Join CineVerse to start booking tickets
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Full Name *</label>
                <input type="text" placeholder="John Doe" value={formData.name}
                  onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                  style={{ width: '100%', padding: '12px 14px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Phone Number</label>
                <input type="tel" placeholder="+91 9876543210" value={formData.phone}
                  onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))}
                  style={{ width: '100%', padding: '12px 14px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Email Address *</label>
              <input type="email" placeholder="you@example.com" value={formData.email}
                onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                style={{ width: '100%', padding: '12px 14px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Password *</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} placeholder="Min 6 characters" value={formData.password}
                  onChange={e => setFormData(f => ({ ...f, password: e.target.value }))}
                  style={{ width: '100%', padding: '12px 46px 12px 14px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', color: 'var(--text-muted)' }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Your City</label>
              <select value={formData.city} onChange={e => setFormData(f => ({ ...f, city: e.target.value }))}
                style={{ width: '100%', padding: '12px 14px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', outline: 'none' }}>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {error && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '12px 16px', backgroundColor: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.3)', borderRadius: '8px', marginBottom: '20px' }}>
                <AlertCircle size={16} color="var(--accent-red)" />
                <span style={{ color: '#fff', fontSize: '0.88rem' }}>{error}</span>
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1rem', marginBottom: '16px' }}>
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>

            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--accent-red)', fontWeight: '600' }}>Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
