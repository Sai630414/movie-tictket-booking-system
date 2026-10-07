import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Building, Star } from 'lucide-react';
import api from '../services/api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { useCity } from '../context/CityContext.jsx';

export default function VenuesPage() {
  const { selectedCity } = useCity();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    const fetchVenues = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        if (selectedCity) query.set('city', selectedCity);
        if (typeFilter) query.set('type', typeFilter);
        const res = await api.get(`/venues?${query.toString()}`);
        if (res.data?.success) setVenues(res.data.data || []);
      } catch (err) {
        console.error('Fetch venues error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVenues();
  }, [selectedCity, typeFilter]);

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      <div style={{ borderBottom: '1px solid var(--border-color)', padding: '40px 0 30px', background: 'linear-gradient(180deg, rgba(229,9,20,0.12) 0%, transparent 100%)' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Building size={28} color="var(--accent-red)" />
            <h1 style={{ fontSize: '2.2rem', color: '#fff' }}>Venues</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Cinemas & Event Venues in {selectedCity}</p>

          {/* Type Filter Tabs */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {[['', 'All Venues'], ['CINEMA', 'Cinemas'], ['EVENT_VENUE', 'Event Venues']].map(([val, label]) => (
              <button key={val} onClick={() => setTypeFilter(val)} style={{
                padding: '8px 18px', borderRadius: '20px',
                backgroundColor: typeFilter === val ? 'var(--accent-red)' : 'var(--bg-card)',
                border: `1px solid ${typeFilter === val ? 'var(--accent-red)' : 'var(--border-color)'}`,
                color: '#fff', fontWeight: typeFilter === val ? '700' : '400',
                fontSize: '0.88rem', cursor: 'pointer'
              }}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '32px', paddingBottom: '60px' }}>
        {loading ? (
          <LoadingSpinner message="Loading venues..." />
        ) : venues.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {venues.map(venue => (
              <div key={venue._id} style={{
                backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
                borderRadius: '16px', overflow: 'hidden',
                transition: 'transform 0.3s, border-color 0.2s, box-shadow 0.3s'
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = 'var(--accent-red)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {venue.images?.[0] ? (
                  <img src={venue.images[0]} alt={venue.name} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '160px', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Building size={48} color="var(--border-color)" />
                  </div>
                )}

                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h3 style={{ color: '#fff', fontSize: '1.05rem', flex: 1, paddingRight: '10px' }}>{venue.name}</h3>
                    <span style={{
                      padding: '3px 8px', backgroundColor: venue.type === 'CINEMA' ? 'rgba(229,9,20,0.15)' : 'rgba(0,229,255,0.1)',
                      border: `1px solid ${venue.type === 'CINEMA' ? 'rgba(229,9,20,0.3)' : 'rgba(0,229,255,0.25)'}`,
                      borderRadius: '4px', color: venue.type === 'CINEMA' ? 'var(--accent-red)' : 'var(--accent-cyan)',
                      fontSize: '0.7rem', fontWeight: '700', flexShrink: 0
                    }}>
                      {venue.type === 'CINEMA' ? '🎬 Cinema' : '🎪 Event'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.84rem', marginBottom: '12px' }}>
                    <MapPin size={13} color="var(--accent-red)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{venue.address}</span>
                  </div>

                  {venue.amenities?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                      {venue.amenities.slice(0, 3).map(a => (
                        <span key={a} style={{
                          padding: '2px 8px', backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)', borderRadius: '12px',
                          fontSize: '0.72rem', color: 'var(--text-secondary)'
                        }}>{a}</span>
                      ))}
                      {venue.amenities.length > 3 && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', padding: '2px 6px' }}>+{venue.amenities.length - 3} more</span>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      Capacity: {venue.totalCapacity}
                    </span>
                    <Link to={`/movies?city=${venue.city}`} style={{
                      padding: '7px 14px', backgroundColor: 'rgba(229,9,20,0.15)',
                      border: '1px solid rgba(229,9,20,0.3)', borderRadius: '6px',
                      color: 'var(--accent-red)', fontSize: '0.82rem', fontWeight: '600', textDecoration: 'none'
                    }}>
                      View Shows →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-secondary)' }}>
            <Building size={60} color="var(--border-color)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ color: '#fff', marginBottom: '8px' }}>No venues found in {selectedCity}</h3>
          </div>
        )}
      </div>
    </div>
  );
}
