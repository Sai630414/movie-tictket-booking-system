import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Calendar, MapPin, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import api from '../services/api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const TABS = [
  { key: '', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const STATUS_COLORS = {
  CONFIRMED: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)', icon: CheckCircle },
  PENDING: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', icon: AlertCircle },
  CANCELLED: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', icon: XCircle },
  COMPLETED: { color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)', icon: CheckCircle },
};

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const fetchBookings = async (tab = '') => {
    setLoading(true);
    try {
      const query = tab ? `?statusTab=${tab}` : '';
      const res = await api.get(`/bookings${query}`);
      if (res.data?.success) {
        setBookings(res.data.data || []);
      }
    } catch (err) {
      console.error('Fetch bookings error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchBookings(activeTab);
    else {
      setBookings([]);
      setLoading(false);
    }
  }, [activeTab, user]);

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setCancellingId(bookingId);
    try {
      const res = await api.post(`/bookings/${bookingId}/cancel`);
      if (res.data?.success) {
        fetchBookings(activeTab);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot cancel this booking.');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      <div style={{ borderBottom: '1px solid var(--border-color)', padding: '40px 0 0' }}>
        <div className="container">
          <h1 style={{ fontSize: '2rem', color: '#fff', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Ticket size={28} color="var(--accent-red)" /> My Bookings
          </h1>

          {/* Tabs */}
          {user && <div style={{ display: 'flex', gap: '0', borderBottom: 'none' }}>
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '12px 24px', background: 'none', border: 'none',
                  borderBottom: `3px solid ${activeTab === tab.key ? 'var(--accent-red)' : 'transparent'}`,
                  color: activeTab === tab.key ? '#fff' : 'var(--text-secondary)',
                  fontWeight: activeTab === tab.key ? '700' : '400',
                  fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>}
        </div>
      </div>

      <div className="container" style={{ paddingTop: '32px', paddingBottom: '60px' }}>
        {!user ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-secondary)' }}>
            <Ticket size={60} color="var(--border-color)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ color: '#fff', marginBottom: '8px' }}>Sign in to view your bookings</h3>
            <p style={{ marginBottom: '24px' }}>Your tickets and booking history will appear here.</p>
            <Link to="/login" className="btn-primary">Sign In</Link>
          </div>
        ) : loading ? (
          <LoadingSpinner message="Loading bookings..." />
        ) : bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-secondary)' }}>
            <Ticket size={60} color="var(--border-color)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ color: '#fff', marginBottom: '8px' }}>No bookings found</h3>
            <p style={{ marginBottom: '24px' }}>Looks like you haven't booked anything yet!</p>
            <Link to="/movies" className="btn-primary">Browse Movies</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {bookings.map(booking => {
              const statusInfo = STATUS_COLORS[booking.bookingStatus] || STATUS_COLORS.PENDING;
              const StatusIcon = statusInfo.icon;
              const title = booking.movie?.title || booking.event?.name || 'Booking';
              const poster = booking.movie?.poster || booking.event?.poster;
              const dateStr = booking.show?.showDate
                ? new Date(booking.show.showDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                : booking.event?.date
                  ? new Date(booking.event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                  : null;

              return (
                <div key={booking._id} style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-red)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  <div style={{ display: 'flex', gap: '0' }}>
                    {/* Poster */}
                    {poster && (
                      <img src={poster} alt={title} style={{ width: '100px', objectFit: 'cover', flexShrink: 0 }} />
                    )}

                    {/* Info */}
                    <div style={{ padding: '20px', flex: 1, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                          <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>{title}</h3>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: '5px', padding: '3px 8px',
                            backgroundColor: statusInfo.bg, borderRadius: '4px',
                            fontSize: '0.75rem', color: statusInfo.color, fontWeight: '700'
                          }}>
                            <StatusIcon size={12} /> {booking.bookingStatus}
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          {booking.venue && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <MapPin size={13} color="var(--accent-red)" />
                              {booking.venue?.name}
                            </div>
                          )}
                          {dateStr && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Calendar size={13} color="var(--accent-red)" />
                              {dateStr}
                            </div>
                          )}
                          {booking.show?.startTime && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Clock size={13} color="var(--accent-red)" />
                              {booking.show.startTime}
                            </div>
                          )}
                        </div>

                        {booking.seats?.length > 0 && (
                          <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                            {booking.seats.map(s => (
                              <span key={s.seatId} style={{
                                padding: '2px 8px', backgroundColor: 'rgba(229,9,20,0.15)',
                                border: '1px solid rgba(229,9,20,0.3)', borderRadius: '4px',
                                color: 'var(--accent-red)', fontSize: '0.75rem', fontWeight: '700'
                              }}>{s.seatId}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions & Amount */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>#{booking.bookingId}</div>
                          <div style={{ color: 'var(--accent-gold)', fontWeight: '800', fontSize: '1.3rem' }}>₹{booking.totalAmount}</div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Link
                            to={`/bookings/${booking._id}`}
                            style={{
                              padding: '8px 14px', backgroundColor: 'var(--bg-secondary)',
                              border: '1px solid var(--border-color)', borderRadius: '6px',
                              color: '#fff', fontSize: '0.82rem', fontWeight: '600', textDecoration: 'none'
                            }}
                          >
                            View Ticket
                          </Link>
                          {booking.bookingStatus === 'CONFIRMED' && (
                            <button
                              onClick={() => handleCancel(booking._id)}
                              disabled={cancellingId === booking._id}
                              style={{
                                padding: '8px 14px', backgroundColor: 'rgba(239,68,68,0.1)',
                                border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px',
                                color: '#ef4444', fontSize: '0.82rem', fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              {cancellingId === booking._id ? '...' : 'Cancel'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
