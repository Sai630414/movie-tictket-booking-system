import { Show } from '../models/Show.js';
import { Event } from '../models/Event.js';
import { Booking } from '../models/Booking.js';
import { Notification } from '../models/Notification.js';
import { generateQRCode } from '../utils/qrGenerator.js';

const HOLD_DURATION_MINUTES = 10;

const getScheduledStart = (date, time = '') => {
  const scheduled = new Date(date);
  const match = String(time).trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!Number.isNaN(scheduled.getTime()) && match) {
    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (match[3]) {
      const period = match[3].toUpperCase();
      hours = (hours % 12) + (period === 'PM' ? 12 : 0);
    }
    if (hours <= 23 && minutes <= 59) scheduled.setHours(hours, minutes, 0, 0);
  }
  return scheduled;
};

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

export const expirePendingBookings = async () => {
  const now = new Date();
  const expired = await Booking.find({ bookingStatus: 'PENDING', holdExpiresAt: { $lte: now } }).limit(200);
  for (const booking of expired) {
    const claimed = await Booking.findOneAndUpdate(
      { _id: booking._id, bookingStatus: 'PENDING', holdExpiresAt: { $lte: now } },
      { $set: { bookingStatus: 'EXPIRED', inventoryReserved: false, holdExpiresAt: null }, $inc: { __v: 1 } },
      { new: true }
    );
    if (claimed?.bookingType === 'EVENT') {
      await Promise.all(claimed.ticketItems.map((item) => Event.updateOne(
        { _id: claimed.event, 'ticketCategories.name': item.categoryName },
        { $inc: { 'ticketCategories.$.availableQuantity': item.quantity } }
      )));
    }
  }
};

/**
 * Hold seats for a movie show atomically
 */
export const holdMovieSeats = async (showId, seatIds, userId) => {
  if (new Set(seatIds).size !== seatIds.length) {
    throw { statusCode: 400, message: 'Duplicate seat IDs are not allowed', errorCode: 'DUPLICATE_SEATS' };
  }
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

  try {
    await show.save();
  } catch (err) {
    if (err.name === 'VersionError') {
      throw { statusCode: 409, message: 'Seat availability changed. Please refresh and try again.', errorCode: 'SEAT_UNAVAILABLE' };
    }
    throw err;
  }

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
    if (booking.razorpayOrderId !== razorpayOrderId || booking.razorpayPaymentId !== razorpayPaymentId) {
      throw { statusCode: 409, message: 'Payment does not match the confirmed booking', errorCode: 'PAYMENT_MISMATCH' };
    }
    return booking; // Idempotent return
  }
  if (booking.bookingStatus !== 'PENDING' || (booking.holdExpiresAt && booking.holdExpiresAt <= new Date())) {
    throw { statusCode: 409, message: 'Booking hold has expired', errorCode: 'BOOKING_EXPIRED' };
  }
  if (booking.razorpayOrderId && booking.razorpayOrderId !== razorpayOrderId) {
    throw { statusCode: 400, message: 'Payment order does not match the booking', errorCode: 'ORDER_MISMATCH' };
  }

  if (booking.bookingType === 'MOVIE') {
    const show = await Show.findById(booking.show);
    if (show) {
      const bookedSeatIds = booking.seats.map((s) => s.seatId);
      const now = new Date();
      const bookedSeats = show.seatStatus.filter((seat) => bookedSeatIds.includes(seat.seatId));
      if (bookedSeats.length !== bookedSeatIds.length || bookedSeats.some((seat) =>
        seat.status !== 'HELD' || seat.heldBy?.toString() !== booking.user._id.toString() || !seat.holdExpiresAt || seat.holdExpiresAt <= now
      )) {
        throw { statusCode: 409, message: 'Seat hold expired or no longer belongs to this booking', errorCode: 'HOLD_EXPIRED' };
      }
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
      if (!booking.inventoryReserved) {
        throw { statusCode: 409, message: 'Event ticket reservation expired', errorCode: 'HOLD_EXPIRED' };
      }
      booking.inventoryReserved = false;
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
  booking.holdExpiresAt = null;
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
    startDateTime = getScheduledStart(booking.show.showDate, booking.show.startTime);
  } else if (booking.bookingType === 'EVENT' && booking.event) {
    startDateTime = getScheduledStart(booking.event.date, booking.event.startTime);
  }

  if (startDateTime && !isAdmin) {
    const now = new Date();
    const diffHours = (startDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const bookingAgeMinutes = (now.getTime() - new Date(booking.createdAt).getTime()) / (1000 * 60);

    if (diffHours <= 0 || (diffHours < 6 && bookingAgeMinutes > 30)) {
      throw {
        statusCode: 400,
        message: 'Cancellation is only permitted at least 6 hours before the start time or within 30 minutes of booking.',
        errorCode: 'CANCELLATION_TIME_EXPIRED',
      };
    }
  }

  // Release only inventory still owned by this booking; an expired booking must
  // never free seats that another customer has since held.
  if (booking.bookingType === 'MOVIE' && booking.show) {
    const show = await Show.findById(booking.show);
    if (show) {
      const seatIds = booking.seats.map((s) => s.seatId);
      show.seatStatus.forEach((seat) => {
        const ownedHold = seat.status === 'HELD' && seat.heldBy?.toString() === booking.user.toString();
        const thisBookingSeat = booking.bookingStatus === 'CONFIRMED' && seat.status === 'BOOKED';
        if (seatIds.includes(seat.seatId) && (ownedHold || thisBookingSeat)) {
          seat.status = 'AVAILABLE';
          seat.heldBy = null;
          seat.holdExpiresAt = null;
        }
      });
      await show.save();
    }
  } else if (booking.bookingType === 'EVENT' && booking.event &&
    (booking.inventoryReserved || booking.bookingStatus === 'CONFIRMED')) {
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
  booking.inventoryReserved = false;
  booking.holdExpiresAt = null;
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
