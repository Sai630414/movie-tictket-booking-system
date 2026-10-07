import express from 'express';
import { getShowSeats, holdSeats } from '../controllers/seatController.js';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.get('/', optionalAuth, getShowSeats);
router.post('/hold', requireAuth, holdSeats);

export default router;
