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
    enum: ['REGULAR', 'PREMIUM', 'VIP', 'RECLINER'],
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
