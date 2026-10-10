import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';
import { startHoldCleanerJob } from './jobs/expiredHoldCleaner.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    try {
      await connectDB();
      startHoldCleanerJob();
    } catch (dbErr) {
      if (process.env.NODE_ENV === 'production') {
        throw dbErr;
      }
      console.warn('⚠️ [Database Notice]: Running in development. Please configure MONGODB_URI in backend/.env for database operations.');
    }

    app.listen(PORT, () => {
      console.log(`==================================================`);
      console.log(`🎬 Movie & Event Ticket Booking System API running`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`==================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
