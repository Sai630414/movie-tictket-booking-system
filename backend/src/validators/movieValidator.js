import { z } from 'zod';

export const createMovieSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(5, 'Description must be at least 5 chars'),
    poster: z.string().min(1, 'Poster URL is required'),
    backdrop: z.string().min(1, 'Backdrop URL is required'),
    trailerUrl: z.string().optional(),
    genre: z.array(z.string()).min(1, 'At least one genre is required'),
    language: z.string().min(1, 'Language is required'),
    duration: z.number().positive('Duration must be positive'),
    rating: z.number().min(0).max(10).optional(),
    cast: z.array(z.string()).optional(),
    director: z.string().optional(),
    releaseDate: z.string().or(z.date()),
    releaseType: z.enum(['NEW_RELEASE', 'RE_RELEASE', 'COMING_SOON']).optional(),
    formats: z.array(z.enum(['2D', '3D', 'IMAX 2D', 'IMAX 3D', '4DX'])).optional(),
    certification: z.enum(['U', 'UA', 'A', 'S']).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  }),
});

export const updateMovieSchema = z.object({
  body: createMovieSchema.shape.body.partial(),
});
