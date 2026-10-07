import React from 'react';

export default function LoadingSpinner({ size = 40, message = '' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      padding: '60px 20px',
      minHeight: '200px'
    }}>
      <div style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: '3px solid rgba(255,255,255,0.1)',
        borderTop: '3px solid var(--accent-red)',
        animation: 'spin 0.8s linear infinite'
      }} />
      {message && (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{message}</p>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
