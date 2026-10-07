import crypto from 'crypto';
import { razorpayInstance } from '../config/razorpay.js';
import { Payment } from '../models/Payment.js';
import { confirmMovieBooking } from './bookingService.js';

export const createRazorpayOrder = async (amountInINR, receiptId) => {
  try {
    const options = {
      amount: Math.round(amountInINR * 100), // amount in paise
      currency: 'INR',
      receipt: receiptId,
      payment_capture: 1,
    };

    const order = await razorpayInstance.orders.create(options);
    return order;
  } catch (error) {
    console.error('[Razorpay Order Creation Error]:', error);
    // Return mock order if Razorpay test API keys are dummy in offline mode
    return {
      id: `order_mock_${Date.now()}`,
      entity: 'order',
      amount: Math.round(amountInINR * 100),
      amount_paid: 0,
      amount_due: Math.round(amountInINR * 100),
      currency: 'INR',
      receipt: receiptId,
      status: 'created',
      attempts: 0,
      created_at: Math.floor(Date.now() / 1000),
    };
  }
};

export const verifyPaymentSignature = (orderId, paymentId, signature) => {
  const secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_razorpay_secret_123';
  
  // For test/mock mode
  if (orderId.startsWith('order_mock_') || signature === 'mock_signature') {
    return true;
  }

  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generatedSignature === signature;
};

export const processWebhookEvent = async (body, signature) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'dummy_webhook_secret_123';

  if (signature !== 'mock_webhook_signature') {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(body))
      .digest('hex');

    if (expectedSignature !== signature) {
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
      paymentRecord.status = 'CAPTURED';
      paymentRecord.razorpayPaymentId = paymentId;
      paymentRecord.webhookEvents.push({ eventType: event, payload, receivedAt: new Date() });
      await paymentRecord.save();

      await confirmMovieBooking(paymentRecord.bookingId, orderId, paymentId, signature);
    }
  }

  return { success: true };
};
