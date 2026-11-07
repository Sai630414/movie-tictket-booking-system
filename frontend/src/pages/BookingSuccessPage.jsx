import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  CheckCircle,
  Ticket,
  Home,
  CalendarDays,
  Clock3,
  MapPin,
  Download,
  Mail,
  MessageCircle,
  RefreshCw,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import { downloadBookingTicketAsPng } from '../utils/downloadPng.js';

const dateLabel = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Date to be confirmed';

export default function BookingSuccessPage() {
  const location = useLocation();
  const booking = location.state?.booking;
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [printing, setPrinting] = useState(true);
  const [sendingDelivery, setSendingDelivery] = useState(null);
  const [deliveryFeedback, setDeliveryFeedback] = useState('');
  const [deliveryFailed, setDeliveryFailed] = useState(false);

  // WhatsApp status tracking & retry states
  const [whatsappInfo, setWhatsappInfo] = useState(
    booking?.whatsapp || { status: 'PENDING', attempts: 0 }
  );
  const [retryingWhatsApp, setRetryingWhatsApp] = useState(false);
  const [retryFeedback, setRetryFeedback] = useState('');

  // Real-time polling for WhatsApp delivery status
  useEffect(() => {
    if (!booking?._id) return undefined;
    let isMounted = true;
    let pollCount = 0;
    const maxPolls = 8; // Poll up to 16 seconds

    const pollStatus = async () => {
      try {
        const res = await api.get(`/bookings/${booking._id}/whatsapp-status`);
        if (isMounted && res.data?.success && res.data.data?.whatsapp) {
          const current = res.data.data.whatsapp;
          setWhatsappInfo(current);
          if (current.status === 'SENT' || current.status === 'FAILED') {
            return true;
          }
        }
      } catch {
        // Silently tolerate transient polling errors
      }
      return false;
    };

    pollStatus();

    const interval = setInterval(async () => {
      pollCount += 1;
      const shouldStop = await pollStatus();
      if (shouldStop || pollCount >= maxPolls) {
        clearInterval(interval);
      }
    }, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [booking?._id]);

  const handleRetryWhatsApp = async () => {
    if (!booking?._id) return;
    setRetryingWhatsApp(true);
    setRetryFeedback('');
    try {
      const res = await api.post(`/whatsapp/retry/${booking._id}`);
      if (res.data?.success) {
        setWhatsappInfo((prev) => ({
          ...prev,
          status: 'PROCESSING',
          attempts: (prev.attempts || 0) + 1,
        }));
        setRetryFeedback('Retry dispatched! Fetching latest status...');
        setTimeout(async () => {
          const statusRes = await api.get(`/bookings/${booking._id}/whatsapp-status`).catch(() => {});
          if (statusRes?.data?.data?.whatsapp) {
            setWhatsappInfo(statusRes.data.data.whatsapp);
          }
        }, 2000);
      } else {
        setRetryFeedback(res.data?.message || 'Could not retry WhatsApp dispatch');
      }
    } catch (err) {
      setRetryFeedback(err.response?.data?.message || err.message || 'Retry failed');
    } finally {
      setRetryingWhatsApp(false);
    }
  };

  const handleSendTicket = async (channel) => {
    if (!booking?._id) return;
    setSendingDelivery(channel);
    setDeliveryFeedback('');
    setDeliveryFailed(false);
    try {
      if (channel === 'whatsapp') {
        const res = await api.post(`/whatsapp/retry/${booking._id}`);
        if (res.data?.success) {
          setDeliveryFeedback('Ticket sent to your WhatsApp number!');
          setWhatsappInfo((prev) => ({ ...prev, status: 'SENT' }));
        } else {
          setDeliveryFailed(true);
          setDeliveryFeedback(res.data?.message || 'Could not dispatch WhatsApp message.');
        }
      } else {
        const res = await api.post(`/bookings/${booking._id}/send-ticket`, { channels: [channel] });
        if (res.data?.success) {
          const info = res.data.data?.[channel];
          if (!info?.success) {
            setDeliveryFailed(true);
            setDeliveryFeedback(info?.error || 'Ticket email could not be sent. Please try again.');
          } else {
            setDeliveryFeedback(
              info.recipient ? `Ticket emailed to ${info.recipient}.` : 'Ticket email sent successfully.'
            );
          }
        } else {
          setDeliveryFailed(true);
          setDeliveryFeedback(res.data?.message || 'Ticket email could not be sent.');
        }
      }
    } catch (err) {
      setDeliveryFailed(true);
      setDeliveryFeedback(`Delivery failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setSendingDelivery(null);
    }
  };

  useEffect(() => {
    if (!booking) return undefined;
    const timer = window.setTimeout(() => setPrinting(false), 2400);
    return () => window.clearTimeout(timer);
  }, [booking]);

  if (!booking) {
    return (
      <main className="cv-ticket-page">
        <div className="container cv-ticket-empty">
          <CheckCircle size={52} color="#22c55e" />
          <h1>Payment complete</h1>
          <p>Your ticket is available in My Bookings.</p>
          <Link to="/bookings" className="btn-primary">
            My Bookings
          </Link>
        </div>
      </main>
    );
  }

  const title = booking.movie?.title || booking.event?.name || 'CineVerse Ticket';
  const showDate = booking.bookingType === 'EVENT' ? booking.event?.date : booking.show?.showDate;
  const showTime = booking.bookingType === 'EVENT' ? booking.event?.startTime : booking.show?.startTime;
  const seats = booking.seats?.map((seat) => seat.seatId).filter(Boolean) || [];
  const ticketLabels = booking.ticketItems?.map((item) => `${item.categoryName} × ${item.quantity}`) || [];
  const reservation = seats.length ? seats.join(', ') : ticketLabels.join(' · ');

  return (
    <main className="cv-ticket-page">
      <div className="cv-ticket-glow" aria-hidden="true" />
      <div className="container cv-ticket-container">
        <header className="cv-payment-success" aria-live="polite">
          <div className="cv-success-icon">
            <CheckCircle size={34} />
          </div>
          <p className="cv-success-eyebrow">CINEVERSE · PAYMENT SUCCESSFUL</p>
          <h1>{printing ? 'Your ticket is printing…' : 'Your night at the movies is set.'}</h1>
          <p>Payment verified. Your booking is confirmed and the ticket is ready.</p>
        </header>

        {/* WhatsApp & Booking Delivery Workflow Tracker */}
        <section
          style={{
            maxWidth: '520px',
            margin: '0 auto 20px auto',
            padding: '16px 20px',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '14px',
            border: '1px solid var(--border-color)',
          }}
          aria-label="Delivery Status"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Step 1: Payment */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={18} color="#22c55e" />
                <span style={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: '600' }}>Payment Successful</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(34,197,94,0.1)' }}>VERIFIED</span>
            </div>

            {/* Step 2: Ticket Generated */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={18} color="#22c55e" />
                <span style={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: '600' }}>Official Pass & QR Generated</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(34,197,94,0.1)' }}>READY</span>
            </div>

            {/* Step 3: WhatsApp Notification Status */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MessageCircle
                  size={18}
                  color={
                    whatsappInfo.status === 'SENT'
                      ? '#22c55e'
                      : whatsappInfo.status === 'FAILED'
                      ? '#ef4444'
                      : '#eab308'
                  }
                />
                <div>
                  <div style={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: '600' }}>
                    {whatsappInfo.status === 'SENT' && 'WhatsApp Ticket Delivered'}
                    {(whatsappInfo.status === 'PENDING' || whatsappInfo.status === 'PROCESSING') && 'WhatsApp Notification Pending'}
                    {whatsappInfo.status === 'FAILED' && 'WhatsApp Delivery Failed'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {whatsappInfo.status === 'SENT' && 'Official ticket image sent to your WhatsApp number.'}
                    {(whatsappInfo.status === 'PENDING' || whatsappInfo.status === 'PROCESSING') && 'Dispatching ticket image with entry QR code...'}
                    {whatsappInfo.status === 'FAILED' && (whatsappInfo.lastError || 'Could not deliver WhatsApp message.')}
                  </div>
                </div>
              </div>

              <div>
                {whatsappInfo.status === 'SENT' && (
                  <span style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: '700', padding: '3px 10px', borderRadius: '6px', backgroundColor: 'rgba(34,197,94,0.15)' }}>
                    SENT
                  </span>
                )}
                {(whatsappInfo.status === 'PENDING' || whatsappInfo.status === 'PROCESSING') && (
                  <span style={{ fontSize: '0.75rem', color: '#eab308', fontWeight: '700', padding: '3px 10px', borderRadius: '6px', backgroundColor: 'rgba(234,179,8,0.15)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> QUEUED
                  </span>
                )}
                {whatsappInfo.status === 'FAILED' && (
                  <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: '700', padding: '3px 10px', borderRadius: '6px', backgroundColor: 'rgba(239,68,68,0.15)' }}>
                    FAILED
                  </span>
                )}
              </div>
            </div>

            {/* Admin Retry Control */}
            {isAdmin && whatsappInfo.status === 'FAILED' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={handleRetryWhatsApp}
                  disabled={retryingWhatsApp}
                  className="btn-outline"
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderColor: 'rgba(239,68,68,0.5)',
                    color: '#fca5a5',
                  }}
                >
                  <RefreshCw size={13} className={retryingWhatsApp ? 'spin' : ''} />
                  {retryingWhatsApp ? 'Retrying WhatsApp...' : 'Admin: Retry WhatsApp Delivery'}
                </button>
              </div>
            )}

            {retryFeedback && (
              <div style={{ fontSize: '0.78rem', color: '#38bdf8', marginTop: '4px' }}>
                {retryFeedback}
              </div>
            )}
          </div>
        </section>

        <section
          className={`cv-printer ${printing ? 'is-printing' : 'is-finished'}`}
          aria-label={printing ? 'Printing your ticket' : 'Your digital ticket'}
        >
          <div className="cv-printer-ticket-slot" aria-hidden="true" />
          <div className="cv-printer-face">
            <div className="cv-printer-brand">
              <span className="cv-printer-light" /> CINEVERSE TICKET PRINTER
            </div>
            <div className="cv-printer-display">
              <Ticket size={19} />
              <span>{printing ? 'PRINTING YOUR EXPERIENCE' : 'TICKET READY · ENJOY THE SHOW'}</span>
            </div>
            <div className="cv-printer-output" aria-hidden="true">
              <span />
            </div>
          </div>

          <article className="cv-ticket-paper" aria-label={`${title} digital ticket`}>
            <div className="cv-ticket-topline">
              <div className="cv-ticket-logo">
                <span>▶</span>
                <strong>CINEVERSE</strong>
              </div>
              <span className="cv-ticket-paid">PAID</span>
            </div>
            <p className="cv-ticket-kicker">YOUR CINEMA EXPERIENCE</p>
            <h2>{title}</h2>
            <div className="cv-ticket-venue">
              <MapPin size={15} />
              <span>
                {booking.venue?.name || 'Venue'} · {booking.venue?.city || booking.event?.city || 'Andhra Pradesh'}
              </span>
            </div>
            <div className="cv-ticket-rule" />
            <div className="cv-ticket-facts">
              <div>
                <span>
                  <CalendarDays size={13} /> DATE
                </span>
                <strong>{dateLabel(showDate)}</strong>
              </div>
              <div>
                <span>
                  <Clock3 size={13} /> SHOW TIME
                </span>
                <strong>{showTime || 'Time to be confirmed'}</strong>
              </div>
              {booking.show?.screen?.name && (
                <div>
                  <span>SCREEN</span>
                  <strong>{booking.show.screen.name}</strong>
                </div>
              )}
              <div>
                <span>{seats.length ? 'SEATS' : 'TICKETS'}</span>
                <strong>{reservation || 'See booking details'}</strong>
              </div>
            </div>
            <div className="cv-ticket-rule" />
            <div className="cv-ticket-meta">
              <div>
                <span>BOOKING ID</span>
                <strong>{booking.bookingId}</strong>
              </div>
              <div>
                <span>PAYMENT REFERENCE</span>
                <strong>{booking.razorpayPaymentId || 'Verified by Razorpay'}</strong>
              </div>
            </div>
            <div className="cv-ticket-bottom">
              <div>
                <span className="cv-ticket-total-label">TOTAL PAID</span>
                <strong className="cv-ticket-total">
                  {new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    maximumFractionDigits: 0,
                  }).format(booking.totalAmount || 0)}
                </strong>
              </div>
              {booking.qrCode ? (
                <img className="cv-ticket-qr" src={booking.qrCode} alt="Secure CineVerse ticket QR code" />
              ) : (
                <div className="cv-ticket-qr-placeholder" aria-label="Ticket QR code is being generated" />
              )}
            </div>
            <p className="cv-ticket-footnote">
              This QR code contains a secure ticket identifier. Keep it ready at the venue entrance.
            </p>
          </article>
          <div className="cv-printer-base" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </section>

        {/* Delivery Feedback */}
        {deliveryFeedback && (
          <div
            style={{
              margin: '20px auto',
              maxWidth: '520px',
              padding: '12px 16px',
              borderRadius: '10px',
              backgroundColor: deliveryFailed ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.15)',
              border: `1px solid ${deliveryFailed ? 'rgba(239, 68, 68, 0.35)' : 'rgba(34, 197, 94, 0.3)'}`,
              color: deliveryFailed ? '#fca5a5' : '#86efac',
              fontSize: '0.88rem',
              textAlign: 'center',
              wordBreak: 'break-all',
            }}
          >
            {deliveryFeedback}
          </div>
        )}

        {/* Quick Ticket Delivery Options */}
        <div
          className="glass-card"
          style={{
            maxWidth: '520px',
            margin: '0 auto 24px auto',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ color: '#fff', fontWeight: '600', fontSize: '0.92rem' }}>Send copy of ticket</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
              Receive an instant QR pass by WhatsApp or email
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleSendTicket('whatsapp')}
              disabled={sendingDelivery !== null}
              className="btn-outline"
              style={{
                padding: '8px 14px',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderColor: 'rgba(34, 197, 94, 0.4)',
                color: '#86efac',
                cursor: sendingDelivery ? 'not-allowed' : 'pointer',
              }}
            >
              <MessageCircle size={14} color="#22c55e" />
              {sendingDelivery === 'whatsapp' ? 'Sending...' : 'WhatsApp'}
            </button>
            <button
              type="button"
              onClick={() => handleSendTicket('email')}
              disabled={sendingDelivery !== null}
              className="btn-outline"
              style={{
                padding: '8px 14px',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: sendingDelivery ? 'not-allowed' : 'pointer',
              }}
            >
              <Mail size={14} color="#60a5fa" />
              {sendingDelivery === 'email' ? 'Sending...' : 'Email'}
            </button>
          </div>
        </div>

        <nav className="cv-ticket-actions" aria-label="Ticket actions">
          <Link to={`/bookings/${booking._id || booking.bookingId}`} className="btn-primary">
            <Ticket size={17} /> View Ticket
          </Link>
          <button
            type="button"
            className="btn-outline"
            onClick={() =>
              downloadBookingTicketAsPng(booking, `CineVerse-${booking.bookingId || 'ticket'}.png`).catch(
                (error) => window.alert(error.message)
              )
            }
          >
            <Download size={17} /> Download PNG
          </button>
          <Link to="/" className="btn-outline">
            <Home size={17} /> Back to Home
          </Link>
          <Link to="/bookings" className="btn-outline">
            My Bookings
          </Link>
        </nav>
      </div>
    </main>
  );
}
