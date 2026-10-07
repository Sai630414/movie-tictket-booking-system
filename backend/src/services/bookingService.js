import { Show } from '../models/Show.js';
import { Event } from '../models/Event.js';
import { Booking } from '../models/Booking.js';
import { Notification } from '../models/Notification.js';
import { generateQRCode } from '../utils/qrGenerator.js';

const HOLD_DURATION_MINUTES = 10;

/**
 * Release expired seat holds for a given show or across shows
 */
export const releaseExpiredHolds = async (showId = null) => {
  const now = new Date();
  const query = showId ? { _id: showId } : {};

  const shows = await Show.find(query);
  for (const show of shows) {
    let modified = false;
    show.seatStatus.forEach((seat) => {
      if (seat.status === 'HELD' && seat.holdExpiresAt && seat.holdExpiresAt < now) {
        seat.status = 'AVAILABLE';
        seat.heldBy = null;
        seat.holdExpiresAt = null;
        modified = true;
      }
    });
    if (modified) {
      await show.save();
    }
  }
};

/**
 * Hold seats for a movie show atomically
 */
export const holdMovieSeats = async (showId, seatIds, userId) => {
  await releaseExpiredHolds(showId);

  const show = await Show.findById(showId).populate('movie venue screen');
  if (!show) {
    throw { statusCode: 404, message: 'Show not found', errorCode: 'SHOW_NOT_FOUND' };
  }

  if (show.status !== 'ACTIVE') {
    throw { statusCode: 400, message: 'Show is no longer active', errorCode: 'SHOW_INACTIVE' };
  }

  const now = new Date();
  const holdExpiresAt = new Date(now.getTime() + HOLD_DURATION_MINUTES * 60 * 1000);

  // Check seat availability
  const unavailableSeats = [];
  const selectedSeatObjs = [];

  for (const seatId of seatIds) {
    const seat = show.seatStatus.find((s) => s.seatId === seatId);
    if (!seat) {
      throw { statusCode: 404, message: `Seat ${seatId} does not exist for this show`, errorCode: 'SEAT_NOT_FOUND' };
    }

    const isAvailable =
      seat.status === 'AVAILABLE' ||
      (seat.status === 'HELD' && seat.holdExpiresAt && new Date(seat.holdExpiresAt) < now) ||
      (seat.status === 'HELD' && seat.heldBy?.toString() === userId.toString());

    if (!isAvailable) {
      unavailableSeats.push(seatId);
    } else {
      selectedSeatObjs.push(seat);
    }
  }

  if (unavailableSeats.length > 0) {
    throw {
      statusCode: 409,
      message: `Seats [${unavailableSeats.join(', ')}] are already booked or held by another user.`,
      errorCode: 'SEAT_UNAVAILABLE',
    };
  }

  // Update seat statuses to HELD
  show.seatStatus.forEach((seat) => {
    if (seatIds.includes(seat.seatId)) {
      seat.status = 'HELD';
      seat.heldBy = userId;
      seat.holdExpiresAt = holdExpiresAt;
    }
  });

  await show.save();

  return {
    showId: show._id,
    seats: selectedSeatObjs,
    holdExpiresAt,
    holdDurationMinutes: HOLD_DURATION_MINUTES,
  };
};

/**
 * Confirm Booking after server-side payment verification
 */
