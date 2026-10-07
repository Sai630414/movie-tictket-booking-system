import express from 'express';
import { generatePresignedUrl } from '../controllers/uploadController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/presign', requireAuth, generatePresignedUrl);

export default router;
