import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Lock, CreditCard, Shield, Ticket, AlertCircle, Tag, Timer, CheckCircle } from 'lucide-react';
import api from '../services/api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponSuccess, setCouponSuccess] = useState('');
  const [error, setError] = useState('');

  // Hold countdown
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

  const bookingId = location.state?.bookingId;

  useEffect(() => {
    if (!bookingId) {
      navigate('/bookings');
      return;
    }

    const fetchBooking = async () => {
      try {
        const res = await api.get(`/bookings/${bookingId}`);
        if (res.data?.success) {
          setBooking(res.data.data);
          if (res.data.data.couponCode) {
            setCouponCode(res.data.data.couponCode);
          }
        }
      } catch (err) {
        setError('Could not load booking. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId, navigate]);

  // Hold Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setError('');
    setCouponSuccess('');
    try {
      const res = await api.post(`/bookings/${booking._id}/apply-coupon`, { couponCode });
      if (res.data?.success) {
        setBooking(res.data.data);
        setCouponSuccess(res.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid coupon code. Try CINE50, FIRST100, or MOVIE20.');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handlePayment = async () => {
    setError('');
    setPaying(true);
    let paymentHandled = false;
    let activeOrderId = '';

    try {
      // Step 1: Create Razorpay Order on Backend
      const orderRes = await api.post('/payments/create-order', { bookingId: booking._id });
      if (!orderRes.data?.success) {
        throw new Error('Failed to create payment order');
      }

      const { orderId, amount, currency, keyId } = orderRes.data.data;
      activeOrderId = orderId;
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || keyId;
      if (!razorpayKey) throw new Error('Razorpay is not configured for this application.');

      // Step 2: Ensure Razorpay SDK is loaded
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        throw new Error('Razorpay checkout could not be loaded. Check your connection and try again.');
      }

      // Step 3: Real Razorpay checkout modal
      const options = {
        key: razorpayKey,
        amount,
        currency: currency || 'INR',
        name: 'CineVerse Entertainment',
        description: `Booking #${booking.bookingId}`,
        order_id: orderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: { color: '#E50914' },
        handler: async (response) => {
          paymentHandled = true;
          await verifyAndConfirmPayment(
            booking._id,
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature
          );
        },
        modal: {
          ondismiss: async () => {
            if (!paymentHandled && activeOrderId) {
              await api.post('/payments/failure', { bookingId: booking._id, razorpayOrderId: activeOrderId }).catch(() => {});
            }
            setError('Payment was dismissed. You can try again before your seats expire.');
            setPaying(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        paymentHandled = true;
        if (activeOrderId) {
          api.post('/payments/failure', { bookingId: booking._id, razorpayOrderId: activeOrderId }).catch(() => {});
        }
        setError(response.error.description || 'Payment transaction failed.');
        setPaying(false);
      });
      rzp.open();

    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Payment initiation failed. Please try again.');
      setPaying(false);
    }
  };

  const verifyAndConfirmPayment = async (bId, orderId, paymentId, signature) => {
    try {
      const verifyRes = await api.post('/payments/verify', {
        bookingId: bId,
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
      });

      if (verifyRes.data?.success) {
        navigate('/booking/success', { state: { booking: verifyRes.data.data } });
      } else {
        setError('Payment verification failed. Please contact support.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Payment verification failed.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading checkout details..." />;
  if (!booking) return (
    <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-secondary)' }}>
      <p>{error || 'Booking not found.'}</p>
      <Link to="/movies" className="btn-primary" style={{ display: 'inline-flex', marginTop: '20px' }}>Browse Movies</Link>
    </div>
  );

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh', padding: '40px 0' }}>
      <div className="container" style={{ maxWidth: '720px' }}>
        
        {/* Header with Hold Countdown */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', color: '#fff' }}>Secure Checkout</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>Review your ticket reservation and complete payment</p>
          </div>
          {timeLeft > 0 ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 16px', borderRadius: '20px',
              backgroundColor: timeLeft < 120 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(234, 179, 8, 0.15)',
              border: `1px solid ${timeLeft < 120 ? '#ef4444' : '#eab308'}`
            }}>
              <Timer size={16} color={timeLeft < 120 ? '#ef4444' : '#eab308'} />
              <span style={{ color: timeLeft < 120 ? '#ef4444' : '#eab308', fontWeight: '800', fontFamily: 'monospace' }}>
                {formatCountdown(timeLeft)}
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>Hold Remaining</span>
            </div>
          ) : (
            <div style={{ padding: '6px 14px', borderRadius: '20px', backgroundColor: 'rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '0.8rem', fontWeight: '700' }}>
              Hold Expired
            </div>
          )}
        </div>

        {/* Booking Summary Card */}
        <div className="glass-card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Ticket size={20} color="var(--accent-red)" />
            <h3 style={{ fontSize: '1.15rem', color: '#fff' }}>Booking Summary</h3>
            <span style={{ marginLeft: 'auto', color: 'var(--accent-cyan)', fontSize: '0.85rem', fontWeight: '700', fontFamily: 'monospace' }}>
              #{booking.bookingId}
            </span>
          </div>

          {/* Movie / Event Info */}
          <div style={{ padding: '16px', backgroundColor: 'var(--bg-card)', borderRadius: '12px', marginBottom: '16px', border: '1px solid var(--border-color)' }}>
            <div style={{ color: '#fff', fontWeight: '700', fontSize: '1.2rem', marginBottom: '6px' }}>
              {booking.movie?.title || booking.event?.name}
            </div>
            {booking.venue && (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                📍 {booking.venue?.name} · {booking.show?.showDate ? new Date(booking.show.showDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : new Date(booking.event?.date).toLocaleDateString()}
              </div>
            )}
            {booking.show?.startTime && (
              <div style={{ color: 'var(--accent-gold)', fontSize: '0.85rem', marginTop: '6px', fontWeight: '600' }}>
                🕐 {booking.show.startTime} · {booking.show.format} · {booking.show.language}
              </div>
            )}
          </div>

          {/* Reserved Seats List */}
          {booking.seats?.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Selected Seats ({booking.seats.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {booking.seats.map(seat => (
                  <span key={seat.seatId} style={{
                    padding: '6px 12px', backgroundColor: 'rgba(229,9,20,0.15)',
                    border: '1px solid rgba(229,9,20,0.4)', borderRadius: '6px',
                    color: 'var(--accent-red)', fontSize: '0.88rem', fontWeight: '700'
                  }}>
                    {seat.seatId} <span style={{ opacity: 0.7, fontWeight: '400', fontSize: '0.78rem' }}>({seat.seatType} · ₹{seat.price})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Ticket Items for Events */}
          {booking.ticketItems?.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Selected Tickets
              </div>
              {booking.ticketItems.map(item => (
                <div key={item.categoryName} style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: '0.92rem', marginBottom: '6px', padding: '8px 12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px' }}>
                  <span>{item.categoryName} × {item.quantity}</span>
                  <span style={{ fontWeight: '700' }}>₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
          )}

          {/* Promo Code Form */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginBottom: '16px' }}>
            <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '10px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="text"
                  placeholder="Enter Promo Code (e.g. CINE50, FIRST100)"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  style={{
                    width: '100%', padding: '10px 14px 10px 36px', backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)', borderRadius: '8px',
                    color: '#fff', fontSize: '0.88rem', outline: 'none'
                  }}
                />
                <Tag size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
              <button
                type="submit"
                disabled={applyingCoupon || !couponCode.trim()}
                className="btn-outline"
                style={{ padding: '10px 18px', fontSize: '0.88rem', whiteSpace: 'nowrap' }}
              >
                {applyingCoupon ? 'Applying...' : 'Apply Coupon'}
              </button>
            </form>
            {couponSuccess && (
              <div style={{ color: '#22c55e', fontSize: '0.82rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <CheckCircle size={14} /> {couponSuccess}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              {['CINE50', 'FIRST100', 'MOVIE20'].map(code => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setCouponCode(code)}
                  style={{
                    padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem',
                    backgroundColor: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.2)',
                    color: 'var(--text-secondary)', cursor: 'pointer'
                  }}
                >
                  Use {code}
                </button>
              ))}
            </div>
          </div>

          {/* Price Breakdown */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              <span>Subtotal</span>
              <span>₹{booking.subtotal}</span>
            </div>
            {booking.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.88rem', color: '#22c55e', fontWeight: '600' }}>
                <span>Coupon Discount ({booking.couponCode})</span>
                <span>-₹{booking.discount}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              <span>Convenience Fee</span>
              <span>₹{booking.convenienceFee}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              <span>GST (18%)</span>
              <span>₹{booking.tax}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '1.4rem', color: '#fff', paddingTop: '12px', borderTop: '1px solid var(--border-color)', marginTop: '8px' }}>
              <span>Grand Total</span>
              <span style={{ color: 'var(--accent-gold)' }}>₹{booking.totalAmount}</span>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <CreditCard size={22} color="var(--accent-red)" />
          <div>
            <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.95rem' }}>Online payment</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '3px' }}>
              UPI, cards, net banking, and wallets, processed securely by Razorpay.
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div style={{
          display: 'flex', gap: '12px', alignItems: 'flex-start',
          padding: '14px', backgroundColor: 'rgba(0, 229, 255, 0.05)',
          border: '1px solid rgba(0, 229, 255, 0.2)', borderRadius: '10px', marginBottom: '24px'
        }}>
          <Shield size={18} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            256-bit encrypted SSL checkout. Your tickets are issued with a verified digital QR code for automated scanning at cinema gates.
          </p>
        </div>

        {error && (
          <div style={{
            display: 'flex', gap: '10px', alignItems: 'center',
            padding: '14px 16px', backgroundColor: 'rgba(229,9,20,0.1)',
            border: '1px solid rgba(229,9,20,0.3)', borderRadius: '10px', marginBottom: '20px'
          }}>
            <AlertCircle size={18} color="var(--accent-red)" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: '0.88rem', color: '#fff' }}>{error}</p>
          </div>
        )}

        {/* Pay Button */}
        <button
          onClick={handlePayment}
          disabled={paying}
          className="btn-primary"
          style={{
            width: '100%', padding: '18px', fontSize: '1.1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            opacity: paying ? 0.7 : 1, cursor: paying ? 'wait' : 'pointer'
          }}
        >
          {paying ? (
            <>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', animation: 'spin 0.8s linear infinite' }} />
              Verifying Payment...
            </>
          ) : (
            <>
              <Lock size={20} />
              Pay ₹{booking.totalAmount} · Confirm Booking
            </>
          )}
        </button>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
