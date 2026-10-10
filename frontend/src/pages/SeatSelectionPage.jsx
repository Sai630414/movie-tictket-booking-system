import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Armchair, Timer, Info, ChevronRight } from 'lucide-react';
import api from '../services/api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const SEAT_COLORS = {
  AVAILABLE: { bg: '#1e3a5f', border: '#2563eb', label: '#60a5fa' },
  SELECTED: { bg: '#7f1d1d', border: '#ef4444', label: '#ef4444' },
  HELD: { bg: '#3b2f1a', border: '#d97706', label: '#f59e0b' },
  BOOKED: { bg: '#1c1c1c', border: '#444444', label: '#555555' },
  DISABLED: { bg: '#111111', border: '#222222', label: '#333333' },
};

const SEAT_TYPE_LABELS = {
  RECLINER: { label: 'Recliner', color: '#a855f7' },
  VIP: { label: 'VIP', color: '#f59e0b' },
  PREMIUM: { label: 'Premium', color: '#06b6d4' },
  REGULAR: { label: 'Regular', color: '#6b7280' },
};

export default function SeatSelectionPage() {
  const { showId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [show, setShow] = useState(null);
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [holdLoading, setHoldLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState([]);
  const [holdExpiry, setHoldExpiry] = useState(null);
  const [countdown, setCountdown] = useState('');

  const fetchSeats = useCallback(async () => {
    try {
      const res = await api.get(`/shows/${showId}/seats`);
      if (res.data?.success) {
        const data = res.data.data;
        setShow(data);
        setSeats(data.seats || []);
      }
    } catch (err) {
      console.error('Fetch seats error:', err);
      setError('Failed to load seat map. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [showId]);

  useEffect(() => { fetchSeats(); }, [fetchSeats]);

  // Countdown Timer
  useEffect(() => {
    if (!holdExpiry) return;
    const interval = setInterval(() => {
      const diff = new Date(holdExpiry) - new Date();
      if (diff <= 0) {
        setCountdown('Hold expired');
        setSelected([]);
        setHoldExpiry(null);
        fetchSeats();
        clearInterval(interval);
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setCountdown(`${mins}:${secs.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [holdExpiry, fetchSeats]);

  const toggleSeat = (seat) => {
    if (seat.status === 'BOOKED' || seat.status === 'DISABLED') return;
    if (seat.status === 'HELD' && !selected.includes(seat.seatId)) return;

    setSelected(prev =>
      prev.includes(seat.seatId) ? prev.filter(s => s !== seat.seatId) : [...prev, seat.seatId]
    );
  };

  const holdSeats = async () => {
    if (!user) { navigate('/login'); return; }
    if (selected.length === 0) { setError('Please select at least one seat.'); return; }
    setHoldLoading(true);
    setError('');
    try {
      const res = await api.post(`/shows/${showId}/seats/hold`, { seatIds: selected });
      if (res.data?.success) {
        setHoldExpiry(res.data.data.holdExpiresAt);
        await fetchSeats();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to hold seats. Please try again.');
      setSelected([]);
    } finally {
      setHoldLoading(false);
    }
  };

  const proceedToCheckout = async () => {
    if (selected.length === 0) { setError('Please select at least one seat.'); return; }
    if (!user) { navigate('/login'); return; }

    setHoldLoading(true);
    setError('');
    try {
      if (!holdExpiry) {
        const holdRes = await api.post(`/shows/${showId}/seats/hold`, { seatIds: selected });
        if (holdRes.data?.success) {
          setHoldExpiry(holdRes.data.data.holdExpiresAt);
        }
      }

      const res = await api.post('/bookings', {
        bookingType: 'MOVIE',
        showId,
        seatIds: selected,
      });
      if (res.data?.success) {
        const bookingId = res.data.data._id;
        navigate('/booking/checkout', { state: { bookingId, show, selected } });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reserve seats. Please try again.');
    } finally {
      setHoldLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading seat map..." />;
  if (error && !seats.length) return (
    <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-secondary)' }}>
      <p>{error}</p>
    </div>
  );

  // Group seats by row
  const seatsByRow = seats.reduce((acc, seat) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    acc[seat.row].push(seat);
    return acc;
  }, {});

  const selectedSeatObjects = seats.filter(s => selected.includes(s.seatId));
  const subtotal = selectedSeatObjects.reduce((sum, s) => sum + (s.price || 0), 0);
  const convenienceFee = selected.length > 0 ? 30 : 0;
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + convenienceFee + gst;

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* Header Info */}
      <div style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', padding: '20px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.3rem' }}>{show?.movie?.title}</h2>
              <div style={{ display: 'flex', gap: '16px', marginTop: '6px', color: 'var(--text-secondary)', fontSize: '0.88rem', flexWrap: 'wrap' }}>
                <span>{show?.venue?.name}</span>
                <span>•</span>
                <span>{show?.showDate && new Date(show.showDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                <span>•</span>
                <span>{show?.startTime}</span>
                <span>•</span>
                <span>{show?.format}</span>
              </div>
            </div>

            {/* Hold Timer */}
            {holdExpiry && countdown && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 16px', borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)'
              }}>
                <Timer size={16} color="#ef4444" />
                <span style={{ color: '#ef4444', fontWeight: '700', fontFamily: 'monospace', fontSize: '1rem' }}>
                  {countdown}
                </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Hold Remaining</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '24px', paddingBottom: selected.length > 0 ? '100px' : '60px' }}>
        <div className="responsive-two-col">

          {/* Seat Map */}
          <div>
            {/* Screen Indicator */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                display: 'inline-block', width: '70%', height: '6px',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                borderRadius: '3px', marginBottom: '8px'
              }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                ★ All Eyes This Way ★ Screen
              </p>
            </div>

            {/* Mobile Swipe Hint */}
            <div className="show-on-mobile hide-on-desktop" style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '14px', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <span>👆 Scroll horizontally to view all seats</span>
            </div>

            {/* Seat Grid */}
            <div className="scroll-touch-x" style={{ paddingBottom: '12px' }}>
              <div style={{ minWidth: 'fit-content', margin: '0 auto' }}>
                {Object.entries(seatsByRow).map(([row, rowSeats]) => (
                  <div key={row} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', justifyContent: 'center' }}>
                    {/* Row Label */}
                    <span style={{ width: '20px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '700', textAlign: 'right', flexShrink: 0 }}>
                      {row}
                    </span>

                    {rowSeats.map(seat => {
                      const isSelected = selected.includes(seat.seatId);
                      const effectiveStatus = isSelected ? 'SELECTED' : seat.status;
                      const colors = SEAT_COLORS[effectiveStatus] || SEAT_COLORS.AVAILABLE;
                      const isClickable = seat.status === 'AVAILABLE' || isSelected;

                      return (
                        <button
                          key={seat.seatId}
                          onClick={() => toggleSeat(seat)}
                          disabled={!isClickable}
                          title={`${seat.seatId} - ${seat.seatType} - ₹${seat.price}`}
                          style={{
                            width: '32px', height: '28px', borderRadius: '4px 4px 2px 2px',
                            backgroundColor: colors.bg,
                            border: `2px solid ${colors.border}`,
                            cursor: isClickable ? 'pointer' : 'not-allowed',
                            transition: 'all 0.15s ease',
                            fontSize: '0.6rem', color: colors.label, fontWeight: '600',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          {seat.number}
                        </button>
                      );
                    })}

                    {/* Row Label Right */}
                    <span style={{ width: '20px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '700', flexShrink: 0 }}>
                      {row}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '32px', flexWrap: 'wrap' }}>
              {[
                { status: 'AVAILABLE', label: 'Available' },
                { status: 'SELECTED', label: 'Selected' },
                { status: 'HELD', label: 'Held' },
                { status: 'BOOKED', label: 'Booked' },
              ].map(({ status, label }) => (
                <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <div style={{
                    width: '20px', height: '16px', borderRadius: '3px',
                    backgroundColor: SEAT_COLORS[status].bg,
                    border: `2px solid ${SEAT_COLORS[status].border}`
                  }} />
                  {label}
                </div>
              ))}
            </div>

            {/* Seat Type Legend */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '16px', flexWrap: 'wrap' }}>
              {Object.entries(SEAT_TYPE_LABELS).map(([type, info]) => (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: info.color }} />
                  <span style={{ color: 'var(--text-muted)' }}>{info.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar: Order Summary */}
          <div style={{ position: 'sticky', top: '90px', alignSelf: 'start' }}>
            <div className="glass-card">
              <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '16px' }}>Your Booking</h3>

              {selected.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                  <Armchair size={36} style={{ margin: '0 auto 10px' }} />
                  <p style={{ fontSize: '0.88rem' }}>Select seats to begin</p>
                </div>
              ) : (
                <>
                  {/* Selected Seats */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Selected Seats ({selected.length})
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {selected.map(seatId => {
                        const seatObj = seats.find(s => s.seatId === seatId);
                        return (
                          <span key={seatId} style={{
                            padding: '4px 10px', backgroundColor: 'rgba(229,9,20,0.2)',
                            border: '1px solid var(--accent-red)', borderRadius: '4px',
                            color: 'var(--accent-red)', fontSize: '0.82rem', fontWeight: '700'
                          }}>
                            {seatId} {seatObj && <span style={{ opacity: 0.7, fontWeight: 400 }}>₹{seatObj.price}</span>}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginBottom: '16px' }}>
                    {[
                      { label: 'Subtotal', value: `₹${subtotal}` },
                      { label: 'Convenience Fee', value: `₹${convenienceFee}` },
                      { label: 'GST (18%)', value: `₹${gst}` },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                        <span>{label}</span>
                        <span>{value}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '1.2rem', color: '#fff', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                      <span>Total</span>
                      <span>₹{total}</span>
                    </div>
                  </div>
                </>
              )}

              {error && <p style={{ color: 'var(--accent-red)', fontSize: '0.82rem', textAlign: 'center', marginBottom: '12px' }}>{error}</p>}

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={proceedToCheckout}
                  disabled={selected.length === 0 || holdLoading}
                  className="btn-primary"
                  style={{
                    width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    opacity: selected.length === 0 ? 0.5 : 1,
                    cursor: selected.length === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  {holdLoading ? 'Reserving...' : `Book ${selected.length > 0 ? selected.length : ''} Seat${selected.length !== 1 ? 's' : ''}`}
                  <ChevronRight size={18} />
                </button>

                {!holdExpiry && (
                  <button
                    onClick={holdSeats}
                    disabled={selected.length === 0 || holdLoading}
                    className="btn-outline"
                    style={{
                      width: '100%', padding: '10px', fontSize: '0.85rem',
                      opacity: selected.length === 0 ? 0.5 : 1,
                      cursor: selected.length === 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Hold Seats for 10 Mins
                  </button>
                )}
              </div>

              {holdExpiry && (
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '10px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <Info size={12} /> Seats held for {countdown}. Complete payment to confirm.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Mobile Action Bar */}
      {selected.length > 0 && (
        <div className="show-on-mobile hide-on-desktop" style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(18, 18, 18, 0.96)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid var(--border-color)',
          padding: '12px 16px',
          zIndex: 1000,
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.6)'
        }}>
          <div>
            <div style={{ color: '#fff', fontWeight: '800', fontSize: '1.15rem' }}>
              ₹{total}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
              {selected.length} seat{selected.length > 1 ? 's' : ''} ({selected.join(', ')})
            </div>
          </div>
          <button
            onClick={proceedToCheckout}
            disabled={holdLoading}
            className="btn-primary"
            style={{ padding: '10px 20px', fontSize: '0.92rem', gap: '6px' }}
          >
            {holdLoading ? 'Reserving...' : 'Continue'}
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
