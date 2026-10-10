import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, Clock, Globe, Users, Play, Ticket, ChevronRight, Calendar, MapPin } from 'lucide-react';
import api from '../services/api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { useCity } from '../context/CityContext.jsx';
import TrailerModal from '../components/TrailerModal.jsx';

export default function MovieDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { selectedCity } = useCity();
  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState('');
  const [showTrailer, setShowTrailer] = useState(false);

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const res = await api.get(`/movies/slug/${slug}?city=${encodeURIComponent(selectedCity)}`);
        if (res.data?.success) {
          setMovie(res.data.data.movie);
          setShows(res.data.data.shows || []);
        }
      } catch (err) {
        console.error('Fetch movie detail error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMovie();
  }, [slug, selectedCity]);

  if (loading) return <LoadingSpinner message="Loading movie details..." />;
  if (!movie) return (
    <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-secondary)' }}>
      <h2>Movie not found</h2>
      <Link to="/movies" className="btn-primary" style={{ display: 'inline-flex', marginTop: '20px' }}>Browse Movies</Link>
    </div>
  );

  // Get unique dates from shows
  const showDates = [...new Set(shows.map(s => new Date(s.showDate).toISOString().split('T')[0]))].sort();
  const displayDate = selectedDate || showDates[0] || '';

  // Filter shows by selected date
  const filteredShows = shows.filter(s =>
    new Date(s.showDate).toISOString().split('T')[0] === displayDate
  );

  // Group by venue
  const showsByVenue = filteredShows.reduce((acc, show) => {
    const venueId = show.venue?._id || 'unknown';
    if (!acc[venueId]) acc[venueId] = { venue: show.venue, shows: [] };
    acc[venueId].shows.push(show);
    return acc;
  }, {});

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* Backdrop Hero */}
      <div style={{
        position: 'relative',
        height: '500px',
        overflow: 'hidden',
        backgroundColor: '#000'
      }}>
        {movie.backdrop ? <img
          src={movie.backdrop || movie.poster}
          alt={movie.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }}
        /> : <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 25%, rgba(229,9,20,.3), transparent 55%), linear-gradient(145deg,#27232a,#09090b)' }} />}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, transparent 30%, #141414 100%), linear-gradient(90deg, rgba(0,0,0,0.8) 40%, transparent 100%)'
        }} />

        {/* Floating Content Overlay */}
        <div className="container" style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'flex-end',
          paddingBottom: '48px',
          gap: '32px'
        }}>
          {/* Poster */}
          {movie.poster ? <img
            src={movie.poster}
            alt={movie.title}
            style={{
              width: '180px',
              height: '270px',
              objectFit: 'cover',
              borderRadius: '12px',
              border: '2px solid rgba(255,255,255,0.2)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
              flexShrink: 0
            }}
          /> : <div aria-hidden="true" style={{ width: 180, height: 270, flexShrink: 0, borderRadius: 12, border: '2px solid rgba(255,255,255,.18)', display: 'grid', placeItems: 'center', padding: 14, textAlign: 'center', color: '#fff', fontSize: '1.05rem', fontWeight: 800, background: 'linear-gradient(145deg,#3a252d,#111116)' }}>{movie.title}</div>}

          <div style={{ flex: 1 }}>
            {/* Meta badges */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <span className="badge badge-gold" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Star size={12} fill="var(--accent-gold)" /> {(movie.rating || 0).toFixed(1)}
              </span>
              <span className="badge badge-red">{movie.certification}</span>
              {movie.formats?.map(f => (
                <span key={f} className="badge badge-dark">{f}</span>
              ))}
            </div>

            <h1 style={{ fontSize: '2.8rem', color: '#fff', marginBottom: '12px', lineHeight: 1.1 }}>{movie.title}</h1>

            <div style={{ display: 'flex', gap: '20px', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px', flexWrap: 'wrap' }}>
              {movie.genre?.map(g => (
                <span key={g} style={{ color: 'rgba(255,255,255,0.75)', background: 'rgba(255,255,255,0.1)', padding: '3px 10px', borderRadius: '12px', fontSize: '0.82rem' }}>{g}</span>
              ))}
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Clock size={14} /> {movie.duration} mins</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Globe size={14} /> {movie.language}</span>
            </div>

            <p style={{
              color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7,
              maxWidth: '600px',
              display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
            }}>
              {movie.description}
            </p>

            {(movie.trailerUrl || movie.trailer?.url || movie.trailer?.videoId) && (
              <button
                type="button" onClick={() => setShowTrailer(true)}
                className="btn-secondary"
                style={{ display: 'inline-flex', marginTop: '20px', gap: '8px' }}
              >
                <Play size={16} fill="#fff" /> Watch Trailer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '40px' }}>

          {/* Left: Cast, Director, Shows */}
          <div>
            {/* Cast & Director */}
            <div style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '1.4rem', marginBottom: '20px', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users size={20} color="var(--accent-red)" /> Cast & Crew
              </h2>
              {movie.director && (
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Director</span>
                  <p style={{ color: '#fff', fontWeight: '600', marginTop: '4px' }}>{movie.director}</p>
                </div>
              )}
              {movie.cast?.length > 0 && (
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cast</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                    {movie.cast.map(c => (
                      <span key={c} style={{
                        padding: '6px 12px', backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-color)', borderRadius: '20px',
                        fontSize: '0.85rem', color: '#fff'
                      }}>{c}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Book Tickets Section */}
            {shows.length > 0 ? (
              <div>
                <h2 style={{ fontSize: '1.4rem', marginBottom: '20px', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Ticket size={20} color="var(--accent-red)" /> Book Tickets
                </h2>

                {/* Date Selector */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
                  {showDates.map(d => {
                    const dateObj = new Date(d + 'T00:00:00');
                    return (
                      <button
                        key={d}
                        onClick={() => setSelectedDate(d)}
                        style={{
                          padding: '10px 16px',
                          borderRadius: '8px',
                          border: '2px solid',
                          borderColor: displayDate === d ? 'var(--accent-red)' : 'var(--border-color)',
                          backgroundColor: displayDate === d ? 'rgba(229,9,20,0.15)' : 'var(--bg-card)',
                          color: displayDate === d ? 'var(--accent-red)' : '#fff',
                          fontWeight: displayDate === d ? '700' : '400',
                          fontSize: '0.88rem',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontWeight: '700' }}>
                          {dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>
                          {dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Shows by Venue */}
                {Object.values(showsByVenue).map(({ venue, shows: venueShows }) => (
                  <div key={venue?._id || 'unknown'} style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                      <MapPin size={16} color="var(--accent-red)" />
                      <div>
                        <h4 style={{ color: '#fff', fontWeight: '700' }}>{venue?.name || 'Theatre'}</h4>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{venue?.address}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {venueShows.map(show => (
                        <Link
                          key={show._id}
                          to={`/shows/${show._id}/seats`}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            padding: '10px 16px',
                            backgroundColor: 'var(--bg-secondary)',
                            border: '2px solid var(--border-color)',
                            borderRadius: '8px',
                            color: '#fff',
                            textDecoration: 'none',
                            transition: 'all 0.2s',
                            minWidth: '100px'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.borderColor = 'var(--accent-red)';
                            e.currentTarget.style.backgroundColor = 'rgba(229,9,20,0.15)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                            e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                          }}
                        >
                          <span style={{ fontWeight: '700', fontSize: '1rem' }}>{show.startTime}</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{show.format} • {show.language}</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--accent-gold)', marginTop: '4px' }}>₹{show.basePrice}+</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
                borderRadius: '12px', padding: '32px', textAlign: 'center', color: 'var(--text-secondary)'
              }}>
                <Calendar size={40} color="var(--border-color)" style={{ margin: '0 auto 12px' }} />
                <p>No shows available for this movie currently.</p>
              </div>
            )}
          </div>

          {/* Right: Info Card */}
          <div>
            <div className="glass-card" style={{ position: 'sticky', top: '90px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', color: '#fff' }}>Movie Info</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { label: 'Release Date', value: new Date(movie.releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
                  { label: 'Language', value: movie.language },
                  { label: 'Duration', value: `${movie.duration} minutes` },
                  { label: 'Director', value: movie.director },
                  { label: 'Certification', value: movie.certification },
                  { label: 'Formats', value: movie.formats?.join(', ') },
                ].map(({ label, value }) => value && (
                  <div key={label} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                    <p style={{ color: '#fff', fontSize: '0.92rem', marginTop: '4px', fontWeight: '500' }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {showTrailer && <TrailerModal movie={movie} onClose={() => setShowTrailer(false)} />}
    </div>
  );
}
