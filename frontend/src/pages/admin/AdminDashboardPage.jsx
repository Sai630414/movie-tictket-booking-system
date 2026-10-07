import React, { useEffect, useState } from 'react';
import { Users, Film, Calendar, Building, Ticket, TrendingUp, DollarSign, Play } from 'lucide-react';
import api from '../../services/api.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import AdminLayout from './AdminLayout.jsx';

function StatCard({ icon: Icon, label, value, color = 'var(--accent-red)' }) {
  return (
    <div style={{
      backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
      borderRadius: '14px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px',
      transition: 'border-color 0.2s, transform 0.2s'
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{ width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${color}20`, border: `1px solid ${color}40` }}>
        <Icon size={24} color={color} />
      </div>
      <div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ color: '#fff', fontSize: '1.8rem', fontWeight: '800', marginTop: '2px' }}>{value}</div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/dashboard');
        if (res.data?.success) setStats(res.data.data);
      } catch (err) {
        console.error('Fetch admin stats error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <AdminLayout>
      <div style={{ padding: '32px' }}>
        <h1 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '8px' }}>Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Platform overview and analytics</p>

        {loading ? (
          <LoadingSpinner message="Loading stats..." />
        ) : stats ? (
          <>
            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '40px' }}>
              <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="#06b6d4" />
              <StatCard icon={Film} label="Active Movies" value={stats.totalMovies} color="var(--accent-red)" />
              <StatCard icon={Calendar} label="Active Events" value={stats.totalEvents} color="#a855f7" />
              <StatCard icon={Building} label="Venues" value={stats.totalVenues} color="#f59e0b" />
              <StatCard icon={Ticket} label="Total Bookings" value={stats.totalBookings} color="#22c55e" />
              <StatCard icon={DollarSign} label="Total Revenue" value={`₹${(stats.totalRevenue || 0).toLocaleString()}`} color="#f59e0b" />
            </div>

            {/* Upcoming Shows & Events */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Upcoming Shows */}
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px' }}>
                <h3 style={{ color: '#fff', fontSize: '1.05rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Play size={18} color="var(--accent-red)" /> Upcoming Shows
                </h3>
                {stats.upcomingShows?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {stats.upcomingShows.map(show => (
                      <div key={show._id} style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                        <div style={{ color: '#fff', fontWeight: '600', fontSize: '0.9rem' }}>{show.movie?.title || 'Movie'}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '4px' }}>
                          {show.venue?.name} · {new Date(show.showDate).toLocaleDateString()} · {show.startTime}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No upcoming shows</p>
                )}
              </div>

              {/* Upcoming Events */}
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px' }}>
                <h3 style={{ color: '#fff', fontSize: '1.05rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={18} color="#a855f7" /> Upcoming Events
                </h3>
                {stats.upcomingEvents?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {stats.upcomingEvents.map(event => (
                      <div key={event._id} style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                        <div style={{ color: '#fff', fontWeight: '600', fontSize: '0.9rem' }}>{event.name}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '4px' }}>
                          {event.venue?.name || event.city} · {new Date(event.date).toLocaleDateString()} · {event.startTime}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No upcoming events</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <p style={{ color: 'var(--text-secondary)' }}>Failed to load stats. Is the backend running?</p>
        )}
      </div>
    </AdminLayout>
  );
}
