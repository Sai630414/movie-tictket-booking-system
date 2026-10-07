import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Search, Film } from 'lucide-react';
import api from '../../services/api.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import AdminLayout from './AdminLayout.jsx';

const EMPTY_FORM = {
  title: '', description: '', poster: '', backdrop: '', trailerUrl: '',
  genre: '', language: 'English', duration: 120, rating: 7.5,
  cast: '', director: '', releaseDate: '', releaseType: 'NEW_RELEASE',
  formats: '2D', certification: 'UA', status: 'ACTIVE'
};

export default function AdminMoviesPage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/movies?limit=50${search ? `&search=${encodeURIComponent(search)}` : ''}`);
      if (res.data?.success) setMovies(res.data.data.movies || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMovies(); }, []);

  const openCreate = () => { setForm(EMPTY_FORM); setEditingId(null); setShowModal(true); setError(''); };
  const openEdit = (movie) => {
    setForm({
      ...movie,
      genre: Array.isArray(movie.genre) ? movie.genre.join(', ') : movie.genre,
      cast: Array.isArray(movie.cast) ? movie.cast.join(', ') : movie.cast,
      formats: Array.isArray(movie.formats) ? movie.formats.join(', ') : movie.formats,
      releaseDate: movie.releaseDate ? new Date(movie.releaseDate).toISOString().split('T')[0] : '',
    });
    setEditingId(movie._id);
    setShowModal(true);
    setError('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        genre: form.genre.split(',').map(s => s.trim()).filter(Boolean),
        cast: form.cast.split(',').map(s => s.trim()).filter(Boolean),
        formats: form.formats.split(',').map(s => s.trim()).filter(Boolean),
        duration: Number(form.duration),
        rating: Number(form.rating),
      };

      if (editingId) {
        await api.patch(`/movies/${editingId}`, payload);
      } else {
        await api.post('/movies', payload);
      }
      setShowModal(false);
      fetchMovies();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this movie?')) return;
    try {
      await api.delete(`/movies/${id}`);
      fetchMovies();
    } catch (err) { alert('Failed to deactivate movie.'); }
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
          <h1 style={{ fontSize: '1.8rem', color: '#fff' }}>Movies Management</h1>
          <button onClick={openCreate} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Add Movie
          </button>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input type="text" placeholder="Search movies..." value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchMovies()}
              style={{ ...inputStyle, marginBottom: 0, paddingLeft: '42px' }}
            />
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
          <button onClick={fetchMovies} className="btn-outline" style={{ padding: '10px 20px' }}>Search</button>
        </div>

        {loading ? <LoadingSpinner /> : (
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                  {['Poster', 'Title', 'Language', 'Rating', 'Format', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movies.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No movies found</td></tr>
                ) : movies.map(movie => (
                  <tr key={movie._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <img src={movie.poster} alt={movie.title} style={{ width: '40px', height: '56px', objectFit: 'cover', borderRadius: '4px' }} />
                    </td>
                    <td style={{ padding: '12px 16px', color: '#fff', fontWeight: '600', fontSize: '0.9rem' }}>{movie.title}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{movie.language}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--accent-gold)', fontWeight: '700' }}>⭐ {movie.rating}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{movie.formats?.join(', ')}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '700',
                        backgroundColor: movie.status === 'ACTIVE' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                        color: movie.status === 'ACTIVE' ? '#22c55e' : '#ef4444'
                      }}>{movie.status}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => openEdit(movie)} style={{ padding: '6px', borderRadius: '6px', backgroundColor: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa' }}>
                          <Edit size={14} />
                        </button>
                        <button onClick={() => handleDelete(movie._id)} style={{ padding: '6px', borderRadius: '6px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(6px)' }}>
          <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ color: '#fff', fontSize: '1.3rem' }}>{editingId ? 'Edit Movie' : 'Add New Movie'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', color: 'var(--text-muted)', fontSize: '1.4rem' }}>×</button>
            </div>

            {[
              { label: 'Title *', key: 'title', type: 'text' },
              { label: 'Poster URL *', key: 'poster', type: 'text', placeholder: 'https://...' },
              { label: 'Backdrop URL *', key: 'backdrop', type: 'text', placeholder: 'https://...' },
              { label: 'Trailer URL (YouTube)', key: 'trailerUrl', type: 'text' },
              { label: 'Language *', key: 'language', type: 'text', placeholder: 'English' },
              { label: 'Director', key: 'director', type: 'text' },
              { label: 'Genre (comma-separated) *', key: 'genre', type: 'text', placeholder: 'Action, Thriller' },
              { label: 'Cast (comma-separated)', key: 'cast', type: 'text', placeholder: 'Actor 1, Actor 2' },
              { label: 'Formats (comma-separated)', key: 'formats', type: 'text', placeholder: '2D, 3D' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{label}</label>
                <input type={type} placeholder={placeholder} value={form[key] || ''}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  style={{ ...inputStyle }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>
            ))}

            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Description *</label>
              <textarea rows={3} value={form.description || ''}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                style={{ ...inputStyle, resize: 'vertical' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Duration (mins)</label>
                <input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} style={{ ...inputStyle }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Rating (0-10)</label>
                <input type="number" step="0.1" min="0" max="10" value={form.rating} onChange={e => setForm(f => ({ ...f, rating: e.target.value }))} style={{ ...inputStyle }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Release Date</label>
                <input type="date" value={form.releaseDate} onChange={e => setForm(f => ({ ...f, releaseDate: e.target.value }))} style={{ ...inputStyle, colorScheme: 'dark' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              {[
                { label: 'Release Type', key: 'releaseType', options: ['NEW_RELEASE', 'RE_RELEASE', 'COMING_SOON'] },
                { label: 'Certification', key: 'certification', options: ['U', 'UA', 'A', 'S'] },
                { label: 'Status', key: 'status', options: ['ACTIVE', 'INACTIVE'] },
              ].map(({ label, key, options }) => (
                <div key={key}>
                  <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{label}</label>
                  <select value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={{ ...inputStyle }}>
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>

            {error && <p style={{ color: 'var(--accent-red)', fontSize: '0.85rem', marginBottom: '12px' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ flex: 1, padding: '12px' }}>
                {saving ? 'Saving...' : editingId ? 'Update Movie' : 'Create Movie'}
              </button>
              <button onClick={() => setShowModal(false)} className="btn-outline" style={{ flex: 1, padding: '12px' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
