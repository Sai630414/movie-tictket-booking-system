import { Booking } from '../models/Booking.js';
import { Payment } from '../models/Payment.js';
import { createRazorpayOrder, verifyPaymentSignature, processWebhookEvent } from '../services/paymentService.js';
import { confirmMovieBooking } from '../services/bookingService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const createOrder = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return errorResponse(res, 'Booking not found', 'NOT_FOUND', 404);
    }

    if (booking.bookingStatus === 'CONFIRMED') {
      return errorResponse(res, 'Booking is already paid and confirmed', 'ALREADY_PAID', 400);
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
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummykey123',
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

    const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);

    if (!isValid) {
      const booking = await Booking.findById(bookingId);
      if (booking) {
        booking.paymentStatus = 'FAILED';
        await booking.save();
      }
      return errorResponse(res, 'Invalid Razorpay payment signature', 'INVALID_SIGNATURE', 400);
    }

    const confirmedBooking = await confirmMovieBooking(
      bookingId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    // Update payment record to CAPTURED
    try {
      const payment = await Payment.findOne({ razorpayOrderId });
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
    const signature = req.headers['x-razorpay-signature'] || 'mock_webhook_signature';
    const result = await processWebhookEvent(req.body, signature);
    return res.status(200).json(result);
  } catch (err) {
    console.error('[Razorpay Webhook Error]:', err.message);
    return res.status(400).json({ status: 'error', message: err.message });
  }
};
