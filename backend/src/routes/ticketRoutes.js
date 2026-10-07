import express from 'express';
import { verifyTicket } from '../controllers/ticketController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();
router.post('/verify', requireAuth, requireAdmin, verifyTicket);

export default router;
