import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Ticket, Film } from 'lucide-react';

export default function MovieCard({ movie }) {
  if (!movie) return null;

  return (
    <Link
      to={`/movies/${movie.slug}`}
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        width: '100%',
        minWidth: '200px',
      }}
    >
      <div
        style={{
          position: 'relative',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          aspectRatio: '2/3',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.04)';
          e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.8), 0 0 15px rgba(229,9,20,0.3)';
          e.currentTarget.style.borderColor = 'var(--accent-red)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = 'var(--border-color)';
        }}
      >
        {/* Poster Image */}
        {movie.poster ? <img
          src={movie.poster}
          alt={movie.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
          loading="lazy"
        /> : <div aria-label={`${movie.title} poster`} style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', padding: 18, textAlign: 'center', color: '#fff', background: 'radial-gradient(ellipse at 70% 20%,rgba(229,9,20,.35),transparent 52%),linear-gradient(145deg,#30232b,#101014)' }}><div><Film size={28} color="var(--accent-red)" style={{ margin: '0 auto 12px' }} /><strong style={{ fontSize: '1.08rem', lineHeight: 1.25 }}>{movie.title}</strong><div style={{ marginTop: 9, color: 'var(--text-secondary)', fontSize: '.72rem', letterSpacing: '.06em' }}>{movie.language} · {movie.genre?.[0] || 'CINEMA'}</div></div></div>}

        {/* Rating Badge */}
        {movie.rating > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(6px)',
              padding: '4px 8px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.8rem',
              fontWeight: '700',
              color: 'var(--accent-gold)',
            }}
          >
            <Star size={12} fill="var(--accent-gold)" />
            {movie.rating.toFixed(1)}
          </div>
        )}

        {/* Format / Release Type Badge */}
        {movie.releaseType === 'COMING_SOON' ? (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              backgroundColor: 'var(--accent-red)',
              color: '#ffffff',
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '0.7rem',
              fontWeight: '800',
              textTransform: 'uppercase',
            }}
          >
            Coming Soon
          </div>
        ) : (
          movie.formats && movie.formats[0] && (
            <div
              style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'var(--text-secondary)',
                padding: '3px 6px',
                borderRadius: '4px',
                fontSize: '0.7rem',
                fontWeight: '700',
              }}
            >
              {movie.formats[0]}
            </div>
          )
        )}

        {/* Hover Overlay with Book CTA */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.95) 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '16px',
          }}
        >
          <h3
            style={{
              color: '#ffffff',
              fontSize: '1rem',
              lineHeight: '1.2',
              marginBottom: '4px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {movie.title}
          </h3>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
            }}
          >
            <span>{movie.language}</span>
              <span>{movie.genre && movie.genre[0]}</span>
            </div>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '10px', color: '#fff', fontSize: '0.8rem', fontWeight: 700 }}>
            <Ticket size={15} color="var(--accent-red)" />
            {movie.releaseType === 'COMING_SOON' ? 'View details' : 'Book Now'}
          </span>
        </div>
    </Link>
  );
}
