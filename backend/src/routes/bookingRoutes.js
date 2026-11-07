import express from 'express';
import {
  createBooking,
  getBookings,
  getBookingById,
  cancelUserBooking,
  applyCouponToBooking,
  sendTicketNotification,
  getBookingWhatsAppStatus,
  updateBookingContact,
} from '../controllers/bookingController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', requireAuth, createBooking);
router.get('/', requireAuth, getBookings);
router.get('/:id', requireAuth, getBookingById);
router.get('/:id/whatsapp-status', requireAuth, getBookingWhatsAppStatus);
router.patch('/:id/contact', requireAuth, updateBookingContact);
router.post('/:id/cancel', requireAuth, cancelUserBooking);
router.post('/:id/apply-coupon', requireAuth, applyCouponToBooking);
router.post('/:id/send-ticket', requireAuth, sendTicketNotification);

export default router;
