import { z } from 'zod';

export const createVenueSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Venue name required'),
    type: z.enum(['CINEMA', 'EVENT_VENUE']),
    address: z.string().min(1, 'Address required'),
    city: z.string().min(1, 'City required'),
    state: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    images: z.array(z.string()).optional(),
    description: z.string().optional(),
    amenities: z.array(z.string()).optional(),
    totalCapacity: z.number().positive().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  }),
});

export const updateVenueSchema = z.object({
  body: createVenueSchema.shape.body.partial(),
});
