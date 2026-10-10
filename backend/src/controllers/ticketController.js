import { Booking } from '../models/Booking.js';
import { getScheduledStart } from '../services/bookingService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const getTicketStatus = (booking) => {
  if (!booking) return 'INVALID';
  if (booking.paymentStatus === 'REFUNDED') return 'REFUNDED';
  if (booking.bookingStatus === 'CANCELLED') return 'CANCELLED';
  if (booking.bookingStatus !== 'CONFIRMED' || booking.paymentStatus !== 'PAID') return 'INVALID';

  const date = booking.bookingType === 'EVENT' ? booking.event?.date : booking.show?.showDate;
  const time = booking.bookingType === 'EVENT'
    ? (booking.event?.endTime || booking.event?.startTime)
    : (booking.show?.endTime || booking.show?.startTime);
  if (!date) return 'INVALID';
  if (booking.ticketUsedAt) return 'ALREADY_USED';
  const expiresAt = getScheduledStart(date, time);
  if (!time) expiresAt.setHours(23, 59, 59, 999);
  if (expiresAt < new Date()) return 'EXPIRED';
  return 'VALID';
};

const readQrToken = (qrData) => {
  if (typeof qrData !== 'string') return '';
  const raw = qrData.trim();
  if (raw.startsWith('CINEVERSE-TICKET:')) return raw.slice('CINEVERSE-TICKET:'.length);
  try {
    const payload = JSON.parse(raw);
    if (payload?.type === 'CINEVERSE_TICKET') return String(payload.ticketId || '');
  } catch { /* Existing QR codes contain the plain prefixed token. */ }
  return raw;
};

const getBookingIntegrityStatus = (booking) => {
  if (!booking) return 'INVALID';
  if (booking.bookingStatus === 'CANCELLED' || booking.paymentStatus === 'REFUNDED') return 'CANCELLED';
  if (booking.bookingStatus !== 'CONFIRMED' || booking.paymentStatus !== 'PAID') return 'PAYMENT_NOT_CONFIRMED';
  if (!booking.venue) return 'INVALID';
  if (booking.venue.status !== 'ACTIVE' || booking.venue.active === false) return 'CANCELLED';
  if (booking.bookingType === 'MOVIE') {
    if (!booking.movie || !booking.show) return 'INVALID';
    if (booking.movie.status !== 'ACTIVE' || booking.show.status !== 'ACTIVE') return 'CANCELLED';
    if (!booking.show.screen || String(booking.show.venue?._id || booking.show.venue) !== String(booking.venue._id)) return 'INVALID';
    if (String(booking.show.movie?._id || booking.show.movie) !== String(booking.movie._id)) return 'INVALID';
    return 'VALID';
  }
  if (booking.bookingType === 'EVENT') {
    if (!booking.event) return 'INVALID';
    if (booking.event.status !== 'ACTIVE') return 'CANCELLED';
    if (String(booking.event.venue?._id || booking.event.venue) !== String(booking.venue._id)) return 'INVALID';
    const categories = new Set((booking.event.ticketCategories || []).map((category) => category.name));
    if (!booking.ticketItems?.length || booking.ticketItems.some((item) => !categories.has(item.categoryName) || item.quantity < 1)) return 'INVALID';
    return 'VALID';
  }
  return 'INVALID';
};

