import express from 'express';
import {
  getShows,
  getShowById,
  createShow,
  updateShow,
  deleteShow,
} from '../controllers/showController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateRequest.js';
import { createShowSchema, updateShowSchema } from '../validators/showValidator.js';

const router = express.Router();

router.get('/', getShows);
router.get('/:id', getShowById);

// Admin routes
router.post('/', requireAuth, requireAdmin, validate(createShowSchema), createShow);
router.patch('/:id', requireAuth, requireAdmin, validate(updateShowSchema), updateShow);
router.delete('/:id', requireAuth, requireAdmin, deleteShow);

export default router;
