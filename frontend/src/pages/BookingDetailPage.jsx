import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Calendar, Clock, QrCode, CheckCircle, XCircle, Mail, MessageSquare, Send, Download } from 'lucide-react';
import api from '../services/api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { downloadElementAsJpg } from '../utils/downloadJpg.js';

export default function BookingDetailPage() {
  const { id, bookingId } = useParams();
  const ticketId = id || bookingId;
  const { user, loading: authLoading } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const ticketRef = useRef(null);
  const [sendingDelivery, setSendingDelivery] = useState(null);
  const [deliveryFeedback, setDeliveryFeedback] = useState('');

  const handleSendTicket = async (channel) => {
    setSendingDelivery(channel);
    setDeliveryFeedback('');
    try {
      const res = await api.post(`/bookings/${booking._id}/send-ticket`, { channels: [channel] });
      if (res.data?.success) {
        const info = res.data.data?.[channel];
        if (info?.previewUrl) {
          setDeliveryFeedback(`Email dispatched! (Preview: ${info.previewUrl})`);
        } else {
          setDeliveryFeedback(`Ticket sent via ${channel.toUpperCase()} successfully!`);
        }
      }
    } catch (err) {
      setDeliveryFeedback(`Failed to send: ${err.response?.data?.message || err.message}`);
    } finally {
      setSendingDelivery(null);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    const fetchBooking = async () => {
      try {
        const res = await api.get(`/bookings/${ticketId}`);
        if (res.data?.success) setBooking(res.data.data);
      } catch (err) {
        console.error('Fetch booking detail error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [ticketId, user, authLoading]);

  if (authLoading || loading) return <LoadingSpinner message="Loading ticket..." />;
  if (!user) return (
    <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-secondary)' }}>
      <h2 style={{ color: '#fff' }}>Sign in to view this ticket</h2>
      <p style={{ marginTop: '8px' }}>Tickets are private to the account that made the booking.</p>
      <Link to="/login" className="btn-primary" style={{ display: 'inline-flex', marginTop: '20px' }}>Sign In</Link>
    </div>
  );
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
          â† Back to My Bookings
        </Link>

        {/* Ticket Card */}
        <div ref={ticketRef} style={{
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
                  <div style={{ color: '#fff', fontSize: '0.9rem' }}>ðŸ“ {booking.venue?.name}</div>
                </div>
              )}
              {(booking.show?.showDate || booking.event?.date) && (
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: '4px' }}>Date</div>
                  <div style={{ color: '#fff', fontSize: '0.9rem' }}>
                    ðŸ“… {new Date(booking.show?.showDate || booking.event?.date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              )}
              {(booking.show?.startTime || booking.event?.startTime) && (
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: '4px' }}>Time</div>
                  <div style={{ color: '#fff', fontSize: '0.9rem' }}>ðŸ• {booking.show?.startTime || booking.event?.startTime}{(booking.show?.endTime || booking.event?.endTime) ? ` – ${booking.show?.endTime || booking.event?.endTime}` : ''}</div>
                </div>
              )}
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: '4px' }}>Amount Paid</div>
                <div style={{ color: 'var(--accent-gold)', fontWeight: '800', fontSize: '1.1rem' }}>â‚¹{booking.totalAmount}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div><div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: '4px' }}>Ticket status</div><div style={{ color: isConfirmed ? '#86efac' : '#fca5a5', fontWeight: '700' }}>{booking.ticketUsedAt ? 'USED' : booking.bookingStatus}</div></div>
              <div><div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: '4px' }}>Payment status</div><div style={{ color: '#fff', fontWeight: '600' }}>{booking.paymentStatus}</div></div>
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
                    <span>{item.categoryName} Ã— {item.quantity}</span>
                    <span>â‚¹{item.price * item.quantity}</span>
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
              {booking.qrCode && isConfirmed && booking.paymentStatus === 'PAID' ? (
                <img
                  src={booking.qrCode}
                  alt="Booking QR Code"
                  style={{ width: '180px', height: '180px', border: '8px solid #fff', borderRadius: '12px', backgroundColor: '#fff' }}
                />
              ) : booking.bookingStatus === 'CANCELLED' || booking.paymentStatus === 'REFUNDED' ? (
                <p style={{ color: 'var(--accent-red)', fontSize: '0.88rem' }}>This ticket is no longer valid.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <QrCode size={80} color="var(--text-muted)" />
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Payment pending â€” QR code will appear after confirmation</p>
                </div>
              )}
              {/* Delivery notification feedback */}
              {deliveryFeedback && (
                <div style={{
                  marginTop: '16px', padding: '10px 14px', borderRadius: '8px',
                  backgroundColor: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)',
                  color: '#86efac', fontSize: '0.85rem', textAlign: 'center', wordBreak: 'break-all'
                }}>
                  {deliveryFeedback}
                </div>
              )}

              {/* Delivery Channels */}
              {isConfirmed && (
                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Deliver Ticket To
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleSendTicket('email')}
                      disabled={sendingDelivery !== null}
                      className="btn-outline"
                      style={{
                        flex: 1, minWidth: '130px', padding: '8px 12px', fontSize: '0.82rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        cursor: sendingDelivery ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <Mail size={14} color="#60a5fa" />
                      {sendingDelivery === 'email' ? 'Sending Email...' : 'Send to Email'}
                    </button>
                    <button
                      onClick={() => handleSendTicket('whatsapp')}
                      disabled={sendingDelivery !== null}
                      className="btn-outline"
                      style={{
                        flex: 1, minWidth: '130px', padding: '8px 12px', fontSize: '0.82rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        cursor: sendingDelivery ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <MessageSquare size={14} color="#22c55e" />
                      {sendingDelivery === 'whatsapp' ? 'Sending WhatsApp...' : 'Send to WhatsApp'}
                    </button>
                    <button
                      onClick={() => handleSendTicket('sms')}
                      disabled={sendingDelivery !== null}
                      className="btn-outline"
                      style={{
                        flex: 1, minWidth: '110px', padding: '8px 12px', fontSize: '0.82rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        cursor: sendingDelivery ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <Send size={14} color="#f59e0b" />
                      {sendingDelivery === 'sms' ? 'Sending SMS...' : 'Send SMS'}
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div data-ticket-download-exclude="true" style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => window.print()}
                  className="btn-outline"
                  style={{ flex: 1, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.88rem' }}
                >
                  ðŸ–¨ï¸ Print Ticket
                </button>
                <button
                  type="button"
                  onClick={() => downloadElementAsJpg(ticketRef.current, `CineVerse-${booking.bookingId || 'ticket'}.jpg`).catch(error => window.alert(error.message))}
                  className="btn-outline"
                  style={{ flex: 1, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.88rem' }}
                >
                  <Download size={16} /> Download JPG
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
