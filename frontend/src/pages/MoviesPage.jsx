import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Film, Filter, Search, X, ChevronDown } from 'lucide-react';
import api from '../services/api.js';
import MovieCard from '../components/MovieCard.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { useCity } from '../context/CityContext.jsx';

const GENRES = ['Action', 'Drama', 'Comedy', 'Thriller', 'Romance', 'Sci-Fi', 'Horror', 'Fantasy', 'History', 'Adventure'];
const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Marathi'];
const RELEASE_TYPES = [
  { label: 'New Release', value: 'NEW_RELEASE' },
  { label: 'Re-Release', value: 'RE_RELEASE' },
  { label: 'Coming Soon', value: 'COMING_SOON' },
  { label: 'Catalog', value: 'CATALOG' },
];
const FORMATS = ['2D', '3D', 'IMAX 2D', 'IMAX 3D', '4DX'];

export default function MoviesPage() {
  const location = useLocation();
  const { selectedCity } = useCity();
  const [movies, setMovies] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    genre: '',
    language: '',
    releaseType: '',
    format: '',
    rating: '',
    page: 1,
  });

  const fetchMovies = async (params = {}) => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      const merged = { ...filters, ...params };
      Object.entries(merged).forEach(([k, v]) => { if (v) query.set(k, v); });
      query.set('city', selectedCity);
      const res = await api.get(`/movies?${query.toString()}`);
      if (res.data?.success) {
        setMovies(res.data.data.movies || []);
        setPagination(res.data.data.pagination || {});
      }
    } catch (err) {
      console.error('Fetch movies error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const search = new URLSearchParams(location.search).get('search') || '';
    setFilters(current => ({ ...current, search, page: 1 }));
    fetchMovies({ search, page: 1, city: selectedCity });
  }, [location.search, selectedCity]);

  const applyFilters = () => {
    fetchMovies({ ...filters, page: 1 });
    setShowFilters(false);
  };

  const clearFilters = () => {
    const cleared = { search: '', genre: '', language: '', releaseType: '', format: '', rating: '', page: 1 };
    setFilters(cleared);
    fetchMovies(cleared);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMovies({ ...filters, page: 1 });
  };

  const activeFilterCount = [filters.genre, filters.language, filters.releaseType, filters.format, filters.rating].filter(Boolean).length;

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* Page Header */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(229,9,20,0.15) 0%, transparent 100%)',
        borderBottom: '1px solid var(--border-color)',
        padding: '40px 0 30px'
      }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Film size={28} color="var(--accent-red)" />
            <h1 style={{ fontSize: '2.2rem', color: '#fff' }}>Movies</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            {pagination.total} movies found
          </p>

          {/* Search & Filter Controls */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <form onSubmit={handleSearch} style={{ flex: '1', minWidth: '280px', position: 'relative' }}>
              <input
                type="text"
                placeholder="Search movies, directors, actors..."
                value={filters.search}
                onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px 48px 12px 18px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              />
              <button type="submit" style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', color: 'var(--text-secondary)'
              }}>
                <Search size={18} />
              </button>
            </form>

            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px 20px',
                backgroundColor: activeFilterCount > 0 ? 'var(--accent-red)' : 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px', color: '#fff', fontWeight: '600', fontSize: '0.9rem'
              }}
            >
              <Filter size={16} />
              Filters
              {activeFilterCount > 0 && (
                <span style={{
                  background: '#fff', color: 'var(--accent-red)',
                  borderRadius: '50%', width: '20px', height: '20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: '800'
                }}>{activeFilterCount}</span>
              )}
            </button>

            {activeFilterCount > 0 && (
              <button onClick={clearFilters} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '10px 16px', background: 'transparent',
                border: '1px solid var(--border-color)', borderRadius: '8px',
                color: 'var(--text-secondary)', fontSize: '0.88rem'
              }}>
                <X size={14} /> Clear All
              </button>
            )}
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div style={{
              marginTop: '16px',
              padding: '20px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '16px'
            }}>
              {/* Genre Filter */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Genre</label>
                <select
                  value={filters.genre}
                  onChange={(e) => setFilters(f => ({ ...f, genre: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.9rem' }}
                >
                  <option value="">All Genres</option>
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              {/* Language Filter */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Language</label>
                <select
                  value={filters.language}
                  onChange={(e) => setFilters(f => ({ ...f, language: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.9rem' }}
                >
                  <option value="">All Languages</option>
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              {/* Release Type */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Release Type</label>
                <select
                  value={filters.releaseType}
                  onChange={(e) => setFilters(f => ({ ...f, releaseType: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.9rem' }}
                >
                  <option value="">All Types</option>
                  {RELEASE_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>

              {/* Format */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Format</label>
                <select
                  value={filters.format}
                  onChange={(e) => setFilters(f => ({ ...f, format: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.9rem' }}
                >
                  <option value="">All Formats</option>
                  {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              {/* Min Rating */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Min Rating</label>
                <select
                  value={filters.rating}
                  onChange={(e) => setFilters(f => ({ ...f, rating: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.9rem' }}
                >
                  <option value="">Any Rating</option>
                  {[6, 7, 8, 9].map(r => <option key={r} value={r}>{r}+ Stars</option>)}
                </select>
              </div>

              {/* Apply Button */}
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button onClick={applyFilters} className="btn-primary" style={{ width: '100%', padding: '10px' }}>
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Movies Grid */}
      <div className="container" style={{ paddingTop: '32px', paddingBottom: '60px' }}>
        {loading ? (
          <LoadingSpinner message="Loading movies..." />
        ) : movies.length > 0 ? (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '20px',
              marginBottom: '40px'
            }}>
              {movies.map(m => <MovieCard key={m._id} movie={m} />)}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(pg => (
                  <button
                    key={pg}
                    onClick={() => fetchMovies({ ...filters, page: pg })}
                    style={{
                      width: '40px', height: '40px', borderRadius: '8px',
                      backgroundColor: pg === pagination.page ? 'var(--accent-red)' : 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      color: '#fff', fontWeight: pg === pagination.page ? '700' : '400'
                    }}
                  >{pg}</button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-secondary)' }}>
            <Film size={60} color="var(--border-color)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ color: '#fff', marginBottom: '8px' }}>No movies found</h3>
            <p>Try adjusting your filters or search terms</p>
          </div>
        )}
      </div>
    </div>
  );
}
