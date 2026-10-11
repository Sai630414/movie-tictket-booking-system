import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, CheckCircle, Clock3, Film, MapPin, Ticket, XCircle, AlertCircle } from 'lucide-react';
import api from '../services/api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const TABS = [
  { key: '', label: 'All bookings' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Past' },
  { key: 'cancelled', label: 'Cancelled' },
];

const STATUS = {
  CONFIRMED: { icon: CheckCircle, tone: 'confirmed', label: 'Confirmed' },
  PENDING: { icon: AlertCircle, tone: 'pending', label: 'Payment pending' },
  CANCELLED: { icon: XCircle, tone: 'cancelled', label: 'Cancelled' },
  COMPLETED: { icon: CheckCircle, tone: 'completed', label: 'Completed' },
};

const money = value => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0,
}).format(Number(value) || 0);

const dateLabel = value => value
  ? new Date(value).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  : null;

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');

  const fetchBookings = async (tab = '') => {
    setLoading(true);
    try {
      const query = tab ? `?statusTab=${tab}` : '';
      const res = await api.get(`/bookings${query}`);
      if (res.data?.success) setBookings(res.data.data || []);
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

  return (
    <main className="my-bookings-page" style={{ backgroundColor: 'transparent' }}>
      <header className="my-bookings-header">
        <div className="container">
          <div className="my-bookings-heading">
            <div className="my-bookings-heading-icon"><Ticket size={23} /></div>
            <div>
              <span className="my-bookings-eyebrow">YOUR CINEVERSE</span>
              <h1>My Bookings</h1>
              <p>Your tickets and upcoming plans, all in one place.</p>
            </div>
            {!loading && user && <span className="my-bookings-count">{bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'}</span>}
          </div>

          {user && (
            <nav className="booking-tabs scroll-touch-x" aria-label="Filter bookings" role="tablist">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.key}
                  className={`booking-tab${activeTab === tab.key ? ' is-active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          )}
        </div>
      </header>

      <section className="container my-bookings-content">
        {!user ? (
          <div className="booking-empty-state">
            <div className="booking-empty-icon"><Ticket size={28} /></div>
            <h2>Sign in to see your tickets</h2>
            <p>Your booking history will be waiting here.</p>
            <Link to="/login" className="btn-primary">Sign in</Link>
          </div>
        ) : loading ? (
          <LoadingSpinner message="Loading bookings..." />
        ) : bookings.length === 0 ? (
          <div className="booking-empty-state">
            <div className="booking-empty-icon"><Film size={28} /></div>
            <h2>No bookings in this view</h2>
            <p>Pick a movie or event and your tickets will show up here.</p>
            <Link to="/movies" className="btn-primary">Explore movies</Link>
          </div>
        ) : (
          <div className="booking-list">
            {bookings.map(booking => {
              const status = STATUS[booking.bookingStatus] || STATUS.PENDING;
              const StatusIcon = status.icon;
              const isEvent = booking.bookingType === 'EVENT';
              const title = booking.movie?.title || booking.event?.name || 'Booking';
              const poster = booking.movie?.poster || booking.event?.poster || booking.event?.banner;
              const venueName = booking.venue?.name || booking.event?.location;
              const showDate = booking.show?.showDate || booking.event?.date;
              const showTime = booking.show?.startTime || booking.event?.startTime;
              const tickets = booking.ticketItems || [];

              return (
                <article className="booking-card" key={booking._id}>
                  <div className="booking-card-poster">
                    {poster
                      ? <img src={poster} alt={`${title} poster`} loading="lazy" onError={event => { event.currentTarget.style.display = 'none'; }} />
                      : <Film size={30} aria-hidden="true" />}
                    <span>{isEvent ? 'EVENT' : 'MOVIE'}</span>
                  </div>

                  <div className="booking-card-main">
                    <div className="booking-card-title-row">
                      <h2>{title}</h2>
                      <span className={`booking-status booking-status-${status.tone}`}>
                        <StatusIcon size={14} /> {status.label}
                      </span>
                    </div>

                    <div className="booking-card-meta">
                      {venueName && <span><MapPin size={15} />{venueName}</span>}
                      {showDate && <span><Calendar size={15} />{dateLabel(showDate)}</span>}
                      {showTime && <span><Clock3 size={15} />{showTime}</span>}
                    </div>

                    {booking.seats?.length > 0 && (
                      <div className="booking-ticket-summary">
                        <span className="booking-summary-label">SEATS</span>
                        <div className="booking-seat-list">
                          {booking.seats.map(seat => <span key={seat.seatId}>{seat.seatId}</span>)}
                        </div>
                      </div>
                    )}
                    {tickets.length > 0 && (
                      <div className="booking-ticket-summary">
                        <span className="booking-summary-label">TICKETS</span>
                        <span className="booking-ticket-count">{tickets.map(item => `${item.categoryName} x ${item.quantity}`).join(' · ')}</span>
                      </div>
                    )}
                  </div>

                  <aside className="booking-card-aside">
                    <div className="booking-order-number">BOOKING ID <strong>#{booking.bookingId}</strong></div>
                    <div className="booking-total-label">TOTAL PAID</div>
                    <div className="booking-total">{money(booking.totalAmount)}</div>
                    <div className="booking-card-actions">
                      <Link className="booking-action-primary" to={`/bookings/${booking._id}`}>
                        View ticket <ArrowRight size={15} />
                      </Link>
                      {booking.bookingStatus === 'CONFIRMED' && (
                        <Link className="booking-action-secondary" to={`/bookings/${booking._id}/cancel`}>Cancel booking</Link>
                      )}
                    </div>
                  </aside>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
