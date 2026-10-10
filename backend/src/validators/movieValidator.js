import { z } from 'zod';

export const createMovieSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(5, 'Description must be at least 5 chars'),
    poster: z.string().url().optional().or(z.literal('')),
    backdrop: z.string().url().optional().or(z.literal('')),
    trailerUrl: z.string().url().optional().or(z.literal('')),
    trailer: z.object({
      provider: z.enum(['youtube']).optional(),
      videoId: z.string().optional(),
      url: z.string().url().optional(),
      title: z.string().optional(),
      thumbnailUrl: z.string().url().optional(),
    }).optional(),
    genre: z.array(z.string()).min(1, 'At least one genre is required'),
    language: z.string().min(1, 'Language is required'),
    duration: z.number().positive('Duration must be positive').optional(),
    rating: z.number().min(0).max(10).optional(),
    cast: z.array(z.string()).optional(),
    director: z.string().optional(),
    releaseDate: z.string().or(z.date()),
    releaseType: z.enum(['NEW_RELEASE', 'RE_RELEASE', 'COMING_SOON', 'CATALOG']).optional(),
    formats: z.array(z.enum(['2D', '3D', 'IMAX 2D', 'IMAX 3D', '4DX'])).optional(),
    certification: z.enum(['U', 'UA', 'A', 'S']).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  }),
});

export const updateMovieSchema = z.object({
  body: createMovieSchema.shape.body.partial(),
});
