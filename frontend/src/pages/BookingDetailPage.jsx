import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Calendar, Clock, QrCode, CheckCircle, XCircle } from 'lucide-react';
import api from '../services/api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

export default function BookingDetailPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await api.get(`/bookings/${id}`);
        if (res.data?.success) setBooking(res.data.data);
      } catch (err) {
        console.error('Fetch booking detail error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  if (loading) return <LoadingSpinner message="Loading ticket..." />;
  if (!booking) return (
    <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-secondary)' }}>
      <h2>Ticket not found</h2>
      <Link to="/bookings" className="btn-primary" style={{ display: 'inline-flex', marginTop: '20px' }}>My Bookings</Link>
    </div>
  );

  const isConfirmed = booking.bookingStatus === 'CONFIRMED';

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh', padding: '40px 0' }}>
      <div className="container" style={{ maxWidth: '600px' }}>
        <Link to="/bookings" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '24px' }}>
          ← Back to My Bookings
        </Link>

        {/* Ticket Card */}
        <div style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #222222 100%)',
          border: `1px solid ${isConfirmed ? 'rgba(34, 197, 94, 0.3)' : 'var(--border-color)'}`,
          borderRadius: '20px', overflow: 'hidden',
          boxShadow: `0 20px 60px rgba(0,0,0,0.6)${isConfirmed ? ', 0 0 30px rgba(34, 197, 94, 0.1)' : ''}`
        }}>
          {/* Header */}
          <div style={{
            background: isConfirmed ? 'linear-gradient(135deg, #166534, #15803d)' : 'linear-gradient(135deg, #7f1d1d, #991b1b)',
            padding: '20px 24px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>CineVerse Ticket</div>
              <div style={{ color: '#fff', fontWeight: '800', fontSize: '1.1rem', marginTop: '4px' }}>#{booking.bookingId}</div>
            </div>
            {isConfirmed
              ? <CheckCircle size={32} color="#86efac" />
              : <XCircle size={32} color="#fca5a5" />}
          </div>

          <div style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '20px' }}>
              {booking.movie?.title || booking.event?.name}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              {booking.venue && (
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: '4px' }}>Venue</div>
                  <div style={{ color: '#fff', fontSize: '0.9rem' }}>📍 {booking.venue?.name}</div>
                </div>
              )}
              {(booking.show?.showDate || booking.event?.date) && (
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: '4px' }}>Date</div>
                  <div style={{ color: '#fff', fontSize: '0.9rem' }}>
                    📅 {new Date(booking.show?.showDate || booking.event?.date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              )}
              {booking.show?.startTime && (
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: '4px' }}>Time</div>
                  <div style={{ color: '#fff', fontSize: '0.9rem' }}>🕐 {booking.show.startTime}</div>
                </div>
              )}
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: '4px' }}>Amount Paid</div>
                <div style={{ color: 'var(--accent-gold)', fontWeight: '800', fontSize: '1.1rem' }}>₹{booking.totalAmount}</div>
              </div>
            </div>

            {/* Seats */}
            {booking.seats?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: '8px' }}>Seats</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {booking.seats.map(s => (
                    <span key={s.seatId} style={{
                      padding: '6px 14px', backgroundColor: 'rgba(229,9,20,0.15)',
                      border: '1px solid rgba(229,9,20,0.4)', borderRadius: '6px',
                      color: 'var(--accent-red)', fontWeight: '700', fontSize: '0.9rem'
                    }}>
                      {s.seatId} <span style={{ opacity: 0.7, fontSize: '0.75rem' }}>({s.seatType})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {booking.ticketItems?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: '8px' }}>Tickets</div>
                {booking.ticketItems.map(item => (
                  <div key={item.categoryName} style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', marginBottom: '6px', fontSize: '0.9rem' }}>
                    <span>{item.categoryName} × {item.quantity}</span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Separator */}
            <div style={{ borderTop: '2px dashed rgba(255,255,255,0.1)', margin: '16px -24px', padding: '16px 24px 0' }} />

            {/* QR Code */}
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Show this QR code at the venue entrance
              </p>
              {booking.qrCode ? (
                <img
                  src={booking.qrCode}
                  alt="Booking QR Code"
                  style={{ width: '180px', height: '180px', border: '8px solid #fff', borderRadius: '12px', backgroundColor: '#fff' }}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <QrCode size={80} color="var(--text-muted)" />
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Payment pending — QR code will appear after confirmation</p>
                </div>
              )}
              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => window.print()}
                  className="btn-outline"
                  style={{ flex: 1, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.88rem' }}
                >
                  🖨️ Print Ticket
                </button>
                {isConfirmed && (
                  <button
                    onClick={async () => {
                      if (!window.confirm('Cancel this booking?')) return;
                      try {
                        const res = await api.post(`/bookings/${booking._id}/cancel`);
                        if (res.data?.success) {
                          setBooking(res.data.data);
                        }
                      } catch (err) {
                        alert(err.response?.data?.message || 'Cannot cancel booking.');
                      }
                    }}
                    style={{
                      flex: 1, padding: '10px 16px', borderRadius: '8px',
                      backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                      color: '#ef4444', fontSize: '0.88rem', fontWeight: '600', cursor: 'pointer'
                    }}
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