export const confirmMovieBooking = async (bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  const booking = await Booking.findById(bookingId).populate('show movie venue user');
  if (!booking) {
    throw { statusCode: 404, message: 'Booking not found', errorCode: 'BOOKING_NOT_FOUND' };
  }

  if (booking.bookingStatus === 'CONFIRMED') {
    return booking; // Idempotent return
  }

  if (booking.bookingType === 'MOVIE') {
    const show = await Show.findById(booking.show);
    if (show) {
      const bookedSeatIds = booking.seats.map((s) => s.seatId);
      show.seatStatus.forEach((seat) => {
        if (bookedSeatIds.includes(seat.seatId)) {
          seat.status = 'BOOKED';
          seat.heldBy = null;
          seat.holdExpiresAt = null;
        }
      });
      await show.save();
    }
  } else if (booking.bookingType === 'EVENT') {
    // Deduct ticket category quantities for Event
    const event = await Event.findById(booking.event);
    if (event) {
      booking.ticketItems.forEach((item) => {
        const cat = event.ticketCategories.find((c) => c.name === item.categoryName);
        if (cat) {
          cat.availableQuantity = Math.max(0, cat.availableQuantity - item.quantity);
        }
      });
      await event.save();
    }
  }

  // Generate QR Code
  const qrData = JSON.stringify({
    bId: booking.bookingId,
    uId: booking.user?._id || booking.user,
    amt: booking.totalAmount,
    time: booking.createdAt,
  });
  const qrCode = await generateQRCode(qrData);

  booking.paymentStatus = 'PAID';
  booking.bookingStatus = 'CONFIRMED';
  booking.razorpayOrderId = razorpayOrderId || booking.razorpayOrderId;
  booking.razorpayPaymentId = razorpayPaymentId;
  booking.razorpaySignature = razorpaySignature;
  booking.qrCode = qrCode;

  await booking.save();

  // Create In-App Notification
  try {
    const titleName = booking.movie?.title || booking.event?.name || 'Ticket Booking';
    await Notification.create({
      user: booking.user?._id || booking.user,
      title: 'Booking Confirmed! 🎟️',
      message: `Your booking #${booking.bookingId} for "${titleName}" has been successfully confirmed. Total: ₹${booking.totalAmount}.`,
      type: 'BOOKING_CONFIRMED',
      referenceId: booking.bookingId,
    });
  } catch (notifErr) {
    console.warn('Notification creation error:', notifErr.message);
  }

  return booking;
};

/**
 * Cancel Booking validation (Must be > 6 hours before show/event time OR within 30 mins of booking)
 */
export const cancelBooking = async (bookingId, userId, isAdmin = false) => {
  const booking = await Booking.findById(bookingId).populate('show event venue');
  if (!booking) {
    throw { statusCode: 404, message: 'Booking not found', errorCode: 'BOOKING_NOT_FOUND' };
  }

  if (!isAdmin && booking.user.toString() !== userId.toString()) {
    throw { statusCode: 403, message: 'Unauthorized to cancel this booking', errorCode: 'FORBIDDEN' };
  }

  if (booking.bookingStatus === 'CANCELLED') {
    throw { statusCode: 400, message: 'Booking is already cancelled', errorCode: 'ALREADY_CANCELLED' };
  }

  // Calculate start time
  let startDateTime;
  if (booking.bookingType === 'MOVIE' && booking.show) {
    const showDate = new Date(booking.show.showDate);
    startDateTime = new Date(showDate);
  } else if (booking.bookingType === 'EVENT' && booking.event) {
    startDateTime = new Date(booking.event.date);
  }

  if (startDateTime && !isAdmin) {
    const now = new Date();
    const diffHours = (startDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const bookingAgeMinutes = (now.getTime() - new Date(booking.createdAt).getTime()) / (1000 * 60);

    if (diffHours < 6 && bookingAgeMinutes > 30) {
      throw {
        statusCode: 400,
        message: 'Cancellation is only permitted at least 6 hours before the start time or within 30 minutes of booking.',
        errorCode: 'CANCELLATION_TIME_EXPIRED',
      };
    }
  }

  // Release seats or restock tickets
  if (booking.bookingType === 'MOVIE' && booking.show) {
    const show = await Show.findById(booking.show);
    if (show) {
      const seatIds = booking.seats.map((s) => s.seatId);
      show.seatStatus.forEach((seat) => {
        if (seatIds.includes(seat.seatId)) {
          seat.status = 'AVAILABLE';
          seat.heldBy = null;
          seat.holdExpiresAt = null;
        }
      });
      await show.save();
    }
  } else if (booking.bookingType === 'EVENT' && booking.event) {
    const event = await Event.findById(booking.event);
    if (event) {
      booking.ticketItems.forEach((item) => {
        const cat = event.ticketCategories.find((c) => c.name === item.categoryName);
        if (cat) {
          cat.availableQuantity += item.quantity;
        }
      });
      await event.save();
    }
  }

  booking.bookingStatus = 'CANCELLED';
  if (booking.paymentStatus === 'PAID') {
    booking.paymentStatus = 'REFUND_PENDING';
  }

  await booking.save();

  // Create cancellation notification
  try {
    const titleName = booking.movie?.title || booking.event?.name || 'Booking';
    await Notification.create({
      user: booking.user?._id || booking.user,
      title: 'Booking Cancelled ❌',
      message: `Your booking #${booking.bookingId} for "${titleName}" has been cancelled. If paid, your refund of ₹${booking.totalAmount} will be processed within 3-5 business days.`,
      type: 'BOOKING_CANCELLED',
      referenceId: booking.bookingId,
    });
  } catch (notifErr) {
    console.warn('Cancellation notification error:', notifErr.message);
  }

  return booking;
};
