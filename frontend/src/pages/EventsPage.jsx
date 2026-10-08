import React, { useEffect, useState } from 'react';
import { Calendar, Filter, Search, X, MapPin } from 'lucide-react';
import api from '../services/api.js';
import EventCard from '../components/EventCard.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { useCity } from '../context/CityContext.jsx';

const CATEGORIES = ['Concert', 'Comedy', 'Sports', 'Theatre', 'Festival', 'Workshop', 'Exhibition', 'Conference', 'Other'];

export default function EventsPage() {
  const { selectedCity } = useCity();
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    category: '',
    city: selectedCity,
    date: '',
    page: 1,
  });

  const fetchEvents = async (params = {}) => {
    setLoading(true);
    try {
      const merged = { ...filters, ...params };
      const query = new URLSearchParams();
      Object.entries(merged).forEach(([k, v]) => { if (v) query.set(k, v); });
      const res = await api.get(`/events?${query.toString()}`);
      if (res.data?.success) {
        setEvents(res.data.data.events || []);
        setPagination(res.data.data.pagination || {});
      }
    } catch (err) {
      console.error('Fetch events error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setFilters(current => ({ ...current, city: selectedCity, page: 1 }));
    fetchEvents({ city: selectedCity, page: 1 });
  }, [selectedCity]);

  const applyFilters = () => {
    fetchEvents({ ...filters, page: 1 });
    setShowFilters(false);
  };

  const clearFilters = () => {
    const cleared = { search: '', category: '', city: '', date: '', page: 1 };
    setFilters(cleared);
    fetchEvents(cleared);
  };

  const activeFilterCount = [filters.category, filters.city, filters.date].filter(Boolean).length;

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(229,9,20,0.15) 0%, transparent 100%)',
        borderBottom: '1px solid var(--border-color)',
        padding: '40px 0 30px'
      }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Calendar size={28} color="var(--accent-red)" />
            <h1 style={{ fontSize: '2.2rem', color: '#fff' }}>Events</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{pagination.total} events found</p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {/* Search */}
            <form onSubmit={(e) => { e.preventDefault(); fetchEvents({ ...filters, page: 1 }); }} style={{ flex: '1', minWidth: '280px', position: 'relative' }}>
              <input
                type="text"
                placeholder="Search events, artists, organizers..."
                value={filters.search}
                onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                style={{
                  width: '100%', padding: '12px 48px 12px 18px',
                  backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
                  borderRadius: '8px', color: '#fff', fontSize: '0.95rem', outline: 'none'
                }}
              />
              <button type="submit" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', color: 'var(--text-secondary)' }}>
                <Search size={18} />
              </button>
            </form>

            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px',
                backgroundColor: activeFilterCount > 0 ? 'var(--accent-red)' : 'var(--bg-card)',
                border: '1px solid var(--border-color)', borderRadius: '8px',
                color: '#fff', fontWeight: '600', fontSize: '0.9rem'
              }}
            >
              <Filter size={16} /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
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
              marginTop: '16px', padding: '20px', backgroundColor: 'var(--bg-card)',
              borderRadius: '12px', border: '1px solid var(--border-color)',
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px'
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</label>
                <select value={filters.category} onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.9rem' }}>
                  <option value="">All Categories</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>City</label>
                <input
                  type="text" placeholder="e.g. Mumbai" value={filters.city}
                  onChange={(e) => setFilters(f => ({ ...f, city: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</label>
                <input
                  type="date" value={filters.date}
                  onChange={(e) => setFilters(f => ({ ...f, date: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.9rem', outline: 'none', colorScheme: 'dark' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button onClick={applyFilters} className="btn-primary" style={{ width: '100%', padding: '10px' }}>
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Events Grid */}
      <div className="container" style={{ paddingTop: '32px', paddingBottom: '60px' }}>
        {loading ? (
          <LoadingSpinner message="Loading events..." />
        ) : events.length > 0 ? (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '24px',
              marginBottom: '40px'
            }}>
              {events.map(e => <EventCard key={e._id} event={e} />)}
            </div>

            {pagination.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(pg => (
                  <button key={pg} onClick={() => fetchEvents({ ...filters, page: pg })} style={{
                    width: '40px', height: '40px', borderRadius: '8px',
                    backgroundColor: pg === pagination.page ? 'var(--accent-red)' : 'var(--bg-card)',
                    border: '1px solid var(--border-color)', color: '#fff'
                  }}>{pg}</button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-secondary)' }}>
            <Calendar size={60} color="var(--border-color)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ color: '#fff', marginBottom: '8px' }}>No events found</h3>
            <p>Try adjusting your filters or check back soon</p>
          </div>
        )}
      </div>
    </div>
  );
}
