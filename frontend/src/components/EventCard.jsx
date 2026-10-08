import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Ticket } from 'lucide-react';

export default function EventCard({ event }) {
  if (!event) return null;

  const eventDate = new Date(event.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const lowestPrice = event.ticketCategories?.length
    ? Math.min(...event.ticketCategories.map((c) => c.price))
    : 0;

  return (
    <Link
      to={`/events/${event.slug}`}
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        width: '100%',
        minWidth: '240px',
      }}
    >
      <div
        style={{
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.7)';
          e.currentTarget.style.borderColor = 'var(--accent-red)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = 'var(--border-color)';
        }}
      >
        {/* Banner Image */}
        <div style={{ position: 'relative', height: '150px', overflow: 'hidden' }}>
          <img
            src={event.poster || event.banner}
            alt={event.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              backgroundColor: 'var(--accent-red)',
              color: '#ffffff',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Calendar size={12} /> {eventDate}
          </div>

          <div
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              backgroundColor: 'rgba(0,0,0,0.75)',
              color: 'var(--accent-cyan)',
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: '700',
            }}
          >
            {event.category}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
          <div>
            <h3
              style={{
                fontSize: '1rem',
                color: '#ffffff',
                marginBottom: '8px',
                lineHeight: '1.3',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {event.name}
            </h3>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--accent-cyan)', fontSize: '0.78rem', fontWeight: 700, marginBottom: '8px' }}>
              <Ticket size={14} /> Book Now
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              <MapPin size={14} color="var(--accent-red)" />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {[event.venue?.name, event.city].filter(Boolean).join(' · ') || event.location || 'Location to be announced'}
              </span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Starts from</span>
            <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#ffffff' }}>
              ₹{lowestPrice}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
