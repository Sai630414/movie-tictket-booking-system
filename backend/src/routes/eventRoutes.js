import express from 'express';
import {
  getEvents,
  getTrendingEvents,
  getNearbyEvents,
  getEventBySlug,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../controllers/eventController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateRequest.js';
import { createEventSchema, updateEventSchema } from '../validators/eventValidator.js';

const router = express.Router();

router.get('/', getEvents);
router.get('/trending', getTrendingEvents);
router.get('/nearby', getNearbyEvents);
router.get('/slug/:slug', getEventBySlug);
router.get('/:id', getEventById);

// Admin routes
router.post('/', requireAuth, requireAdmin, validate(createEventSchema), createEvent);
router.patch('/:id', requireAuth, requireAdmin, validate(updateEventSchema), updateEvent);
router.delete('/:id', requireAuth, requireAdmin, deleteEvent);

export default router;
