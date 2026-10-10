import mongoose from 'mongoose';

const seatSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ['ACTIVE', 'DISABLED'],
    default: 'ACTIVE',
  },
});

const screenSchema = new mongoose.Schema(
  {
    seedKey: { type: String, default: undefined, unique: true, sparse: true },
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    format: { type: String, default: '2D' },
    audio: { type: String, default: '' },
    rows: {
      type: Number,
      required: true,
      default: 8,
    },
    columns: {
      type: Number,
      required: true,
      default: 12,
    },
    totalSeats: {
      type: Number,
      required: true,
      default: 96,
    },
    seatLayout: [seatSchema],
  },
  {
    timestamps: true,
  }
);

export const Screen = mongoose.model('Screen', screenSchema);
