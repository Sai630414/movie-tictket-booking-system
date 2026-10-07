import express from 'express';
import { createOrder, verifyPayment, recordPaymentFailure, handleWebhook } from '../controllers/paymentController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create-order', requireAuth, createOrder);
router.post('/verify', requireAuth, verifyPayment);
router.post('/failure', requireAuth, recordPaymentFailure);
router.post('/webhook', handleWebhook);

export default router;
