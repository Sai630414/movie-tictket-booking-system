import { Booking } from '../models/Booking.js';
import { generateTicketImage } from './ticketImageService.js';
import {
  sendOpenWATicketImage,
  buildWhatsAppTicketMessage,
  formatWhatsAppChatId,
  maskPhoneNumber,
} from './openwa.service.js';

const MAX_AUTO_RETRIES = 3;

/**
 * Check if an error is permanently non-retryable (e.g. bad phone number, opt-out)
 */
const isPermanentFailure = (error) => {
  const msg = (error?.message || '').toLowerCase();
  return (
    msg.includes('invalid phone') ||
    msg.includes('length') ||
    msg.includes('opted out') ||
    msg.includes('recipient is required')
  );
};

/**
 * Execute WhatsApp ticket delivery for a booking with atomic concurrency protection
 * @param {string} bookingId - MongoDB ObjectId or Booking ID
 * @param {Object} [options]
 * @param {boolean} [options.isRetry=false]
 * @returns {Promise<{ success: boolean, status: string, messageId?: string, error?: string }>}
 */
export const processWhatsAppNotification = async (bookingId, { isRetry = false } = {}) => {
  const queryId = bookingId;

  // Concurrency Lock: Claim atomic processing state
  const allowedStatuses = isRetry ? ['PENDING', 'FAILED'] : ['PENDING'];

  const booking = await Booking.findOneAndUpdate(
    {
      $or: [{ _id: queryId }, { bookingId: queryId }],
      bookingStatus: 'CONFIRMED',
      paymentStatus: 'PAID',
      'whatsapp.status': { $in: allowedStatuses },
    },
    {
      $set: { 'whatsapp.status': 'PROCESSING' },
      $inc: { 'whatsapp.attempts': 1 },
    },
    { new: true }
  )
    .populate('movie event venue user show')
    .populate({ path: 'show', populate: { path: 'screen' } });

  if (!booking) {
    const existing = await Booking.findOne({
      $or: [{ _id: queryId }, { bookingId: queryId }],
    }).select('whatsapp bookingStatus paymentStatus');

    if (!existing) {
      return { success: false, status: 'NOT_FOUND', error: 'Booking not found' };
    }
    // Already processing, already sent, or unconfirmed
    return {
      success: true,
      status: existing.whatsapp?.status || 'SKIPPED',
      message: 'Booking notification is already in progress or already completed',
    };
  }

  // Check user consent
  if (booking.whatsappConsent === false) {
    const errReason = 'Customer has not consented to WhatsApp ticket notifications';
    await Booking.updateOne(
      { _id: booking._id },
      { $set: { 'whatsapp.status': 'FAILED', 'whatsapp.lastError': errReason } }
    );
    return { success: false, status: 'FAILED', error: errReason };
  }

  // Resolve Recipient Phone
  const rawPhone = booking.phone || booking.user?.phone;
  if (!rawPhone) {
    const errReason = 'No recipient phone number provided for WhatsApp delivery';
    await Booking.updateOne(
      { _id: booking._id },
      { $set: { 'whatsapp.status': 'FAILED', 'whatsapp.lastError': errReason } }
    );
    console.warn(`[WhatsApp Notification] Failed for booking ${booking.bookingId}: ${errReason}`);
    return { success: false, status: 'FAILED', error: errReason };
  }

  // Validate phone format before ticket image generation
  let validatedChatId;
  try {
    validatedChatId = formatWhatsAppChatId(rawPhone);
  } catch (phoneErr) {
    await Booking.updateOne(
      { _id: booking._id },
      { $set: { 'whatsapp.status': 'FAILED', 'whatsapp.lastError': phoneErr.message } }
    );
    console.warn(`[WhatsApp Notification] Invalid phone for booking ${booking.bookingId}: ${phoneErr.message}`);
    return { success: false, status: 'FAILED', error: phoneErr.message };
  }

  try {
    // Generate or reuse existing Ticket PNG Image
    let ticketImage;
    if (booking.ticketImage && booking.ticketImage.startsWith('data:image/png;base64,')) {
      ticketImage = {
        dataUrl: booking.ticketImage,
        filename: `CineVerse-Ticket-${booking.bookingId}.png`,
      };
    } else {
      ticketImage = await generateTicketImage(booking);
      // Cache generated ticket image in booking document
      await Booking.updateOne(
        { _id: booking._id },
        { $set: { ticketImage: ticketImage.dataUrl } }
      );
    }

    // Build professional confirmation message caption
    const caption = buildWhatsAppTicketMessage(booking);

    // Send Ticket Image via OpenWA
    const sendResult = await sendOpenWATicketImage(
      validatedChatId,
      ticketImage.dataUrl,
      ticketImage.filename,
      caption
    );

    // Update MongoDB status to SENT
    await Booking.updateOne(
      { _id: booking._id },
      {
        $set: {
          'whatsapp.status': 'SENT',
          'whatsapp.messageId': sendResult.messageId || `owa-${Date.now()}`,
          'whatsapp.sentAt': new Date(),
          'whatsapp.lastError': null,
        },
      }
    );

    console.log(
      `[WhatsApp Notification] Delivered ticket for booking ${booking.bookingId} to ${maskPhoneNumber(validatedChatId)}`
    );

    return {
      success: true,
      status: 'SENT',
      messageId: sendResult.messageId,
      recipient: validatedChatId,
    };
  } catch (deliveryErr) {
    const errorMsg = deliveryErr.message || 'WhatsApp delivery failed';
    const currentAttempts = booking.whatsapp?.attempts || 1;

    console.error(
      `[WhatsApp Notification Error] Delivery attempt ${currentAttempts} failed for ${booking.bookingId}:`,
      errorMsg
    );

    // Update MongoDB status to FAILED (without invalidating payment or booking)
    await Booking.updateOne(
      { _id: booking._id },
      {
        $set: {
          'whatsapp.status': 'FAILED',
          'whatsapp.lastError': errorMsg,
        },
      }
    );

    // Exponential backoff automatic retry if temporary and under retry limit
    if (!isPermanentFailure(deliveryErr) && currentAttempts < MAX_AUTO_RETRIES) {
      const backoffDelay = Math.min(30000, Math.pow(2, currentAttempts) * 1500);
      console.log(
        `[WhatsApp Notification] Scheduling retry ${currentAttempts + 1}/${MAX_AUTO_RETRIES} in ${backoffDelay}ms for ${booking.bookingId}`
      );
      setTimeout(() => {
        processWhatsAppNotification(booking._id, { isRetry: true }).catch((err) => {
          console.error(`[WhatsApp Retry Error] Auto-retry failed:`, err.message);
        });
      }, backoffDelay);
    }

    return {
      success: false,
      status: 'FAILED',
      error: errorMsg,
      attempts: currentAttempts,
    };
  }
};

