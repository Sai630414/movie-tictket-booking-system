import mongoose from 'mongoose';

const venueSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['CINEMA', 'EVENT_VENUE'],
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
      index: true,
    },
    state: {
      type: String,
      default: '',
    },
    latitude: {
      type: Number,
      default: 0,
    },
    longitude: {
      type: Number,
      default: 0,
    },
    images: [{
      type: String,
    }],
    description: {
      type: String,
      default: '',
    },
    amenities: [{
      type: String,
    }],
    totalCapacity: {
      type: Number,
      default: 100,
    },
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

venueSchema.index({ city: 1, type: 1 });

export const Venue = mongoose.model('Venue', venueSchema);
