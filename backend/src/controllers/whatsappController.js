import {
  checkOpenWAConnectivity,
  getOpenWASessionStatus,
  sendOpenWAText,
  formatWhatsAppChatId,
} from '../services/openwa.service.js';
import { retryWhatsAppNotification } from '../services/whatsappNotificationService.js';
import { Booking } from '../models/Booking.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * Check OpenWA Docker instance connectivity
 * GET /api/whatsapp/status
 */
export const getWhatsAppStatus = async (req, res, next) => {
  try {
    const status = await checkOpenWAConnectivity();
    return successResponse(res, status, 'OpenWA status retrieved');
  } catch (err) {
    next(err);
  }
};

/**
 * Check WhatsApp Session status
 * GET /api/whatsapp/session
 */
export const getWhatsAppSession = async (req, res, next) => {
  try {
    const sessionId = req.query.sessionId;
    const session = await getOpenWASessionStatus(sessionId);
    return successResponse(res, session, 'WhatsApp session status retrieved');
  } catch (err) {
    next(err);
  }
};

/**
 * Send an administrative test message
 * POST /api/whatsapp/test-message
 */
export const sendTestMessage = async (req, res, next) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) {
      return errorResponse(res, 'Phone number and message are required', 'BAD_REQUEST', 400);
    }

    let chatId;
    try {
      chatId = formatWhatsAppChatId(phone);
    } catch (valErr) {
      return errorResponse(res, valErr.message, 'INVALID_PHONE_NUMBER', 400);
    }

    const result = await sendOpenWAText(chatId, message);
    return successResponse(res, result, 'Test message dispatched successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Retry WhatsApp notification for a confirmed booking
 * POST /api/whatsapp/retry/:bookingId
 */
export const retryBookingWhatsApp = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const isAdmin = req.user.role === 'admin';

    let query = { _id: bookingId };
    if (!bookingId.match(/^[0-9a-fA-F]{24}$/)) {
      query = { bookingId };
    }

    const booking = await Booking.findOne(query);
    if (!booking) {
      return errorResponse(res, 'Booking not found', 'NOT_FOUND', 404);
    }

    // Authorization check: Only admin or booking owner can retry
    if (!isAdmin && booking.user.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'You are not authorized to retry notifications for this booking', 'FORBIDDEN', 403);
    }

    if (booking.bookingStatus !== 'CONFIRMED' || booking.paymentStatus !== 'PAID') {
      return errorResponse(res, 'Only paid and confirmed bookings can receive ticket notifications', 'INVALID_STATE', 400);
    }

    const result = await retryWhatsAppNotification(booking._id, { force: isAdmin });

    return successResponse(res, result, 'WhatsApp ticket notification retry triggered');
  } catch (err) {
    if (err.statusCode) {
      return errorResponse(res, err.message, err.errorCode || 'RETRY_ERROR', err.statusCode);
    }
    next(err);
  }
};

