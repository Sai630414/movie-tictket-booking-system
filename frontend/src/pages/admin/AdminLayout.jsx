import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Film, Calendar, Building, Play, Ticket, Users, LogOut, ShieldAlert, X, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const NAV_ITEMS = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/admin/movies', label: 'Movies', icon: Film },
  { path: '/admin/events', label: 'Events', icon: Calendar },
  { path: '/admin/venues', label: 'Venues', icon: Building },
  { path: '/admin/shows', label: 'Shows', icon: Play },
  { path: '/admin/bookings', label: 'Bookings', icon: Ticket },
  { path: '/admin/users', label: 'Users', icon: Users },
];

export default function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!isAdmin) navigate('/');
  }, [isAdmin, navigate]);

  if (!isAdmin) return null;

  const isActive = (path, exact = false) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0d0d0d' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? '240px' : '70px',
        flexShrink: 0,
        backgroundColor: '#111111',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        overflow: 'hidden',
        position: 'sticky',
        top: 0,
        height: '100vh'
      }}>
        {/* Brand */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <div style={{ width: '34px', height: '34px', flexShrink: 0, borderRadius: '8px', background: 'var(--accent-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert size={18} color="#fff" />
            </div>
            {sidebarOpen && <span style={{ color: '#fff', fontWeight: '800', whiteSpace: 'nowrap', fontSize: '0.95rem' }}>CineVerse Admin</span>}
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', color: 'var(--text-muted)', flexShrink: 0 }}>
            {sidebarOpen ? <X size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          {NAV_ITEMS.map(item => {
            const active = isActive(item.path, item.exact);
            return (
              <Link
                key={item.path}
                to={item.path}
                title={!sidebarOpen ? item.label : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '11px 12px', borderRadius: '8px', marginBottom: '4px',
                  backgroundColor: active ? 'rgba(229,9,20,0.15)' : 'transparent',
                  border: `1px solid ${active ? 'rgba(229,9,20,0.3)' : 'transparent'}`,
                  color: active ? 'var(--accent-red)' : 'var(--text-secondary)',
                  fontWeight: active ? '700' : '400',
                  fontSize: '0.9rem', textDecoration: 'none',
                  transition: 'all 0.2s', whiteSpace: 'nowrap', overflow: 'hidden'
                }}
              >
                <item.icon size={18} style={{ flexShrink: 0 }} />
                {sidebarOpen && item.label}
              </Link>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border-color)' }}>
          {sidebarOpen && (
            <div style={{ padding: '8px 12px', marginBottom: '8px' }}>
              <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '600' }}>{user?.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{user?.email}</div>
            </div>
          )}
          <button
            onClick={() => { logout(); navigate('/'); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: '8px', width: '100%',
              backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#ef4444', fontSize: '0.88rem', cursor: 'pointer', overflow: 'hidden'
            }}
          >
            <LogOut size={16} style={{ flexShrink: 0 }} />
            {sidebarOpen && 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflow: 'auto', backgroundColor: '#0d0d0d' }}>
        {children}
      </main>
    </div>
  );
}
