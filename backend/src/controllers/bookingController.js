import { Booking } from '../models/Booking.js';
import { Show } from '../models/Show.js';
import { Event } from '../models/Event.js';
import { cancelBooking } from '../services/bookingService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const createBooking = async (req, res, next) => {
  try {
    const { bookingType, showId, eventId, seatIds, ticketItems } = req.body;
    const userId = req.user._id;

    if (!bookingType || !['MOVIE', 'EVENT'].includes(bookingType)) {
      return errorResponse(res, 'Invalid booking type', 'BAD_REQUEST', 400);
    }

    let subtotal = 0;
    let selectedSeats = [];
    let selectedTickets = [];
    let venueId = null;
    let movieId = null;
    let finalEventId = null;
    let showObj = null;

    if (bookingType === 'MOVIE') {
      if (!showId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
        return errorResponse(res, 'Show ID and seat IDs are required for movie bookings', 'BAD_REQUEST', 400);
      }

      showObj = await Show.findById(showId).populate('movie venue');
      if (!showObj) {
        return errorResponse(res, 'Show not found', 'NOT_FOUND', 404);
      }

      venueId = showObj.venue._id;
      movieId = showObj.movie._id;

      // Verify seats held by current user or available
      const now = new Date();
      for (const seatId of seatIds) {
        const seat = showObj.seatStatus.find((s) => s.seatId === seatId);
        if (!seat) {
          return errorResponse(res, `Seat ${seatId} not found in screen layout`, 'BAD_REQUEST', 400);
        }

        const isHeldByUser =
          seat.status === 'HELD' &&
          seat.heldBy?.toString() === userId.toString() &&
          seat.holdExpiresAt &&
          new Date(seat.holdExpiresAt) > now;

        if (!isHeldByUser && seat.status !== 'AVAILABLE') {
          return errorResponse(res, `Seat ${seatId} hold has expired or is unavailable`, 'HOLD_EXPIRED', 409);
        }

        subtotal += seat.price;
        selectedSeats.push({
          seatId: seat.seatId,
          row: seat.row,
          number: seat.number,
          seatType: seat.seatType,
          price: seat.price,
        });
      }
    } else if (bookingType === 'EVENT') {
      if (!eventId || !ticketItems || !Array.isArray(ticketItems) || ticketItems.length === 0) {
        return errorResponse(res, 'Event ID and ticket items are required for event bookings', 'BAD_REQUEST', 400);
      }

      const eventObj = await Event.findById(eventId).populate('venue');
      if (!eventObj) {
        return errorResponse(res, 'Event not found', 'NOT_FOUND', 404);
      }

      finalEventId = eventObj._id;
      venueId = eventObj.venue._id;

      for (const item of ticketItems) {
        const cat = eventObj.ticketCategories.find((c) => c.name === item.categoryName);
        if (!cat) {
          return errorResponse(res, `Ticket category '${item.categoryName}' not found`, 'BAD_REQUEST', 400);
        }
        if (cat.availableQuantity < item.quantity) {
          return errorResponse(res, `Not enough tickets available for ${item.categoryName}`, 'INSUFFICIENT_TICKETS', 409);
        }
        subtotal += cat.price * item.quantity;
        selectedTickets.push({
          categoryName: cat.name,
          price: cat.price,
          quantity: item.quantity,
        });
      }
    }

    const couponCode = req.body.couponCode ? req.body.couponCode.trim().toUpperCase() : '';
    let discount = 0;
    if (couponCode) {
      if (couponCode === 'CINE50') {
        discount = Math.min(150, Math.round(subtotal * 0.5));
      } else if (couponCode === 'FIRST100') {
        discount = Math.min(subtotal, 100);
      } else if (couponCode === 'MOVIE20') {
        discount = Math.min(100, Math.round(subtotal * 0.2));
      }
    }

    const convenienceFee = 30;
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = Math.round(taxableAmount * 0.18); // 18% GST
    const totalAmount = Math.max(1, taxableAmount + convenienceFee + tax);

    // Generate unique booking ID: MOV-2026-XXXXXX or EVT-2026-XXXXXX
    const prefix = bookingType === 'MOVIE' ? 'MOV' : 'EVT';
    const year = new Date().getFullYear();
    const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase();
    const bookingId = `${prefix}-${year}-${randomHex}`;

    const booking = await Booking.create({
      bookingId,
      user: userId,
      bookingType,
      movie: movieId,
      event: finalEventId,
      show: showId || null,
      venue: venueId,
      seats: selectedSeats,
      ticketItems: selectedTickets,
      subtotal,
      convenienceFee,
      discount,
      couponCode,
      tax,
      totalAmount,
      paymentStatus: 'CREATED',
      bookingStatus: 'PENDING',
    });

    return successResponse(res, booking, 'Booking created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const applyCouponToBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { couponCode } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return errorResponse(res, 'Booking not found', 'NOT_FOUND', 404);
    }

    if (booking.bookingStatus === 'CONFIRMED') {
      return errorResponse(res, 'Booking is already confirmed', 'ALREADY_CONFIRMED', 400);
    }

    const code = (couponCode || '').trim().toUpperCase();
    let discount = 0;

    if (code === 'CINE50') {
      discount = Math.min(150, Math.round(booking.subtotal * 0.5));
    } else if (code === 'FIRST100') {
      discount = Math.min(booking.subtotal, 100);
    } else if (code === 'MOVIE20') {
      discount = Math.min(100, Math.round(booking.subtotal * 0.2));
    } else {
      return errorResponse(res, 'Invalid coupon code. Try CINE50, FIRST100, or MOVIE20', 'INVALID_COUPON', 400);
    }

    const taxableAmount = Math.max(0, booking.subtotal - discount);
    const tax = Math.round(taxableAmount * 0.18);
    const totalAmount = Math.max(1, taxableAmount + booking.convenienceFee + tax);

    booking.discount = discount;
    booking.couponCode = code;
    booking.tax = tax;
    booking.totalAmount = totalAmount;
    await booking.save();

    return successResponse(res, booking, `Coupon '${code}' applied successfully! You saved ₹${discount}.`);
  } catch (err) {
    next(err);
  }
};

