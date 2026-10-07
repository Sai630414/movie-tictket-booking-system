import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Tag, Ticket, Plus, Minus, CheckCircle } from 'lucide-react';
import api from '../services/api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function EventDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTickets, setSelectedTickets] = useState({});
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await api.get(`/events/slug/${slug}`);
        if (res.data?.success) {
          setEvent(res.data.data);
          const init = {};
          res.data.data.ticketCategories?.forEach(cat => { init[cat.name] = 0; });
          setSelectedTickets(init);
        }
      } catch (err) {
        console.error('Fetch event detail error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [slug]);

  const adjustQuantity = (catName, delta) => {
    const cat = event.ticketCategories.find(c => c.name === catName);
    const currentQty = selectedTickets[catName] || 0;
    const newQty = Math.max(0, Math.min(currentQty + delta, cat?.availableQuantity || 0, 10));
    setSelectedTickets(prev => ({ ...prev, [catName]: newQty }));
  };

  const totalItems = Object.values(selectedTickets).reduce((s, q) => s + q, 0);
  const subtotal = event?.ticketCategories?.reduce((sum, cat) => sum + (selectedTickets[cat.name] || 0) * cat.price, 0) || 0;
  const convenienceFee = totalItems > 0 ? 30 : 0;
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + convenienceFee + gst;

  const handleBookNow = async () => {
    if (!user) { navigate('/login'); return; }
    setError('');
    const ticketItems = Object.entries(selectedTickets)
      .filter(([, qty]) => qty > 0)
      .map(([categoryName, quantity]) => ({ categoryName, quantity }));

    if (ticketItems.length === 0) { setError('Please select at least one ticket.'); return; }

    setBookingLoading(true);
    try {
      const res = await api.post('/bookings', {
        bookingType: 'EVENT',
        eventId: event._id,
        ticketItems,
      });

      if (res.data?.success) {
        const bookingId = res.data.data._id;
        navigate('/booking/checkout', { state: { bookingId, event, selectedTickets, total } });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading event..." />;
  if (!event) return (
    <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-secondary)' }}>
      <h2>Event not found</h2>
      <Link to="/events" className="btn-primary" style={{ display: 'inline-flex', marginTop: '20px' }}>Browse Events</Link>
    </div>
  );

  const eventDate = new Date(event.date);

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* Banner Hero */}
      <div style={{ position: 'relative', height: '400px', overflow: 'hidden' }}>
        <img src={event.banner || event.poster} alt={event.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, #141414 100%)' }} />

        <div className="container" style={{ position: 'absolute', bottom: '40px', left: 0, right: 0 }}>
          <span style={{
            display: 'inline-block', padding: '4px 12px', backgroundColor: 'var(--accent-red)',
            color: '#fff', borderRadius: '4px', fontSize: '0.78rem', fontWeight: '700',
            textTransform: 'uppercase', marginBottom: '12px'
          }}>{event.category}</span>
          <h1 style={{ fontSize: '2.5rem', color: '#fff', lineHeight: 1.1 }}>{event.name}</h1>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '32px', paddingBottom: '60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '40px' }}>

          {/* Left: Event Details */}
          <div>
            {/* Event Meta */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
                <Calendar size={18} color="var(--accent-red)" />
                <div>
                  <div style={{ color: '#fff', fontWeight: '600' }}>
                    {eventDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
                <Clock size={18} color="var(--accent-red)" />
                <div>
                  <div style={{ color: '#fff', fontWeight: '600' }}>{event.startTime} {event.endTime && `- ${event.endTime}`}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
                <MapPin size={18} color="var(--accent-red)" />
                <div>
                  <div style={{ color: '#fff', fontWeight: '600' }}>{event.venue?.name || event.location}</div>
                  <div style={{ fontSize: '0.82rem' }}>{event.venue?.address || event.city}</div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '12px' }}>About the Event</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.95rem' }}>{event.description}</p>
            </div>

            {event.organizer && (
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Organized by</span>
                <p style={{ color: '#fff', fontWeight: '600', marginTop: '4px' }}>{event.organizer}</p>
              </div>
            )}
          </div>

          {/* Right: Ticket Selection */}
          <div>
            <div className="glass-card" style={{ position: 'sticky', top: '90px' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Ticket size={20} color="var(--accent-red)" /> Select Tickets
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                {event.ticketCategories?.map(cat => (
                  <div key={cat.name} style={{
                    padding: '16px', backgroundColor: 'var(--bg-card)',
                    border: '1px solid', borderColor: (selectedTickets[cat.name] || 0) > 0 ? 'var(--accent-red)' : 'var(--border-color)',
                    borderRadius: '10px', transition: 'border-color 0.2s'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <div style={{ color: '#fff', fontWeight: '700', fontSize: '1rem' }}>{cat.name}</div>
                        <div style={{ color: 'var(--accent-gold)', fontSize: '1.1rem', fontWeight: '800', marginTop: '2px' }}>₹{cat.price}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '2px' }}>
                          {cat.availableQuantity} available
                        </div>
                      </div>

                      {/* Qty Controls */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                          onClick={() => adjustQuantity(cat.name, -1)}
                          disabled={(selectedTickets[cat.name] || 0) === 0}
                          style={{
                            width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backgroundColor: (selectedTickets[cat.name] || 0) === 0 ? 'var(--bg-hover)' : 'rgba(229,9,20,0.2)',
                            border: '1px solid var(--border-color)', color: '#fff',
                            cursor: (selectedTickets[cat.name] || 0) === 0 ? 'not-allowed' : 'pointer',
                            opacity: (selectedTickets[cat.name] || 0) === 0 ? 0.4 : 1
                          }}
                        >
                          <Minus size={14} />
                        </button>
                        <span style={{ color: '#fff', fontWeight: '700', minWidth: '20px', textAlign: 'center', fontSize: '1.1rem' }}>
                          {selectedTickets[cat.name] || 0}
                        </span>
                        <button
                          onClick={() => adjustQuantity(cat.name, 1)}
                          disabled={(selectedTickets[cat.name] || 0) >= Math.min(cat.availableQuantity, 10)}
                          style={{
                            width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backgroundColor: 'rgba(229,9,20,0.2)', border: '1px solid var(--accent-red)', color: 'var(--accent-red)',
                            cursor: (selectedTickets[cat.name] || 0) >= Math.min(cat.availableQuantity, 10) ? 'not-allowed' : 'pointer',
                            opacity: (selectedTickets[cat.name] || 0) >= Math.min(cat.availableQuantity, 10) ? 0.4 : 1
                          }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Summary */}
              {totalItems > 0 && (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                    <span>Subtotal ({totalItems} ticket{totalItems > 1 ? 's' : ''})</span>
                    <span>₹{subtotal}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                    <span>Convenience Fee</span>
                    <span>₹{convenienceFee}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                    <span>GST (18%)</span>
                    <span>₹{gst}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '1.2rem', color: '#fff' }}>
                    <span>Total</span>
                    <span>₹{total}</span>
                  </div>
                </div>
              )}

              {error && (
                <p style={{ color: 'var(--accent-red)', fontSize: '0.85rem', marginBottom: '12px', textAlign: 'center' }}>{error}</p>
              )}

              <button
                onClick={handleBookNow}
                disabled={totalItems === 0 || bookingLoading}
                className="btn-primary"
                style={{
                  width: '100%', padding: '14px', fontSize: '1rem',
                  opacity: totalItems === 0 ? 0.5 : 1,
                  cursor: totalItems === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                {bookingLoading ? 'Processing...' : `Book Now${totalItems > 0 ? ` (${totalItems} ticket${totalItems > 1 ? 's' : ''})` : ''}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
