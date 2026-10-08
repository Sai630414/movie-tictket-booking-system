import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import { CITIES } from '../context/CityContext.jsx';
import { User, Camera, Check, AlertCircle } from 'lucide-react';

const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Marathi'];

export default function ProfilePage() {
  const { user, updateProfileState } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
    city: user?.city || 'Vijayawada',
    preferredLanguage: user?.preferredLanguage || 'English',
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError('');
    try {
      const res = await api.patch('/users/me', formData);
      if (res.data?.success) {
        updateProfileState(res.data.data);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return (
    <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-secondary)' }}>
      <p>Please sign in to view your profile.</p>
    </div>
  );

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh', padding: '60px 0' }}>
      <div className="container" style={{ maxWidth: '680px' }}>
        <h1 style={{ fontSize: '2rem', color: '#fff', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <User size={28} color="var(--accent-red)" /> My Profile
        </h1>

        <div className="glass-card">
          {/* Avatar Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ position: 'relative' }}>
              <img
                src={user.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop'}
                alt="Profile"
                style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-red)' }}
              />
              <button style={{
                position: 'absolute', bottom: 0, right: 0,
                width: '28px', height: '28px', borderRadius: '50%',
                backgroundColor: 'var(--accent-red)', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Camera size={14} color="#fff" />
              </button>
            </div>
            <div>
              <h3 style={{ color: '#fff', fontSize: '1.2rem' }}>{user.name || 'Your Name'}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{user.email}</p>
              <span style={{
                display: 'inline-block', padding: '3px 10px', marginTop: '6px',
                backgroundColor: user.role === 'admin' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(229,9,20,0.1)',
                border: `1px solid ${user.role === 'admin' ? 'rgba(251,191,36,0.3)' : 'rgba(229,9,20,0.3)'}`,
                borderRadius: '20px', color: user.role === 'admin' ? '#fbbf24' : 'var(--accent-red)',
                fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase'
              }}>
                {user.role}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '7px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>Full Name</label>
                <input type="text" value={formData.name}
                  onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                  style={{ width: '100%', padding: '12px 14px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '7px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>Phone Number</label>
                <input type="tel" value={formData.phone}
                  onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))}
                  style={{ width: '100%', padding: '12px 14px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '7px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>Date of Birth</label>
                <input type="date" value={formData.dateOfBirth}
                  onChange={e => setFormData(f => ({ ...f, dateOfBirth: e.target.value }))}
                  style={{ width: '100%', padding: '12px 14px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', outline: 'none', colorScheme: 'dark' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '7px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>City</label>
                <select value={formData.city}
                  onChange={e => setFormData(f => ({ ...f, city: e.target.value }))}
                  style={{ width: '100%', padding: '12px 14px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', outline: 'none' }}>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '7px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>Preferred Language</label>
                <select value={formData.preferredLanguage}
                  onChange={e => setFormData(f => ({ ...f, preferredLanguage: e.target.value }))}
                  style={{ width: '100%', padding: '12px 14px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', outline: 'none' }}>
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            {success && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '12px 16px', backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', marginBottom: '16px' }}>
                <Check size={16} color="#22c55e" />
                <span style={{ color: '#22c55e', fontSize: '0.88rem' }}>Profile updated successfully!</span>
              </div>
            )}

            {error && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '12px 16px', backgroundColor: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.3)', borderRadius: '8px', marginBottom: '16px' }}>
                <AlertCircle size={16} color="var(--accent-red)" />
                <span style={{ color: '#fff', fontSize: '0.88rem' }}>{error}</span>
              </div>
            )}

            <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '13px 32px', fontSize: '0.95rem' }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
