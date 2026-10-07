import { Booking } from '../models/Booking.js';
import { getScheduledStart } from '../services/bookingService.js';
import { successResponse } from '../utils/apiResponse.js';

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
