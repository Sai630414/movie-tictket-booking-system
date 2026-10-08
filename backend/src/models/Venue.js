import mongoose from 'mongoose';

const venueSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    seedKey: { type: String, default: undefined, unique: true, sparse: true },
    chain: { type: String, default: '' },
    pincode: { type: String, default: '' },
    metadataSourceUrl: { type: String, default: '' },
    type: {
      type: String,
      enum: ['CINEMA', 'EVENT_VENUE'],
      required: true,
    },
    address: {
      type: String,
      required: false,
      default: '',
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
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

venueSchema.index({ city: 1, type: 1 });

export const Venue = mongoose.model('Venue', venueSchema);
