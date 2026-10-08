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
  const expiresAt = getScheduledStart(date, time);
  if (!time) expiresAt.setHours(23, 59, 59, 999);
  if (expiresAt < new Date()) return 'EXPIRED';
  if (booking.ticketUsedAt) return 'ALREADY_USED';
  return 'VALID';
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
    const ticket = String(req.body?.ticket || req.body?.token || '').trim();
    const token = ticket.startsWith('CINEVERSE-TICKET:') ? ticket.slice('CINEVERSE-TICKET:'.length) : ticket;
    if (!/^[A-Za-z0-9_-]{40,64}$/.test(token)) {
      return successResponse(res, { status: 'INVALID', valid: false }, 'Ticket is invalid');
    }

    const booking = await Booking.findOne({ ticketToken: token })
      .select('+ticketToken')
      .populate('movie event venue show');
    let status = getTicketStatus(booking);
    if (status === 'VALID') {
      const consumed = await Booking.findOneAndUpdate(
        { _id: booking._id, ticketUsedAt: null, bookingStatus: 'CONFIRMED', paymentStatus: 'PAID' },
        { $set: { ticketUsedAt: new Date() } },
        { new: true }
      );
      if (!consumed) {
        const latest = await Booking.findById(booking._id);
        status = latest?.ticketUsedAt ? 'ALREADY_USED' : getTicketStatus(latest);
      }
    }

    const latestBooking = booking && status === 'VALID' ? await Booking.findById(booking._id).populate('movie event venue show') : booking;
    const result = {
      status,
      valid: status === 'VALID',
      booking: latestBooking ? {
        bookingId: latestBooking.bookingId,
        bookingType: latestBooking.bookingType,
        bookingStatus: latestBooking.bookingStatus,
        paymentStatus: latestBooking.paymentStatus,
        title: latestBooking.movie?.title || latestBooking.event?.name || '',
        venue: latestBooking.venue?.name || '',
        usedAt: status === 'VALID' ? new Date() : latestBooking.ticketUsedAt || null,
      } : null,
    };
    return successResponse(res, result, status === 'VALID' ? 'Ticket accepted' : `Ticket status: ${status}`);
  } catch (err) {
    next(err);
  }
};
