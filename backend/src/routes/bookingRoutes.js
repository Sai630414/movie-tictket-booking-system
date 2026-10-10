import express from 'express';
import {
  createBooking,
  getBookings,
  getBookingById,
  cancelUserBooking,
  applyCouponToBooking,
  sendTicketNotification,
} from '../controllers/bookingController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', requireAuth, createBooking);
router.get('/', requireAuth, getBookings);
router.get('/:id', requireAuth, getBookingById);
router.post('/:id/cancel', requireAuth, cancelUserBooking);
router.post('/:id/apply-coupon', requireAuth, applyCouponToBooking);
router.post('/:id/send-ticket', requireAuth, sendTicketNotification);

export default router;
