import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CityProvider } from './context/CityContext.jsx';

import HomePage from './pages/HomePage.jsx';
import MoviesPage from './pages/MoviesPage.jsx';
import MovieDetailPage from './pages/MovieDetailPage.jsx';
import EventsPage from './pages/EventsPage.jsx';
import EventDetailPage from './pages/EventDetailPage.jsx';
import VenuesPage from './pages/VenuesPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import BookingsPage from './pages/BookingsPage.jsx';
import BookingDetailPage from './pages/BookingDetailPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import BookingSuccessPage from './pages/BookingSuccessPage.jsx';
import SeatSelectionPage from './pages/SeatSelectionPage.jsx';
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx';
import AdminMoviesPage from './pages/admin/AdminMoviesPage.jsx';
import AdminEventsPage from './pages/admin/AdminEventsPage.jsx';
import AdminVenuesPage from './pages/admin/AdminVenuesPage.jsx';
import AdminShowsPage from './pages/admin/AdminShowsPage.jsx';
import AdminBookingsPage from './pages/admin/AdminBookingsPage.jsx';
import AdminUsersPage from './pages/admin/AdminUsersPage.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';

function SiteLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CityProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<SiteLayout><HomePage /></SiteLayout>} />
            <Route path="/movies" element={<SiteLayout><MoviesPage /></SiteLayout>} />
            <Route path="/movie/:slug" element={<SiteLayout><MovieDetailPage /></SiteLayout>} />
            <Route path="/events" element={<SiteLayout><EventsPage /></SiteLayout>} />
            <Route path="/event/:slug" element={<SiteLayout><EventDetailPage /></SiteLayout>} />
            <Route path="/venues" element={<SiteLayout><VenuesPage /></SiteLayout>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile" element={<SiteLayout><ProfilePage /></SiteLayout>} />
            <Route path="/bookings" element={<SiteLayout><BookingsPage /></SiteLayout>} />
            <Route path="/bookings/:id" element={<SiteLayout><BookingDetailPage /></SiteLayout>} />
            <Route path="/booking/checkout" element={<SiteLayout><CheckoutPage /></SiteLayout>} />
            <Route path="/booking/success" element={<SiteLayout><BookingSuccessPage /></SiteLayout>} />
            <Route path="/seat-selection/:showId" element={<SiteLayout><SeatSelectionPage /></SiteLayout>} />

            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/movies" element={<AdminMoviesPage />} />
            <Route path="/admin/events" element={<AdminEventsPage />} />
            <Route path="/admin/venues" element={<AdminVenuesPage />} />
            <Route path="/admin/shows" element={<AdminShowsPage />} />
            <Route path="/admin/bookings" element={<AdminBookingsPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />

            <Route path="*" element={<SiteLayout><div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', color: 'var(--text-secondary)' }}><div><h2 style={{ color: '#fff', marginBottom: '8px' }}>Page not found</h2><p>The page you requested does not exist.</p></div></div></SiteLayout>} />
          </Routes>
        </BrowserRouter>
      </CityProvider>
    </AuthProvider>
  );
}
