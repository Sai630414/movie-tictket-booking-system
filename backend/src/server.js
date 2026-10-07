import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';
import { startHoldCleanerJob } from './jobs/expiredHoldCleaner.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    startHoldCleanerJob();

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
