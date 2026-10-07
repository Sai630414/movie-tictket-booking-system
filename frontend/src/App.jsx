import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CityProvider } from './context/CityContext.jsx';

import LoadingSpinner from './components/LoadingSpinner.jsx';

const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const MoviesPage = lazy(() => import('./pages/MoviesPage.jsx'));
const MovieDetailPage = lazy(() => import('./pages/MovieDetailPage.jsx'));
const EventsPage = lazy(() => import('./pages/EventsPage.jsx'));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage.jsx'));
const VenuesPage = lazy(() => import('./pages/VenuesPage.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage.jsx'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage.jsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'));
const BookingsPage = lazy(() => import('./pages/BookingsPage.jsx'));
const BookingDetailPage = lazy(() => import('./pages/BookingDetailPage.jsx'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage.jsx'));
const BookingSuccessPage = lazy(() => import('./pages/BookingSuccessPage.jsx'));
const SeatSelectionPage = lazy(() => import('./pages/SeatSelectionPage.jsx'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage.jsx'));
const AdminMoviesPage = lazy(() => import('./pages/admin/AdminMoviesPage.jsx'));
const AdminEventsPage = lazy(() => import('./pages/admin/AdminEventsPage.jsx'));
const AdminVenuesPage = lazy(() => import('./pages/admin/AdminVenuesPage.jsx'));
const AdminShowsPage = lazy(() => import('./pages/admin/AdminShowsPage.jsx'));
const AdminBookingsPage = lazy(() => import('./pages/admin/AdminBookingsPage.jsx'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage.jsx'));

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
          <Suspense fallback={<LoadingSpinner message="Loading page..." />}>
          <Routes>
            <Route path="/" element={<SiteLayout><HomePage /></SiteLayout>} />
            <Route path="/movies" element={<SiteLayout><MoviesPage /></SiteLayout>} />
            <Route path="/movies/:slug" element={<SiteLayout><MovieDetailPage /></SiteLayout>} />
            <Route path="/events" element={<SiteLayout><EventsPage /></SiteLayout>} />
            <Route path="/events/:slug" element={<SiteLayout><EventDetailPage /></SiteLayout>} />
            <Route path="/venues" element={<SiteLayout><VenuesPage /></SiteLayout>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/profile" element={<SiteLayout><ProfilePage /></SiteLayout>} />
            <Route path="/bookings" element={<SiteLayout><BookingsPage /></SiteLayout>} />
            <Route path="/bookings/:id" element={<SiteLayout><BookingDetailPage /></SiteLayout>} />
            <Route path="/booking/checkout" element={<SiteLayout><CheckoutPage /></SiteLayout>} />
            <Route path="/booking/success" element={<SiteLayout><BookingSuccessPage /></SiteLayout>} />
            <Route path="/seat-selection/:showId" element={<SiteLayout><SeatSelectionPage /></SiteLayout>} />
            <Route path="/shows/:showId/seats" element={<SiteLayout><SeatSelectionPage /></SiteLayout>} />

            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/movies" element={<AdminMoviesPage />} />
            <Route path="/admin/events" element={<AdminEventsPage />} />
            <Route path="/admin/venues" element={<AdminVenuesPage />} />
            <Route path="/admin/shows" element={<AdminShowsPage />} />
            <Route path="/admin/bookings" element={<AdminBookingsPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />

            <Route path="*" element={<SiteLayout><div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', color: 'var(--text-secondary)' }}><div><h2 style={{ color: '#fff', marginBottom: '8px' }}>Page not found</h2><p>The page you requested does not exist.</p></div></div></SiteLayout>} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </CityProvider>
    </AuthProvider>
  );
}
