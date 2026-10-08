import mongoose from 'mongoose';
import { User } from '../models/User.js';

const ensureUserIndexes = async () => {
  const indexes = await User.collection.indexes();
  const emailIndex = indexes.find((index) => index.key?.email === 1);
  if (emailIndex?.unique && !emailIndex.partialFilterExpression) {
    await User.collection.dropIndex(emailIndex.name);
  }
  await User.collection.createIndex({ supabaseUserId: 1 }, { unique: true });
  await User.collection.createIndex(
    { email: 1 },
    { unique: true, partialFilterExpression: { email: { $type: 'string' } } }
  );
  await User.collection.createIndex({ role: 1 });
};

export const connectDB = async () => {
  if (process.env.NODE_ENV === 'production' && !process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required in production');
  }
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/movie_event_booking', {
      serverSelectionTimeoutMS: 5000,
    });
    await ensureUserIndexes();
    console.log(`[MongoDB Connected] Host: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB Connection Warning]: Could not connect to MongoDB (${error.message}). Please ensure MONGODB_URI is configured in .env.`);
    throw error;
  }
};
