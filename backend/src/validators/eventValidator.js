import { z } from 'zod';

const ticketCatSchema = z.object({
  name: z.string().min(1, 'Category name required'),
  price: z.number().min(0, 'Price must be >= 0'),
  totalQuantity: z.number().int().min(1, 'Quantity must be >= 1'),
  availableQuantity: z.number().int().min(0).optional(),
});

export const createEventSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Event name is required'),
    description: z.string().min(5, 'Description is required'),
    poster: z.string().min(1, 'Poster is required'),
    banner: z.string().min(1, 'Banner is required'),
    category: z.enum([
      'Concert',
      'Comedy',
      'Sports',
      'Theatre',
      'Festival',
      'Workshop',
      'Exhibition',
      'Conference',
      'Other',
    ]),
    date: z.string().or(z.date()),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().optional(),
    venue: z.string().min(1, 'Venue ID is required'),
    location: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    organizer: z.string().optional(),
    ticketCategories: z.array(ticketCatSchema).min(1, 'At least one ticket category required'),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  }),
});

export const updateEventSchema = z.object({
  body: createEventSchema.shape.body.partial(),
});
