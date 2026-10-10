import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Film, Calendar, MapPin, Search, Ticket, User, LogOut, ShieldAlert, ChevronDown, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCity } from '../context/CityContext.jsx';
import api from '../services/api.js';

function SearchGroup({ title, children }) {
  return <section aria-label={title} style={{ padding: '8px 4px' }}><h2 style={{ margin: '4px 8px 7px', color: 'var(--text-muted)', fontSize: '.7rem', letterSpacing: '.1em', textTransform: 'uppercase' }}>{title}</h2>{children}</section>;
}

function SearchResult({ label, detail, onClick }) {
  return <button type="button" onClick={onClick} style={{ display: 'block', width: '100%', padding: '10px 9px', textAlign: 'left', borderRadius: 8, color: '#fff', background: 'transparent' }} onMouseEnter={event => { event.currentTarget.style.background = 'rgba(255,255,255,.06)'; }} onMouseLeave={event => { event.currentTarget.style.background = 'transparent'; }}><strong style={{ display: 'block', fontSize: '.9rem' }}>{label}</strong><span style={{ display: 'block', marginTop: 3, color: 'var(--text-secondary)', fontSize: '.76rem' }}>{detail}</span></button>;
}

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { selectedCity, changeCity, availableCities } = useCity();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setShowCityDropdown(false);
    setShowProfileDropdown(false);
  }, [location.pathname]);

  useEffect(() => {
    const term = searchQuery.trim();
    if (term.length < 2) { setSearchResults(null); return undefined; }
    let active = true;
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const response = await api.get(`/search?q=${encodeURIComponent(term)}`);
        if (active && response.data?.success) setSearchResults(response.data.data);
      } catch {
        if (active) setSearchResults({ movies: [], events: [], venues: [], cities: [], unavailable: true });
      } finally {
        if (active) setSearching(false);
      }
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/movies?search=${encodeURIComponent(searchQuery.trim())}&city=${encodeURIComponent(selectedCity)}`);
      setShowSearchModal(false);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backgroundColor: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        borderBottom: '1px solid var(--glass-border)',
        height: '70px',
        display: 'flex',
        alignItems: 'center'
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          
          {/* Logo & Desktop Main Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--accent-red) 0%, #b20710 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(229,9,20,0.5)',
                flexShrink: 0
              }}>
                <Film size={20} color="#ffffff" />
              </div>
              <span style={{ fontSize: '1.35rem', fontWeight: '800', letterSpacing: '-0.03em', color: '#ffffff', whiteSpace: 'nowrap' }}>
                CINE<span style={{ color: 'var(--accent-red)' }}>VERSE</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hide-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <Link to="/movies" style={{
                color: isActive('/movies') ? 'var(--accent-red)' : 'var(--text-secondary)',
                fontWeight: isActive('/movies') ? '600' : '500',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'color 0.2s'
              }}>
                <Film size={16} /> Movies
              </Link>
              <Link to="/events" style={{
                color: isActive('/events') ? 'var(--accent-red)' : 'var(--text-secondary)',
                fontWeight: isActive('/events') ? '600' : '500',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'color 0.2s'
              }}>
                <Calendar size={16} /> Events
              </Link>
              <Link to="/venues" style={{
                color: isActive('/venues') ? 'var(--accent-red)' : 'var(--text-secondary)',
                fontWeight: isActive('/venues') ? '600' : '500',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'color 0.2s'
              }}>
                <MapPin size={16} /> Venues
              </Link>
            </nav>
          </div>

          {/* Right Side Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            
            {/* Search Button (Desktop) */}
            <button
              onClick={() => setShowSearchModal(true)}
              className="hide-on-mobile"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-color)',
                borderRadius: '20px',
                padding: '8px 16px',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.88rem'
              }}
            >
              <Search size={15} />
              <span>Search movies, events...</span>
            </button>

            {/* Search Icon Button (Mobile) */}
            <button
              onClick={() => setShowSearchModal(true)}
              className="show-on-mobile hide-on-desktop"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-color)',
                borderRadius: '50%',
                width: '38px',
                height: '38px',
                color: 'var(--text-secondary)',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              aria-label="Search"
            >
              <Search size={17} />
            </button>

            {/* City Selector Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowCityDropdown(!showCityDropdown)}
                style={{
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: '600',
                  fontSize: '0.88rem',
                  padding: '6px 8px',
                  borderRadius: '6px'
                }}
              >
                <MapPin size={15} color="var(--accent-red)" />
                <span style={{ maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedCity}
                </span>
                <ChevronDown size={13} />
              </button>

              {showCityDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  width: '210px',
                  maxHeight: '60vh',
                  overflowY: 'auto',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 1100
                }}>
                  {availableCities.map((city) => (
                    <div
                      key={city}
                      onClick={() => {
                        changeCity(city);
                        setShowCityDropdown(false);
                      }}
                      style={{
                        padding: '10px 16px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        color: city === selectedCity ? 'var(--accent-red)' : 'var(--text-primary)',
                        fontWeight: city === selectedCity ? '600' : '400',
                        backgroundColor: city === selectedCity ? 'rgba(229, 9, 20, 0.1)' : 'transparent',
                        transition: 'background 0.2s'
                      }}
                    >
                      {city}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* User Profile / Auth Actions (Desktop) */}
            <div className="hide-on-mobile">
              {user ? (
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <img
                      src={user.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop'}
                      alt={user.name}
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid var(--accent-red)'
                      }}
                    />
                    <span style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-primary)', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.name || 'Account'}
                    </span>
                  </button>

                  {showProfileDropdown && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: '12px',
                      width: '200px',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      boxShadow: 'var(--shadow-lg)',
                      padding: '8px 0',
                      zIndex: 1100
                    }}>
                      <Link
                        to="/profile"
                        onClick={() => setShowProfileDropdown(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '12px 18px',
                          fontSize: '0.9rem',
                          color: 'var(--text-primary)'
                        }}
                      >
                        <User size={16} /> My Profile
                      </Link>

                      <Link
                        to="/bookings"
                        onClick={() => setShowProfileDropdown(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '12px 18px',
                          fontSize: '0.9rem',
                          color: 'var(--text-primary)'
                        }}
                      >
                        <Ticket size={16} /> My Bookings
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setShowProfileDropdown(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '12px 18px',
                            fontSize: '0.9rem',
                            color: 'var(--accent-gold)'
                          }}
                        >
                          <ShieldAlert size={16} /> Admin Panel
                        </Link>
                      )}

                      <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '6px 0' }} />

                      <button
                        onClick={() => {
                          logout();
                          setShowProfileDropdown(false);
                          navigate('/');
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '12px 18px',
                          fontSize: '0.9rem',
                          color: 'var(--accent-red)',
                          background: 'transparent'
                        }}
                      >
                        <LogOut size={16} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link to="/login" className="btn-outline" style={{ padding: '7px 14px', fontSize: '0.85rem' }}>
                    Sign In
                  </Link>
                  <Link to="/register" className="btn-primary" style={{ padding: '7px 14px', fontSize: '0.85rem' }}>
                    Get Started
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="show-on-mobile hide-on-desktop"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                width: '38px',
                height: '38px',
                color: '#fff',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer" style={{ zIndex: 1200 }}>
          {/* User profile / guest section */}
          {user ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              marginBottom: '4px'
            }}>
              <img
                src={user.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop'}
                alt={user.name}
                style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-red)' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: '700', color: '#fff', fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name || 'Member'}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email || user.phone}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-outline"
                style={{ textAlign: 'center', padding: '12px', fontSize: '0.92rem' }}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-primary"
                style={{ textAlign: 'center', padding: '12px', fontSize: '0.92rem' }}
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Navigation Links */}
          <Link
            to="/movies"
            onClick={() => setMobileMenuOpen(false)}
            className={`mobile-nav-link ${isActive('/movies') ? 'active' : ''}`}
          >
            <Film size={20} color="var(--accent-red)" />
            <span>Movies</span>
          </Link>

          <Link
            to="/events"
            onClick={() => setMobileMenuOpen(false)}
            className={`mobile-nav-link ${isActive('/events') ? 'active' : ''}`}
          >
            <Calendar size={20} color="#38bdf8" />
            <span>Events</span>
          </Link>

          <Link
            to="/venues"
            onClick={() => setMobileMenuOpen(false)}
            className={`mobile-nav-link ${isActive('/venues') ? 'active' : ''}`}
          >
            <MapPin size={20} color="#a855f7" />
            <span>Venues</span>
          </Link>

          {user && (
            <>
              <Link
                to="/bookings"
                onClick={() => setMobileMenuOpen(false)}
                className={`mobile-nav-link ${isActive('/bookings') ? 'active' : ''}`}
              >
                <Ticket size={20} color="#22c55e" />
                <span>My Bookings</span>
              </Link>

              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={`mobile-nav-link ${isActive('/profile') ? 'active' : ''}`}
              >
                <User size={20} color="#f59e0b" />
                <span>My Profile</span>
              </Link>

              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`mobile-nav-link ${isActive('/admin') ? 'active' : ''}`}
                >
                  <ShieldAlert size={20} color="var(--accent-gold)" />
                  <span style={{ color: 'var(--accent-gold)' }}>Admin Panel</span>
                </Link>
              )}

              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                  navigate('/');
                }}
                className="mobile-nav-link"
                style={{
                  width: '100%',
                  marginTop: '12px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                  color: '#ef4444'
                }}
              >
                <LogOut size={20} color="#ef4444" />
                <span>Sign Out</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Global Search Modal */}
      {showSearchModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.88)',
          backdropFilter: 'blur(12px)',
          zIndex: 2000,
          display: 'flex',
          justifyContent: 'center',
          paddingTop: '60px'
        }}>
          <div style={{ width: '100%', maxWidth: '700px', padding: '0 16px' }}>
            <form onSubmit={handleSearchSubmit} style={{ position: 'relative' }}>
              <input
                type="text"
                autoFocus
                placeholder="Search movies, events, actors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  paddingLeft: '50px',
                  paddingRight: '46px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '2px solid var(--accent-red)',
                  borderRadius: '30px',
                  color: '#ffffff',
                  fontSize: '1rem',
                  outline: 'none',
                  boxShadow: '0 10px 30px rgba(229, 9, 20, 0.3)'
                }}
              />
              <Search size={20} color="var(--text-secondary)" style={{ position: 'absolute', left: '18px', top: '18px' }} />
              <button
                type="button"
                onClick={() => setShowSearchModal(false)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '12px',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#ffffff',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem'
                }}
              >
                ✕
              </button>
            </form>
            {searchQuery.trim().length >= 2 && (
              <div style={{ maxHeight: '65vh', overflowY: 'auto', marginTop: '14px', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '16px', background: 'var(--bg-card)' }}>
                {searching ? <p role="status" style={{ padding: '12px', color: 'var(--text-secondary)' }}>Searching CineVerse…</p> : null}
                {!searching && searchResults?.unavailable ? <p style={{ padding: '12px', color: 'var(--text-secondary)' }}>Search is temporarily unavailable. You can still search the movie catalog.</p> : null}
                {!searching && searchResults && !searchResults.unavailable && !searchResults.movies.length && !searchResults.events.length && !searchResults.venues.length && !searchResults.cities.length ? <p style={{ padding: '12px', color: 'var(--text-secondary)' }}>No movies, events, cinemas, or Andhra Pradesh cities matched “{searchQuery.trim()}”.</p> : null}
                {searchResults?.movies?.length > 0 && <SearchGroup title="Movies & people">{searchResults.movies.map(movie => <SearchResult key={movie._id} label={movie.title} detail={`${movie.language} · ${movie.genre?.[0] || 'Movie'}`} onClick={() => { navigate(`/movies/${movie.slug}`); setShowSearchModal(false); }} />)}</SearchGroup>}
                {searchResults?.venues?.length > 0 && <SearchGroup title="Cinemas">{searchResults.venues.map((venue, index) => <SearchResult key={`${venue.name}-${venue.city}-${index}`} label={venue.name} detail={`${venue.city} · ${venue.address || 'Cinema'}`} onClick={() => { changeCity(venue.city); navigate('/venues'); setShowSearchModal(false); }} />)}</SearchGroup>}
                {searchResults?.cities?.length > 0 && <SearchGroup title="Andhra Pradesh cities">{searchResults.cities.map(city => <SearchResult key={city} label={city} detail="View cinemas and events" onClick={() => { changeCity(city); navigate('/venues'); setShowSearchModal(false); }} />)}</SearchGroup>}
                {searchResults?.events?.length > 0 && <SearchGroup title="Events">{searchResults.events.map(event => <SearchResult key={event._id} label={event.name} detail={`${event.city} · ${event.category}`} onClick={() => { navigate(`/events/${event.slug}`); setShowSearchModal(false); }} />)}</SearchGroup>}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