export const getTicket = async (req, res, next) => {
  try {
    const token = String(req.params.ticketId || '');
    if (!/^[A-Za-z0-9_-]{40,64}$/.test(token)) {
      return errorResponse(res, 'Ticket not found', 'NOT_FOUND', 404);
    }
    const booking = await Booking.findOne({ ticketToken: token, user: req.user._id })
      .select('+ticketToken')
      .populate('movie event venue show')
      .populate({ path: 'show', populate: { path: 'screen' } });

    if (!booking || booking.bookingStatus !== 'CONFIRMED' || booking.paymentStatus !== 'PAID' ||
      booking.bookingStatus === 'CANCELLED' || booking.paymentStatus === 'REFUNDED') {
      return errorResponse(res, 'This ticket is unavailable or no longer valid', 'TICKET_UNAVAILABLE', 404);
    }

    return successResponse(res, {
      ticketId: token,
      status: getTicketStatus(booking),
      bookingId: booking.bookingId,
      bookingType: booking.bookingType,
      title: booking.movie?.title || booking.event?.name || '',
      venue: { name: booking.venue?.name || '', city: booking.venue?.city || booking.event?.city || '', address: booking.venue?.address || '' },
      date: booking.bookingType === 'EVENT' ? booking.event?.date : booking.show?.showDate,
      time: booking.bookingType === 'EVENT' ? booking.event?.startTime : booking.show?.startTime,
      screen: booking.show?.screen?.name || '',
      seats: booking.seats.map(({ seatId, seatType }) => ({ seatId, seatType })),
      ticketItems: booking.ticketItems.map(({ categoryName, quantity }) => ({ categoryName, quantity })),
      paymentStatus: booking.paymentStatus,
      paymentId: booking.razorpayPaymentId,
      totalAmount: booking.totalAmount,
      qrCode: booking.qrCode,
    }, 'Ticket retrieved');
  } catch (err) {
    next(err);
  }
};

export const verifyTicket = async (req, res, next) => {
  try {
    const token = readQrToken(req.body?.qrData ?? req.body?.ticket ?? req.body?.token);
    if (!/^[A-Za-z0-9_-]{40,64}$/.test(token)) {
      return successResponse(res, { status: 'INVALID', valid: false }, 'Ticket is invalid');
    }

    const booking = await Booking.findOne({ ticketToken: token })
      .select('+ticketToken')
      .populate('movie event venue user ticketUsedBy')
      .populate({ path: 'show', populate: [{ path: 'movie' }, { path: 'venue' }, { path: 'screen' }] });
    let status = getBookingIntegrityStatus(booking);
    if (status === 'VALID') status = getTicketStatus(booking);
    let checkedInAt = booking?.ticketUsedAt || null;
    if (status === 'VALID') {
      checkedInAt = new Date();
      const consumed = await Booking.findOneAndUpdate(
        { _id: booking._id, ticketUsedAt: null, bookingStatus: 'CONFIRMED', paymentStatus: 'PAID' },
        { $set: { ticketUsedAt: checkedInAt, ticketUsedBy: req.user._id } },
        { new: true }
      );
      if (!consumed) {
        const latest = await Booking.findById(booking._id);
        status = latest?.ticketUsedAt ? 'ALREADY_USED' : getTicketStatus(latest);
        checkedInAt = latest?.ticketUsedAt || null;
      } else {
        status = 'CHECKED_IN';
      }
    }

    const accepted = status === 'CHECKED_IN';
    const result = {
      status,
      valid: accepted,
      booking: booking ? {
        bookingId: booking.bookingId,
        bookingType: booking.bookingType,
        bookingStatus: booking.bookingStatus,
        paymentStatus: booking.paymentStatus,
        title: booking.movie?.title || booking.event?.name || '',
        movie: booking.movie?.title || '',
        event: booking.event?.name || '',
        venue: booking.venue?.name || '',
        screen: booking.show?.screen?.name || '',
        showDate: booking.show?.showDate || null,
        showTime: booking.show?.startTime || '',
        eventDate: booking.event?.date || null,
        eventTime: booking.event?.startTime || '',
        seats: booking.seats.map(({ seatId }) => seatId).filter(Boolean),
        ticketItems: booking.ticketItems.map(({ categoryName, quantity }) => ({ categoryName, quantity })),
        customer: booking.user?.name || booking.user?.email || '',
        checkedInAt,
        checkedInBy: accepted ? req.user.name || req.user.email || 'Staff' : booking.ticketUsedBy?.name || booking.ticketUsedBy?.email || '',
      } : null,
    };
    return successResponse(res, result, accepted ? 'Ticket verified and checked in' : `Ticket status: ${status}`);
  } catch (err) {
    next(err);
  }
};
