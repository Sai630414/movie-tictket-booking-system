import crypto from 'crypto';
import { razorpayInstance, isRazorpayConfigured } from '../config/razorpay.js';
import { Payment } from '../models/Payment.js';
import { Booking } from '../models/Booking.js';
import { confirmMovieBooking } from './bookingService.js';

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
  return razorpayInstance.orders.create(options);
};

export const verifyPaymentSignature = (orderId, paymentId, signature) => {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !orderId || !paymentId || !signature) return false;

  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const expected = Buffer.from(generatedSignature, 'hex');
  const received = Buffer.from(signature, 'hex');
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
};

export const fetchCapturedPayment = async (paymentId) => {
  if (!isRazorpayConfigured) throw Object.assign(new Error('Razorpay is not configured'), { statusCode: 503 });
  return razorpayInstance.payments.fetch(paymentId);
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
    const paymentEntity = payload.payment.entity;
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
      await confirmMovieBooking(paymentRecord.bookingId, orderId, paymentId, signature);
      paymentRecord.status = 'CAPTURED';
      paymentRecord.razorpayPaymentId = paymentId;
      paymentRecord.webhookEvents.push({ eventType: event, payload, receivedAt: new Date() });
      await paymentRecord.save();
    }
  }

  return { success: true };
};
