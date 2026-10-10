import express from 'express';
import { getTicket, verifyTicket } from '../controllers/ticketController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();
router.get('/:ticketId', requireAuth, getTicket);
router.post('/verify', requireAuth, requireAdmin, verifyTicket);

export default router;
