import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const extractYouTubeId = (value = '') => {
  try {
    const url = new URL(value);
    if (url.hostname.endsWith('youtu.be')) return url.pathname.slice(1).split('/')[0];
    if (url.hostname.includes('youtube.com')) return url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).at(-1);
  } catch { return ''; }
  return '';
};

export default function TrailerModal({ movie, onClose }) {
  const videoId = movie?.trailer?.videoId || extractYouTubeId(movie?.trailer?.url || movie?.trailerUrl);
  useEffect(() => {
    const handleKey = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);
  if (!videoId) return null;
  return (
    <div role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }} style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'grid', placeItems: 'center', padding: 18, background: 'rgba(0,0,0,.86)', backdropFilter: 'blur(8px)' }}>
      <section role="dialog" aria-modal="true" aria-label={`${movie.title} trailer`} style={{ width: 'min(100%, 900px)', border: '1px solid var(--border-color)', borderRadius: 14, overflow: 'hidden', background: 'var(--bg-card)', boxShadow: '0 25px 80px rgba(0,0,0,.6)' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '13px 18px' }}>
          <h2 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>{movie.title} · Official Trailer</h2>
          <button type="button" onClick={onClose} aria-label="Close trailer" style={{ display: 'grid', placeItems: 'center', width: 38, height: 38, borderRadius: '50%', color: '#fff', background: 'rgba(255,255,255,.1)' }}><X size={18} /></button>
        </header>
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000' }}>
          <iframe title={`${movie.title} trailer`} src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
        </div>
      </section>
    </div>
  );
}
