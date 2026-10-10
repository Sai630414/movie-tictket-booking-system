import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Play, Ticket, Clock, ShieldAlert } from 'lucide-react';
import TrailerModal from './TrailerModal.jsx';

export default function HeroBanner({ movies = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTrailer, setShowTrailer] = useState(false);

  useEffect(() => {
    if (movies.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [movies.length]);

  if (!movies || movies.length === 0) return null;
  const current = movies[currentIndex];

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '75vh',
      minHeight: '520px',
      maxHeight: '700px',
      overflow: 'hidden',
      backgroundColor: '#000000'
    }}>
      {/* Backdrop Background with Vignette Gradient Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${current.backdrop || current.poster})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          transition: 'background-image 0.8s ease-in-out',
          filter: 'brightness(0.7)'
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(20,20,20,0.3) 0%, rgba(20,20,20,0.85) 75%, #141414 100%), linear-gradient(90deg, rgba(20,20,20,0.95) 0%, rgba(20,20,20,0.5) 50%, transparent 100%)'
        }}
      />

      {/* Hero Content */}
      <div className="container" style={{
        position: 'relative',
        zIndex: 10,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        paddingBottom: '60px'
      }}>
        <div style={{ maxWidth: '640px' }} className="animate-fade-in">
          
          {/* Metadata Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <span className="badge badge-gold" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Star size={13} fill="var(--accent-gold)" /> {current.rating ? current.rating.toFixed(1) : '8.9'} / 10
            </span>

            <span className="badge badge-red">{current.certification || 'UA'}</span>

            {current.language && (
              <span className="badge badge-dark">{current.language}</span>
            )}

            {current.duration && (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={14} /> {current.duration} mins
              </span>
            )}
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: 'clamp(1.8rem, 6vw, 3.2rem)',
            lineHeight: '1.15',
            marginBottom: '14px',
            color: '#ffffff',
            textShadow: '0 4px 20px rgba(0,0,0,0.8)'
          }}>
            {current.title}
          </h1>

          {/* Genres */}
          {current.genre && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {current.genre.map((g) => (
                <span key={g} style={{
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  color: 'rgba(255,255,255,0.7)',
                  background: 'rgba(255,255,255,0.1)',
                  padding: '2px 10px',
                  borderRadius: '12px'
                }}>
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: 'clamp(0.88rem, 2.5vw, 1rem)',
            lineHeight: '1.5',
            marginBottom: '24px',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {current.description}
          </p>

          {/* Action CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Link to={`/movies/${current.slug}`} className="btn-primary" style={{ padding: '12px 24px', fontSize: '0.95rem', flex: '1 1 auto', minWidth: '140px', justifyContent: 'center' }}>
              <Ticket size={18} /> Book Tickets
            </Link>

            {(current.trailerUrl || current.trailer?.url || current.trailer?.videoId) && (
              <button
                type="button"
                onClick={() => setShowTrailer(true)}
                className="btn-secondary"
                style={{ padding: '12px 20px', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flex: '1 1 auto', minWidth: '140px' }}
              >
                <Play size={16} fill="#ffffff" /> Watch Trailer
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Slide Indicators */}
      {movies.length > 1 && (
        <div style={{
          position: 'absolute',
          bottom: '30px',
          right: '40px',
          zIndex: 20,
          display: 'flex',
          gap: '8px'
        }}>
          {movies.map((m, idx) => (
            <div
              key={`${m._id || 'movie'}-${idx}`}
              onClick={() => setCurrentIndex(idx)}
              style={{
                width: idx === currentIndex ? '30px' : '10px',
                height: '6px',
                borderRadius: '3px',
                backgroundColor: idx === currentIndex ? 'var(--accent-red)' : 'rgba(255,255,255,0.3)',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>
      )}
      {showTrailer && <TrailerModal movie={current} onClose={() => setShowTrailer(false)} />}
    </div>
  );
}
