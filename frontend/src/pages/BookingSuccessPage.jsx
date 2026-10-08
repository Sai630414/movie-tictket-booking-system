import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, Ticket, Printer, Home, CalendarDays, Clock3, MapPin, Download } from 'lucide-react';

const dateLabel = (value) => value
  ? new Date(value).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
  : 'Date to be confirmed';

export default function BookingSuccessPage() {
  const location = useLocation();
  const booking = location.state?.booking;
  const [printing, setPrinting] = useState(true);

  useEffect(() => {
    if (!booking) return undefined;
    const timer = window.setTimeout(() => setPrinting(false), 2400);
    return () => window.clearTimeout(timer);
  }, [booking]);

  if (!booking) {
    return (
      <main className="cv-ticket-page">
        <div className="container cv-ticket-empty">
          <CheckCircle size={52} color="#22c55e" />
          <h1>Payment complete</h1>
          <p>Your ticket is available in My Bookings.</p>
          <Link to="/bookings" className="btn-primary">My Bookings</Link>
        </div>
      </main>
    );
  }

  const title = booking.movie?.title || booking.event?.name || 'CineVerse Ticket';
  const showDate = booking.bookingType === 'EVENT' ? booking.event?.date : booking.show?.showDate;
  const showTime = booking.bookingType === 'EVENT' ? booking.event?.startTime : booking.show?.startTime;
  const seats = booking.seats?.map(seat => seat.seatId).filter(Boolean) || [];
  const ticketLabels = booking.ticketItems?.map(item => `${item.categoryName} × ${item.quantity}`) || [];
  const reservation = seats.length ? seats.join(', ') : ticketLabels.join(' · ');

  return (
    <main className="cv-ticket-page">
      <div className="cv-ticket-glow" aria-hidden="true" />
      <div className="container cv-ticket-container">
        <header className="cv-payment-success" aria-live="polite">
          <div className="cv-success-icon"><CheckCircle size={34} /></div>
          <p className="cv-success-eyebrow">CINEVERSE · PAYMENT SUCCESSFUL</p>
          <h1>{printing ? 'Your ticket is printing…' : 'Your night at the movies is set.'}</h1>
          <p>Payment verified. Your booking is confirmed and the ticket is ready.</p>
        </header>

        <section className={`cv-printer ${printing ? 'is-printing' : 'is-finished'}`} aria-label={printing ? 'Printing your ticket' : 'Your digital ticket'}>
          <div className="cv-printer-ticket-slot" aria-hidden="true" />
          <div className="cv-printer-face">
            <div className="cv-printer-brand"><span className="cv-printer-light" /> CINEVERSE TICKET PRINTER</div>
            <div className="cv-printer-display"><Ticket size={19} /><span>{printing ? 'PRINTING YOUR EXPERIENCE' : 'TICKET READY · ENJOY THE SHOW'}</span></div>
            <div className="cv-printer-output" aria-hidden="true"><span /></div>
          </div>

          <article className="cv-ticket-paper" aria-label={`${title} digital ticket`}>
            <div className="cv-ticket-topline">
              <div className="cv-ticket-logo"><span>▶</span><strong>CINEVERSE</strong></div>
              <span className="cv-ticket-paid">PAID</span>
            </div>
            <p className="cv-ticket-kicker">YOUR CINEMA EXPERIENCE</p>
            <h2>{title}</h2>
            <div className="cv-ticket-venue"><MapPin size={15} /><span>{booking.venue?.name || 'Venue'} · {booking.venue?.city || booking.event?.city || 'Andhra Pradesh'}</span></div>
            <div className="cv-ticket-rule" />
            <div className="cv-ticket-facts">
              <div><span><CalendarDays size={13} /> DATE</span><strong>{dateLabel(showDate)}</strong></div>
              <div><span><Clock3 size={13} /> SHOW TIME</span><strong>{showTime || 'Time to be confirmed'}</strong></div>
              {booking.show?.screen?.name && <div><span>SCREEN</span><strong>{booking.show.screen.name}</strong></div>}
              <div><span>{seats.length ? 'SEATS' : 'TICKETS'}</span><strong>{reservation || 'See booking details'}</strong></div>
            </div>
            <div className="cv-ticket-rule" />
            <div className="cv-ticket-meta">
              <div><span>BOOKING ID</span><strong>{booking.bookingId}</strong></div>
              <div><span>PAYMENT REFERENCE</span><strong>{booking.razorpayPaymentId || 'Verified by Razorpay'}</strong></div>
            </div>
            <div className="cv-ticket-bottom">
              <div>
                <span className="cv-ticket-total-label">TOTAL PAID</span>
                <strong className="cv-ticket-total">₹{Number(booking.totalAmount || 0).toLocaleString('en-IN')}</strong>
              </div>
              {booking.qrCode ? <img className="cv-ticket-qr" src={booking.qrCode} alt="Secure CineVerse ticket QR code" /> : <div className="cv-ticket-qr-placeholder" aria-label="Ticket QR code is being generated" />}
            </div>
            <p className="cv-ticket-footnote">This QR code contains a secure ticket identifier. Keep it ready at the venue entrance.</p>
          </article>
          <div className="cv-printer-base" aria-hidden="true"><span /><span /><span /></div>
        </section>

        <nav className="cv-ticket-actions" aria-label="Ticket actions">
          <Link to={`/bookings/${booking._id || booking.bookingId}`} className="btn-primary"><Ticket size={17} /> View Ticket</Link>
          <button type="button" className="btn-outline" onClick={() => window.print()}><Download size={17} /> Download Ticket</button>
          <Link to="/" className="btn-outline"><Home size={17} /> Back to Home</Link>
          <Link to="/bookings" className="btn-outline">My Bookings</Link>
        </nav>
      </div>
    </main>
  );
}
