import { Booking } from '../models/Booking.js';
import { Payment } from '../models/Payment.js';
import { createRazorpayOrder, verifyPaymentSignature, fetchCapturedPayment, processWebhookEvent } from '../services/paymentService.js';
import { confirmMovieBooking } from '../services/bookingService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const createOrder = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) return errorResponse(res, 'Booking ID is required', 'BAD_REQUEST', 400);
    const booking = await Booking.findOne({ _id: bookingId, user: req.user._id });

    if (!booking) {
      return errorResponse(res, 'Booking not found', 'NOT_FOUND', 404);
    }

    if (booking.bookingStatus !== 'PENDING' || booking.paymentStatus === 'PAID') {
      return errorResponse(res, 'Booking is not available for payment', 'BOOKING_UNAVAILABLE', 409);
    }

    const order = await createRazorpayOrder(booking.totalAmount, booking.bookingId);

    booking.razorpayOrderId = order.id;
    booking.paymentStatus = 'PENDING';
    await booking.save();

    await Payment.create({
      razorpayOrderId: order.id,
      bookingId: booking._id,
      user: req.user._id,
      amount: booking.totalAmount,
      currency: 'INR',
      status: 'CREATED',
    });

    return successResponse(
      res,
      {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        booking,
      },
      'Razorpay order created successfully'
    );
  } catch (err) {
    next(err);
  }
};

export const verifyPayment = async (req, res, next) => {
  try {
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const booking = await Booking.findOne({ _id: bookingId, user: req.user._id });
    if (!booking) return errorResponse(res, 'Booking not found', 'NOT_FOUND', 404);
    if (!booking.razorpayOrderId || booking.razorpayOrderId !== razorpayOrderId) {
      return errorResponse(res, 'Payment order does not belong to this booking', 'ORDER_MISMATCH', 400);
    }
    const paymentRecord = await Payment.findOne({ razorpayOrderId, bookingId: booking._id, user: req.user._id });
    if (!paymentRecord || Number(paymentRecord.amount) !== Number(booking.totalAmount)) {
      return errorResponse(res, 'Payment record does not match this booking', 'PAYMENT_MISMATCH', 400);
    }
    if (booking.bookingStatus === 'CONFIRMED' && booking.razorpayPaymentId === razorpayPaymentId) {
      return successResponse(res, booking, 'Payment already verified');
    }
    if (booking.bookingStatus !== 'PENDING') return errorResponse(res, 'Booking is no longer payable', 'BOOKING_UNAVAILABLE', 409);

    const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);

    if (!isValid) {
      return errorResponse(res, 'Invalid Razorpay payment signature', 'INVALID_SIGNATURE', 400);
    }

    const providerPayment = await fetchCapturedPayment(razorpayPaymentId);
    if (providerPayment.order_id !== razorpayOrderId || providerPayment.status !== 'captured' ||
      Number(providerPayment.amount) !== Math.round(booking.totalAmount * 100) || providerPayment.currency !== 'INR') {
      return errorResponse(res, 'Payment is not captured for the expected amount', 'PAYMENT_NOT_CAPTURED', 400);
    }

    const confirmedBooking = await confirmMovieBooking(
      bookingId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    // Update payment record to CAPTURED
    try {
      const payment = paymentRecord;
      if (payment) {
        payment.status = 'CAPTURED';
        payment.razorpayPaymentId = razorpayPaymentId;
        payment.razorpaySignature = razorpaySignature;
        await payment.save();
      }
    } catch (payErr) {
      console.warn('Payment record status update error:', payErr.message);
    }

    return successResponse(res, confirmedBooking, 'Payment verified and booking confirmed successfully');
  } catch (err) {
    next(err);
  }
};

export const handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const result = await processWebhookEvent(req.body, signature, req.rawBody);
    return res.status(200).json(result);
  } catch (err) {
    console.error('[Razorpay Webhook Error]:', err.message);
    return res.status(400).json({ status: 'error', message: err.message });
  }
};
