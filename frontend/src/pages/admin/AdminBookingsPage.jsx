import React, { useEffect, useState } from 'react';
import { Search, Ticket, Eye, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../../services/api.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import AdminLayout from './AdminLayout.jsx';

const STATUS_TABS = [
  { key: '', label: 'All Bookings' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [updating, setUpdating] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.set('search', search);
      if (statusFilter) query.set('bookingStatus', statusFilter);
      query.set('limit', '30');

      const res = await api.get(`/admin/bookings?${query.toString()}`);
      if (res.data?.success) {
        setBookings(res.data.data.bookings || []);
        setPagination(res.data.data.pagination || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const handleStatusChange = async (bookingId, newStatus) => {
    if (!window.confirm(`Update booking status to ${newStatus}?`)) return;
    setUpdating(true);
    try {
      await api.patch(`/admin/bookings/${bookingId}/status`, { bookingStatus: newStatus });
      fetchBookings();
      if (selectedBooking && selectedBooking._id === bookingId) {
        setSelectedBooking(b => ({ ...b, bookingStatus: newStatus }));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const inputStyle = {
    padding: '10px 14px', backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff',
    fontSize: '0.88rem', outline: 'none'
  };

  return (
    <AdminLayout>
      <div style={{ padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', color: '#fff' }}>Platform Bookings</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>Monitor ticket sales, verify transactions, and manage reservations</p>
          </div>
          <button onClick={fetchBookings} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <input
              type="text"
              placeholder="Search by Booking ID (e.g. MOV-2026-...) or Order ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchBookings()}
              style={{ ...inputStyle, width: '100%', paddingLeft: '40px' }}
            />
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {STATUS_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                style={{
                  padding: '9px 16px', borderRadius: '6px', border: '1px solid',
                  borderColor: statusFilter === tab.key ? 'var(--accent-red)' : 'var(--border-color)',
                  backgroundColor: statusFilter === tab.key ? 'var(--accent-red)' : 'var(--bg-card)',
                  color: '#fff', fontSize: '0.85rem', cursor: 'pointer', fontWeight: statusFilter === tab.key ? '700' : '400'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button onClick={fetchBookings} className="btn-outline">Search</button>
        </div>

        {loading ? <LoadingSpinner message="Loading platform bookings..." /> : (
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                  {['Booking ID', 'Customer', 'Movie / Event', 'Venue', 'Seats / Tickets', 'Amount', 'Status', 'Payment', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No bookings found</td></tr>
                ) : bookings.map(b => {
                  const title = b.movie?.title || b.event?.name || 'N/A';
                  return (
                    <tr key={b._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '14px 16px', color: 'var(--accent-cyan)', fontWeight: '700', fontSize: '0.82rem', fontFamily: 'monospace' }}>
                        {b.bookingId}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ color: '#fff', fontWeight: '600', fontSize: '0.88rem' }}>{b.user?.name || 'Customer'}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{b.user?.email || ''}</div>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#fff', fontSize: '0.88rem', fontWeight: '500' }}>
                        {title}
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                        {b.venue?.name || 'Venue'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {b.seats?.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', maxWidth: '140px' }}>
                            {b.seats.map(s => (
                              <span key={s.seatId} style={{ padding: '2px 5px', backgroundColor: 'rgba(229,9,20,0.15)', borderRadius: '3px', color: 'var(--accent-red)', fontSize: '0.72rem', fontWeight: '700' }}>
                                {s.seatId}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            {b.ticketItems?.reduce((sum, item) => sum + item.quantity, 0)} Tickets
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--accent-gold)', fontWeight: '800', fontSize: '0.95rem' }}>
                        ₹{b.totalAmount}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '700',
                          backgroundColor: b.bookingStatus === 'CONFIRMED' ? 'rgba(34,197,94,0.1)' : b.bookingStatus === 'CANCELLED' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                          color: b.bookingStatus === 'CONFIRMED' ? '#22c55e' : b.bookingStatus === 'CANCELLED' ? '#ef4444' : '#f59e0b'
                        }}>
                          {b.bookingStatus}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '700',
                          backgroundColor: b.paymentStatus === 'PAID' ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)',
                          color: b.paymentStatus === 'PAID' ? '#22c55e' : 'var(--text-secondary)'
                        }}>
                          {b.paymentStatus}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <button
                          onClick={() => setSelectedBooking(b)}
                          style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                        >
                          <Eye size={13} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(6px)' }}>
          <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '18px', width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Booking Details</span>
                <h2 style={{ color: '#fff', fontSize: '1.3rem', marginTop: '2px' }}>#{selectedBooking.bookingId}</h2>
              </div>
              <button onClick={() => setSelectedBooking(null)} style={{ background: 'none', color: 'var(--text-muted)', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ padding: '16px', backgroundColor: 'var(--bg-card)', borderRadius: '10px', marginBottom: '16px' }}>
              <div style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '700' }}>
                {selectedBooking.movie?.title || selectedBooking.event?.name}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                📍 {selectedBooking.venue?.name} · {selectedBooking.venue?.city}
              </div>
              {selectedBooking.show && (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
                  Show Date: {new Date(selectedBooking.show.showDate).toLocaleDateString()} at {selectedBooking.show.startTime}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div style={{ padding: '12px', backgroundColor: 'var(--bg-card)', borderRadius: '8px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Customer</div>
                <div style={{ color: '#fff', fontWeight: '600', fontSize: '0.9rem', marginTop: '2px' }}>{selectedBooking.user?.name}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{selectedBooking.user?.email}</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: 'var(--bg-card)', borderRadius: '8px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Payment Status</div>
                <div style={{ color: 'var(--accent-gold)', fontWeight: '800', fontSize: '1.1rem', marginTop: '2px' }}>₹{selectedBooking.totalAmount}</div>
                <div style={{ color: '#22c55e', fontSize: '0.78rem', fontWeight: '700' }}>{selectedBooking.paymentStatus}</div>
              </div>
            </div>

            {/* Seats / Tickets */}
            {selectedBooking.seats?.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '6px' }}>Reserved Seats</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedBooking.seats.map(s => (
                    <span key={s.seatId} style={{ padding: '4px 10px', backgroundColor: 'rgba(229,9,20,0.15)', border: '1px solid var(--accent-red)', borderRadius: '4px', color: 'var(--accent-red)', fontSize: '0.82rem', fontWeight: '700' }}>
                      {s.seatId} ({s.seatType}) - ₹{s.price}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* QR Code */}
            {selectedBooking.qrCode && (
              <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <img src={selectedBooking.qrCode} alt="Ticket QR" style={{ width: '130px', height: '130px', border: '6px solid #fff', borderRadius: '10px' }} />
              </div>
            )}

            {/* Status Change Controls */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '10px' }}>Admin Status Override:</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['CONFIRMED', 'CANCELLED', 'COMPLETED'].map(st => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(selectedBooking._id, st)}
                    disabled={updating || selectedBooking.bookingStatus === st}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '700',
                      border: '1px solid var(--border-color)',
                      backgroundColor: selectedBooking.bookingStatus === st ? 'rgba(255,255,255,0.2)' : 'var(--bg-card)',
                      color: st === 'CONFIRMED' ? '#22c55e' : st === 'CANCELLED' ? '#ef4444' : '#06b6d4',
                      cursor: selectedBooking.bookingStatus === st ? 'default' : 'pointer'
                    }}
                  >
                    Set {st}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
