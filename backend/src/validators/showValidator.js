import { z } from 'zod';

export const createShowSchema = z.object({
  body: z.object({
    movie: z.string().min(1, 'Movie ID is required'),
    venue: z.string().min(1, 'Venue ID is required'),
    screen: z.string().min(1, 'Screen ID is required'),
    showDate: z.string().or(z.date()),
    startTime: z.string().min(1, 'Start time required'),
    endTime: z.string().optional(),
    language: z.string().min(1, 'Language required'),
    format: z.enum(['2D', '3D', 'IMAX 2D', 'IMAX 3D', '4DX']).optional(),
    basePrice: z.number().min(0, 'Base price must be positive'),
    status: z.enum(['ACTIVE', 'CANCELLED']).optional(),
  }),
});

export const updateShowSchema = z.object({
  body: createShowSchema.shape.body.partial(),
});
