import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Calendar, Clock, Film, Building, Monitor, DollarSign } from 'lucide-react';
import api from '../../services/api.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import AdminLayout from './AdminLayout.jsx';

const FORMATS = ['2D', '3D', 'IMAX 2D', 'IMAX 3D', '4DX'];
const POPULAR_SLOTS = ['10:00 AM', '10:30 AM', '01:45 PM', '02:15 PM', '05:30 PM', '06:45 PM', '09:30 PM', '10:00 PM'];

export default function AdminShowsPage() {
  const [shows, setShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [venues, setVenues] = useState([]);
  const [screens, setScreens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedMovieFilter, setSelectedMovieFilter] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    movie: '',
    venue: '',
    screen: '',
    showDate: new Date().toISOString().split('T')[0],
    startTime: '06:45 PM',
    language: 'English',
    format: '2D',
    basePrice: 250,
  });

  const fetchShows = async () => {
    setLoading(true);
    try {
      const query = selectedMovieFilter ? `?movieId=${selectedMovieFilter}` : '';
      const res = await api.get(`/shows${query}`);
      if (res.data?.success) setShows(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [moviesRes, venuesRes] = await Promise.all([
        api.get('/movies?limit=50'),
        api.get('/venues?type=CINEMA'),
      ]);
      if (moviesRes.data?.success) setMovies(moviesRes.data.data.movies || []);
      if (venuesRes.data?.success) setVenues(venuesRes.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchShows();
  }, [selectedMovieFilter]);

  // When venue changes in form, fetch its screens
  const handleVenueChange = async (venueId) => {
    setForm(f => ({ ...f, venue: venueId, screen: '' }));
    try {
      const res = await api.get(`/venues/${venueId}`);
      if (res.data?.success) {
        const venueScreens = res.data.data.screens || [];
        setScreens(venueScreens);
        if (venueScreens.length > 0) {
          setForm(f => ({ ...f, screen: venueScreens[0]._id }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMovieChange = (movieId) => {
    const movieObj = movies.find(m => m._id === movieId);
    setForm(f => ({
      ...f,
      movie: movieId,
      language: movieObj?.language || 'English',
      format: movieObj?.formats?.[0] || '2D',
    }));
  };

  const openCreate = () => {
    const defaultMovie = movies[0];
    const defaultVenue = venues[0];
    setForm({
      movie: defaultMovie?._id || '',
      venue: defaultVenue?._id || '',
      screen: '',
      showDate: new Date().toISOString().split('T')[0],
      startTime: '06:45 PM',
      language: defaultMovie?.language || 'English',
      format: defaultMovie?.formats?.[0] || '2D',
      basePrice: 250,
    });
    if (defaultVenue?._id) {
      handleVenueChange(defaultVenue._id);
    }
    setShowModal(true);
    setError('');
  };

  const handleSaveShow = async () => {
    if (!form.movie || !form.venue || !form.screen) {
      setError('Please select Movie, Venue, and Screen.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.post('/shows', {
        ...form,
        basePrice: Number(form.basePrice),
      });
      setShowModal(false);
      fetchShows();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule show. There might be a timing conflict.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteShow = async (id) => {
    if (!window.confirm('Cancel this show? Existing seat statuses will be cancelled.')) return;
    try {
      await api.delete(`/shows/${id}`);
      fetchShows();
    } catch (err) {
      alert('Failed to cancel show.');
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 12px', backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff',
    fontSize: '0.88rem', outline: 'none', marginBottom: '12px'
  };

  return (
    <AdminLayout>
      <div style={{ padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', color: '#fff' }}>Showtimes Scheduling</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>Assign movies to cinema screens with dynamic pricing and timing</p>
          </div>
          <button onClick={openCreate} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Schedule Show
          </button>
        </div>

        {/* Filter by Movie */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
          <label style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Filter by Movie:</label>
          <select
            value={selectedMovieFilter}
            onChange={e => setSelectedMovieFilter(e.target.value)}
            style={{ ...inputStyle, width: 'auto', minWidth: '220px', marginBottom: 0 }}
          >
            <option value="">All Movies</option>
            {movies.map(m => (
              <option key={m._id} value={m._id}>{m.title}</option>
            ))}
          </select>
        </div>

        {loading ? <LoadingSpinner message="Loading shows..." /> : (
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                  {['Movie', 'Cinema & Screen', 'Date & Slot', 'Format & Lang', 'Base Price', 'Seats Booked', 'Status', 'Action'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shows.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No scheduled shows found</td></tr>
                ) : shows.map(show => {
                  const totalSeats = show.seatStatus?.length || 0;
                  const bookedSeats = show.seatStatus?.filter(s => s.status === 'BOOKED').length || 0;
                  const pct = totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0;

                  return (
                    <tr key={show._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.9rem' }}>{show.movie?.title || 'Unknown Movie'}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{show.language}</div>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <div style={{ color: '#fff', fontWeight: '500' }}>{show.venue?.name}</div>
                        <div style={{ color: 'var(--accent-cyan)', fontSize: '0.78rem' }}>{show.screen?.name || 'Screen'}</div>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <div>{new Date(show.showDate).toLocaleDateString()}</div>
                        <div style={{ color: 'var(--accent-gold)', fontWeight: '700', fontSize: '0.82rem' }}>{show.startTime}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', backgroundColor: 'rgba(229,9,20,0.15)', color: 'var(--accent-red)' }}>
                          {show.format}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#fff', fontWeight: '700', fontSize: '0.9rem' }}>
                        ₹{show.basePrice}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '60px', height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', backgroundColor: pct > 80 ? '#ef4444' : '#22c55e' }} />
                          </div>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{bookedSeats}/{totalSeats} ({pct}%)</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '700',
                          backgroundColor: show.status === 'ACTIVE' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                          color: show.status === 'ACTIVE' ? '#22c55e' : '#ef4444'
                        }}>{show.status}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button
                          onClick={() => handleDeleteShow(show._id)}
                          style={{ padding: '6px', borderRadius: '6px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', cursor: 'pointer' }}
                          title="Cancel Show"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Schedule Show */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(6px)' }}>
          <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ color: '#fff', fontSize: '1.3rem' }}>Schedule Movie Show</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', color: 'var(--text-muted)', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Movie *</label>
              <select value={form.movie} onChange={e => handleMovieChange(e.target.value)} style={inputStyle}>
                {movies.map(m => (
                  <option key={m._id} value={m._id}>{m.title} ({m.language})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Cinema Venue *</label>
                <select value={form.venue} onChange={e => handleVenueChange(e.target.value)} style={inputStyle}>
                  {venues.map(v => (
                    <option key={v._id} value={v._id}>{v.name} ({v.city})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Screen / Audi *</label>
                <select value={form.screen} onChange={e => setForm(f => ({ ...f, screen: e.target.value }))} style={inputStyle}>
                  {screens.length === 0 ? (
                    <option value="">No screens found (Add screen to venue first)</option>
                  ) : screens.map(s => (
                    <option key={s._id} value={s._id}>{s.name} ({s.totalSeats} Seats)</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Show Date *</label>
                <input type="date" value={form.showDate} onChange={e => setForm(f => ({ ...f, showDate: e.target.value }))} style={{ ...inputStyle, colorScheme: 'dark' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Start Time Slot *</label>
                <input
                  type="text"
                  value={form.startTime}
                  onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                  style={inputStyle}
                  placeholder="e.g. 06:45 PM"
                />
              </div>
            </div>

            {/* Quick Time Slots */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
              {POPULAR_SLOTS.map(slot => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, startTime: slot }))}
                  style={{
                    padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem',
                    backgroundColor: form.startTime === slot ? 'var(--accent-red)' : 'var(--bg-card)',
                    border: '1px solid var(--border-color)', color: '#fff', cursor: 'pointer'
                  }}
                >
                  {slot}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Format</label>
                <select value={form.format} onChange={e => setForm(f => ({ ...f, format: e.target.value }))} style={inputStyle}>
                  {FORMATS.map(fmt => <option key={fmt} value={fmt}>{fmt}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Language</label>
                <input type="text" value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Base Price (₹) *</label>
                <input type="number" value={form.basePrice} onChange={e => setForm(f => ({ ...f, basePrice: e.target.value }))} style={inputStyle} />
              </div>
            </div>

            {error && <p style={{ color: 'var(--accent-red)', fontSize: '0.85rem', marginBottom: '12px' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <button onClick={handleSaveShow} disabled={saving} className="btn-primary" style={{ flex: 1, padding: '12px' }}>
                {saving ? 'Creating Show...' : 'Schedule Show'}
              </button>
              <button onClick={() => setShowModal(false)} className="btn-outline" style={{ flex: 1, padding: '12px' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
