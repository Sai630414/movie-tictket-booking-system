import express from 'express';
import {
  getMovies,
  getAvailableMovies,
  getTrendingMovies,
  getPopularMovies,
  getTopRatedMovies,
  getComingSoonMovies,
  getMovieBySlug,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
} from '../controllers/movieController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateRequest.js';
import { createMovieSchema, updateMovieSchema } from '../validators/movieValidator.js';

const router = express.Router();

router.get('/', getMovies);
router.get('/available', getAvailableMovies);
router.get('/trending', getTrendingMovies);
router.get('/popular', getPopularMovies);
router.get('/top-rated', getTopRatedMovies);
router.get('/coming-soon', getComingSoonMovies);
router.get('/slug/:slug', getMovieBySlug);
router.get('/:id', getMovieById);

// Admin routes
router.post('/', requireAuth, requireAdmin, validate(createMovieSchema), createMovie);
router.patch('/:id', requireAuth, requireAdmin, validate(updateMovieSchema), updateMovie);
router.delete('/:id', requireAuth, requireAdmin, deleteMovie);

export default router;
