import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema(
  {
    title: {
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
    backdrop: {
      type: String,
      required: true,
    },
    trailerUrl: {
      type: String,
      default: '',
    },
    genre: [{
      type: String,
      index: true,
    }],
    language: {
      type: String,
      required: true,
      index: true,
    },
    duration: {
      type: Number, // in minutes
      required: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    cast: [{
      type: String,
    }],
    director: {
      type: String,
      default: '',
    },
    releaseDate: {
      type: Date,
      required: true,
    },
    releaseType: {
      type: String,
      enum: ['NEW_RELEASE', 'RE_RELEASE', 'COMING_SOON'],
      default: 'NEW_RELEASE',
    },
    formats: [{
      type: String,
      enum: ['2D', '3D', 'IMAX 2D', 'IMAX 3D', '4DX'],
      default: ['2D'],
    }],
    certification: {
      type: String,
      enum: ['U', 'UA', 'A', 'S'],
      default: 'UA',
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

movieSchema.index({ title: 'text', description: 'text' }, { default_language: 'english', language_override: 'none' });
movieSchema.index({ status: 1, releaseDate: -1 });

export const Movie = mongoose.model('Movie', movieSchema);
