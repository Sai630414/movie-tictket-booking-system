import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    supabaseUserId: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      default: undefined,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    profileImage: {
      type: String,
      default: '',
    },
    preferredLanguage: {
      type: String,
      default: 'English',
    },
    city: {
      type: String,
      default: 'Vijayawada',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ supabaseUserId: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: 'string' } } });
userSchema.index({ role: 1 });
// email_1 needs a one-time option migration on existing databases; connectDB manages it safely.
userSchema.set('autoIndex', false);

export const User = mongoose.model('User', userSchema);
