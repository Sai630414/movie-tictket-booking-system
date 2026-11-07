import express from 'express';
import {
  getWhatsAppStatus,
  getWhatsAppSession,
  sendTestMessage,
  retryBookingWhatsApp,
} from '../controllers/whatsappController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Connectivity & Readiness check (Authenticated users / Admins)
router.get('/status', requireAuth, getWhatsAppStatus);

// Session inspection (Admin only)
router.get('/session', requireAuth, requireAdmin, getWhatsAppSession);

// Send test message (Admin only)
router.post('/test-message', requireAuth, requireAdmin, sendTestMessage);

// Retry WhatsApp notification for a specific booking (Owner or Admin)
router.post('/retry/:bookingId', requireAuth, retryBookingWhatsApp);

export default router;

