import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, Ticket, Download, QrCode, MapPin, Calendar, Clock } from 'lucide-react';

export default function BookingSuccessPage() {
  const location = useLocation();
  const booking = location.state?.booking;

  if (!booking) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-secondary)' }}>
        <h2 style={{ color: '#fff', marginBottom: '12px' }}>Booking Confirmed!</h2>
        <p>Check your bookings for details.</p>
        <Link to="/bookings" className="btn-primary" style={{ display: 'inline-flex', marginTop: '20px' }}>My Bookings</Link>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh', padding: '60px 0' }}>
      <div className="container" style={{ maxWidth: '600px' }}>
        {/* Success Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            backgroundColor: 'rgba(34, 197, 94, 0.15)',
            border: '2px solid rgba(34, 197, 94, 0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <CheckCircle size={44} color="#22c55e" />
          </div>
          <h1 style={{ fontSize: '2.2rem', color: '#fff', marginBottom: '8px' }}>Booking Confirmed!</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Your tickets are booked successfully. We've sent the confirmation details to your email.
          </p>
        </div>

        {/* Digital Ticket Card */}
        <div style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #222222 100%)',
          border: '1px solid var(--border-color)',
          borderRadius: '20px',
          overflow: 'hidden',
          marginBottom: '24px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)'
        }}>
          {/* Ticket Header */}
          <div style={{
            background: 'linear-gradient(135deg, var(--accent-red) 0%, #b20710 100%)',
            padding: '20px 24px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>CineVerse Digital Ticket</div>
              <div style={{ color: '#fff', fontWeight: '800', fontSize: '1.1rem' }}>#{booking.bookingId}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Ticket size={28} color="#fff" />
            </div>
          </div>

          {/* Dashed Separator */}
          <div style={{ borderTop: '2px dashed rgba(255,255,255,0.1)', margin: '0 24px' }} />

          <div style={{ padding: '24px' }}>
            {/* Movie/Event Name */}
            <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '16px' }}>
              {booking.movie?.title || booking.event?.name}
            </h2>

            {/* Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              {booking.venue && (
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px' }}>Venue</div>
                  <div style={{ color: '#fff', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <MapPin size={13} color="var(--accent-red)" />
                    {booking.venue?.name}
                  </div>
                </div>
              )}
              {booking.show?.showDate && (
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px' }}>Date</div>
                  <div style={{ color: '#fff', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar size={13} color="var(--accent-red)" />
                    {new Date(booking.show.showDate).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              )}
              {booking.show?.startTime && (
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px' }}>Show Time</div>
                  <div style={{ color: '#fff', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={13} color="var(--accent-red)" />
                    {booking.show.startTime}
                  </div>
                </div>
              )}
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px' }}>Amount Paid</div>
                <div style={{ color: 'var(--accent-gold)', fontSize: '1rem', fontWeight: '800' }}>₹{booking.totalAmount}</div>
              </div>
            </div>

            {/* Seats */}
            {booking.seats?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '8px' }}>Seats</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {booking.seats.map(s => (
                    <span key={s.seatId} style={{
                      padding: '5px 12px', backgroundColor: 'rgba(229,9,20,0.15)',
                      border: '1px solid rgba(229,9,20,0.4)', borderRadius: '6px',
                      color: 'var(--accent-red)', fontWeight: '700', fontSize: '0.9rem'
                    }}>{s.seatId}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Tickets */}
            {booking.ticketItems?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '8px' }}>Tickets</div>
                {booking.ticketItems.map(item => (
                  <div key={item.categoryName} style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', marginBottom: '4px', fontSize: '0.9rem' }}>
                    <span>{item.categoryName} × {item.quantity}</span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Dashed separator before QR */}
            <div style={{ borderTop: '2px dashed rgba(255,255,255,0.1)', margin: '16px -24px', padding: '0 24px' }} />

            {/* QR Code */}
            {booking.qrCode ? (
              <div style={{ textAlign: 'center', paddingTop: '16px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Scan QR at Venue</p>
                <img
                  src={booking.qrCode}
                  alt="Booking QR Code"
                  style={{
                    width: '160px', height: '160px',
                    border: '8px solid #fff',
                    borderRadius: '12px',
                    backgroundColor: '#fff'
                  }}
                />
              </div>
            ) : (
              <div style={{ textAlign: 'center', paddingTop: '16px' }}>
                <QrCode size={80} color="var(--text-muted)" style={{ margin: '0 auto' }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '8px' }}>QR Code generating...</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link
            to={`/bookings/${booking._id}`}
            className="btn-primary"
            style={{ flex: 1, justifyContent: 'center', minWidth: '160px' }}
          >
            View Full Ticket
          </Link>
          <Link
            to="/bookings"
            className="btn-outline"
            style={{ flex: 1, justifyContent: 'center', minWidth: '160px', display: 'flex', alignItems: 'center' }}
          >
            My Bookings
          </Link>
        </div>
      </div>
    </div>
  );
}