/**
 * Queue WhatsApp notification in background without blocking payment response
 * @param {string} bookingId
 * @param {Object} [options]
 */
export const queueWhatsAppNotification = (bookingId, options = {}) => {
  setImmediate(() => {
    processWhatsAppNotification(bookingId, options).catch((err) => {
      console.error(`[WhatsApp Queue Error] Background task error for ${bookingId}:`, err.message);
    });
  });
};

/**
 * Admin or Customer explicit manual retry
 * @param {string} bookingId
 * @param {Object} [options]
 * @param {boolean} [options.force=false]
 */
export const retryWhatsAppNotification = async (bookingId, { force = false } = {}) => {
  const booking = await Booking.findOne({
    $or: [{ _id: bookingId }, { bookingId }],
  });

  if (!booking) {
    throw Object.assign(new Error('Booking not found'), { statusCode: 404 });
  }

  if (booking.bookingStatus !== 'CONFIRMED' || booking.paymentStatus !== 'PAID') {
    throw Object.assign(new Error('Only confirmed and paid bookings can receive ticket notifications'), {
      statusCode: 400,
    });
  }

  if (booking.whatsapp?.status === 'SENT' && !force) {
    return {
      success: true,
      status: 'SENT',
      message: 'WhatsApp ticket has already been delivered successfully',
      alreadySent: true,
    };
  }

  // Reset status to PENDING and trigger processing
  await Booking.updateOne(
    { _id: booking._id },
    { $set: { 'whatsapp.status': 'PENDING' } }
  );

  return processWhatsAppNotification(booking._id, { isRetry: true });
};

