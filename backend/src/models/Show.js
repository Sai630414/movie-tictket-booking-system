import mongoose from 'mongoose';

const showSeatStatusSchema = new mongoose.Schema({
  seatId: {
    type: String, // e.g. A1, A2, B5
    required: true,
  },
  row: {
    type: String,
    required: true,
  },
  number: {
    type: Number,
    required: true,
  },
  seatType: {
    type: String,
    enum: ['REGULAR', 'STANDARD', 'PREMIUM', 'VIP', 'RECLINER'],
    default: 'REGULAR',
  },
  priceMultiplier: {
    type: Number,
    default: 1.0,
  },
  price: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'HELD', 'BOOKED', 'DISABLED'],
    default: 'AVAILABLE',
  },
  heldBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  holdExpiresAt: {
    type: Date,
    default: null,
  },
});

const showSchema = new mongoose.Schema(
  {
    seedKey: { type: String, default: undefined, unique: true, sparse: true },
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: true,
      index: true,
    },
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue',
      required: true,
      index: true,
    },
    screen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Screen',
      required: true,
    },
    showDate: {
      type: Date,
      required: true,
      index: true,
    },
    startTime: {
      type: String, // e.g. "10:30 AM" or "10:30"
      required: true,
    },
    endTime: {
      type: String,
      default: '',
    },
    language: {
      type: String,
      required: true,
    },
    format: {
      type: String,
      enum: ['2D', '3D', 'IMAX 2D', 'IMAX 3D', '4DX'],
      default: '2D',
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'CANCELLED'],
      default: 'ACTIVE',
    },
    seatStatus: [showSeatStatusSchema],
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

showSchema.index({ movie: 1, venue: 1, showDate: 1 });
showSchema.index({ screen: 1, showDate: 1 });

export const Show = mongoose.model('Show', showSchema);
