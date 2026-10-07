import mongoose from 'mongoose';

const ticketCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  totalQuantity: {
    type: Number,
    required: true,
    min: 1,
  },
  availableQuantity: {
    type: Number,
    required: true,
    min: 0,
  },
});

const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    poster: {
      type: String,
      required: true,
    },
    banner: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: [
        'Concert',
        'Comedy',
        'Sports',
        'Theatre',
        'Festival',
        'Workshop',
        'Exhibition',
        'Conference',
        'Other',
      ],
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      default: '',
    },
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue',
      required: true,
    },
    location: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      required: true,
      index: true,
    },
    organizer: {
      type: String,
      default: '',
    },
    ticketCategories: [ticketCategorySchema],
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

eventSchema.index({ name: 'text', description: 'text' });

export const Event = mongoose.model('Event', eventSchema);
