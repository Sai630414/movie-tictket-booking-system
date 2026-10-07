import mongoose from 'mongoose';

export const connectDB = async () => {
  if (process.env.NODE_ENV === 'production' && !process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required in production');
  }
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/movie_event_booking', {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB Connected] Host: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB Connection Warning]: Could not connect to MongoDB (${error.message}). Please ensure MONGODB_URI is configured in .env.`);
    throw error;
  }
};
