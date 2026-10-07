import React from 'react';
import { Film } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      backgroundColor: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border-color)',
      padding: '60px 0 30px 0',
      marginTop: '80px',
      color: 'var(--text-secondary)'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '40px',
          marginBottom: '40px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: 'var(--accent-red)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Film size={18} color="#ffffff" />
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#ffffff' }}>
                CINE<span style={{ color: 'var(--accent-red)' }}>VERSE</span>
              </span>
            </div>
            <p style={{ fontSize: '0.88rem', lineHeight: '1.6' }}>
              The ultimate next-generation movie and event ticket booking platform. Cinematic entertainment at your fingertips.
            </p>
          </div>

          <div>
            <h4 style={{ color: '#ffffff', marginBottom: '16px', fontSize: '1rem' }}>Movies</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem' }}>
              <li>Now Showing</li>
              <li>Coming Soon</li>
              <li>Top Rated</li>
              <li>IMAX 3D Experience</li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#ffffff', marginBottom: '16px', fontSize: '1rem' }}>Events</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem' }}>
              <li>Music Concerts</li>
              <li>Standup Comedy</li>
              <li>Sports Festivals</li>
              <li>Theatre & Plays</li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#ffffff', marginBottom: '16px', fontSize: '1rem' }}>Help & Support</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem' }}>
              <li>Cancellation & Refunds</li>
              <li>Terms of Service</li>
              <li>Privacy Policy</li>
              <li>Support Desk</li>
            </ul>
          </div>
        </div>

        <div style={{
          borderTop: '1px solid var(--border-color)',
          paddingTop: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.82rem'
        }}>
          <p>© {new Date().getFullYear()} Cineverse Booking System Inc. All Rights Reserved.</p>
          <p style={{ color: 'var(--text-muted)' }}>Engineered with React, Express, MongoDB & Supabase</p>
        </div>
      </div>
    </footer>
  );
}
