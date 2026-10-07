import express from 'express';
import {
  getVenues,
  getVenueById,
  createVenue,
  updateVenue,
  deleteVenue,
  addScreenToVenue,
} from '../controllers/venueController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateRequest.js';
import { createVenueSchema, updateVenueSchema } from '../validators/venueValidator.js';

const router = express.Router();

router.get('/', getVenues);
router.get('/:id', getVenueById);

// Admin routes
router.post('/', requireAuth, requireAdmin, validate(createVenueSchema), createVenue);
router.patch('/:id', requireAuth, requireAdmin, validate(updateVenueSchema), updateVenue);
router.delete('/:id', requireAuth, requireAdmin, deleteVenue);
router.post('/:id/screens', requireAuth, requireAdmin, addScreenToVenue);

export default router;
