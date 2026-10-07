import express from 'express';
import { generatePresignedUrl } from '../controllers/uploadController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/presign', requireAuth, requireAdmin, generatePresignedUrl);

export default router;
