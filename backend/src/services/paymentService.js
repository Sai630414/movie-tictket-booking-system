import crypto from 'crypto';
import { isRazorpayConfigured } from '../config/razorpay.js';
import { Payment } from '../models/Payment.js';
import { Booking } from '../models/Booking.js';
import { confirmMovieBooking } from './bookingService.js';
import { sendRefundEmail } from './email/brevoEmailService.js';

const razorpayRequest = async (method, path, body) => {
  if (!isRazorpayConfigured) {
    throw Object.assign(new Error('Razorpay is not configured'), { statusCode: 503, errorCode: 'PAYMENT_UNAVAILABLE' });
  }

  const credentials = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
  let response;
  try {
    response = await fetch(`https://api.razorpay.com/v1${path}`, {
      method,
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(15000),
    });
  } catch (cause) {
    console.error('[Razorpay network request failed]', { method, path, reason: cause?.cause?.code || cause?.name || 'NETWORK_ERROR' });
    throw Object.assign(new Error('Could not connect to Razorpay. Check the backend network connection and retry.'), {
      statusCode: 502,
      errorCode: 'PAYMENT_PROVIDER_UNAVAILABLE',
    });
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw Object.assign(new Error('Razorpay returned an unreadable response. Please retry.'), {
      statusCode: 502,
      errorCode: 'PAYMENT_PROVIDER_INVALID_RESPONSE',
    });
  }

  if (!response.ok) {
    const description = payload?.error?.description || 'Razorpay could not process the payment request.';
    throw Object.assign(new Error(description), {
      statusCode: response.status >= 500 ? 502 : response.status,
      errorCode: payload?.error?.code || 'RAZORPAY_REQUEST_FAILED',
    });
  }
  return payload;
};

export const createRazorpayOrder = async (amountInINR, receiptId) => {
  if (!isRazorpayConfigured) {
    throw Object.assign(new Error('Razorpay is not configured'), { statusCode: 503, errorCode: 'PAYMENT_UNAVAILABLE' });
  }
  const options = {
      amount: Math.round(amountInINR * 100), // amount in paise
      currency: 'INR',
      receipt: receiptId,
      payment_capture: 1,
  };
  return razorpayRequest('POST', '/orders', options);
};

export const createPaymentSignature = (orderId, paymentId) => {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !orderId || !paymentId) return '';

  return crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
};

export const verifyPaymentSignature = (orderId, paymentId, signature) => {
  if (!signature) return false;
  const generatedSignature = createPaymentSignature(orderId, paymentId);
  if (!generatedSignature) return false;

  const expected = Buffer.from(generatedSignature, 'hex');
  const received = Buffer.from(signature, 'hex');
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
};

export const fetchCapturedPayment = async (paymentId) => {
  return razorpayRequest('GET', `/payments/${encodeURIComponent(paymentId)}`);
};

export const fetchRazorpayOrder = async (orderId) => {
  return razorpayRequest('GET', `/orders/${encodeURIComponent(orderId)}`);
};

export const processWebhookEvent = async (body, signature, rawBody) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) throw new Error('Razorpay webhook is not configured');
  {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody || JSON.stringify(body))
      .digest('hex');

    const expected = Buffer.from(expectedSignature, 'hex');
    const received = Buffer.from(signature, 'hex');
    if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
      throw new Error('Invalid webhook signature');
    }
  }

  const event = body.event;
  const payload = body.payload;

  if (event === 'payment.captured') {
    const paymentEntity = payload?.payment?.entity;
    if (!paymentEntity?.order_id || !paymentEntity?.id) throw new Error('Captured payment payload is incomplete');
    const orderId = paymentEntity.order_id;
    const paymentId = paymentEntity.id;

    let paymentRecord = await Payment.findOne({ razorpayOrderId: orderId });
    if (paymentRecord) {
      // Idempotency check
      if (paymentRecord.status === 'CAPTURED') {
        return { message: 'Webhook event already processed' };
      }
      if (Number(paymentEntity.amount) !== Math.round(paymentRecord.amount * 100) || paymentEntity.currency !== paymentRecord.currency) {
        throw new Error('Captured payment amount does not match booking');
      }
      const linkedBooking = await Booking.findOne({ _id: paymentRecord.bookingId, razorpayOrderId: orderId, totalAmount: paymentRecord.amount, bookingStatus: 'PENDING' });
      if (!linkedBooking) throw new Error('Payment order is no longer linked to a payable booking');
      const paymentSignature = createPaymentSignature(orderId, paymentId);
      if (!paymentSignature) throw new Error('Payment signing key is not configured');
      await confirmMovieBooking(paymentRecord.bookingId, orderId, paymentId, paymentSignature);
      paymentRecord.status = 'CAPTURED';
      paymentRecord.razorpayPaymentId = paymentId;
      paymentRecord.webhookEvents.push({ eventType: event, payload, receivedAt: new Date() });
      await paymentRecord.save();
    }
  } else if (event === 'refund.processed' || event === 'payment.refunded') {
    const refundPaymentId = payload?.refund?.entity?.payment_id || payload?.payment?.entity?.id;
    if (!refundPaymentId) throw new Error('Refund event does not identify a payment');
    const paymentRecord = await Payment.findOne({ razorpayPaymentId: refundPaymentId });
    if (paymentRecord) {
      paymentRecord.status = 'REFUNDED';
      paymentRecord.webhookEvents.push({ eventType: event, payload, receivedAt: new Date() });
      await paymentRecord.save();
      const booking = await Booking.findOneAndUpdate(
        { _id: paymentRecord.bookingId, paymentStatus: { $in: ['PAID', 'REFUND_PENDING'] } },
        { $set: { paymentStatus: 'REFUNDED' } },
        { new: true }
      );
      if (booking) {
        try {
          await sendRefundEmail(booking._id);
        } catch (emailError) {
          console.error('[Refund email queue failed]', { bookingId: String(booking._id), reason: emailError.name || 'EMAIL_ERROR' });
        }
      }
    }
  }

  return { success: true };
};