export const getBookings = async (req, res, next) => {
  try {
    const { statusTab } = req.query; // 'upcoming', 'completed', 'cancelled'
    const userId = req.user._id;

    const query = { user: userId };
    const now = new Date();

    if (statusTab === 'upcoming') {
      query.bookingStatus = 'CONFIRMED';
    } else if (statusTab === 'completed') {
      query.bookingStatus = 'COMPLETED';
    } else if (statusTab === 'cancelled') {
      query.bookingStatus = 'CANCELLED';
    }

    const bookings = await Booking.find(query)
      .populate('movie event venue show')
      .sort({ createdAt: -1 });

    return successResponse(res, bookings, 'User bookings retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let query = { _id: id };
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      query = { bookingId: id };
    }

    const booking = await Booking.findOne(query).populate('movie event venue show user');
    if (!booking) {
      return errorResponse(res, 'Booking not found', 'NOT_FOUND', 404);
    }

    if (req.user.role !== 'admin' && booking.user._id.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Unauthorized access to booking', 'FORBIDDEN', 403);
    }

    return successResponse(res, booking, 'Booking details retrieved');
  } catch (err) {
    next(err);
  }
};

export const cancelUserBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user.role === 'admin';

    const cancelledBooking = await cancelBooking(id, req.user._id, isAdmin);
    return successResponse(res, cancelledBooking, 'Booking cancelled successfully');
  } catch (err) {
    if (err.statusCode) {
      return errorResponse(res, err.message, err.errorCode, err.statusCode);
    }
    next(err);
  }
};
