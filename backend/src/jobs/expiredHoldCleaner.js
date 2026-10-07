import { releaseExpiredHolds, expirePendingBookings } from '../services/bookingService.js';

export const startHoldCleanerJob = () => {
  // Run hold cleaner every 2 minutes
  setInterval(async () => {
    try {
      await releaseExpiredHolds();
      await expirePendingBookings();
    } catch (err) {
      console.error('[Expired Hold Cleaner Error]:', err.message);
    }
  }, 2 * 60 * 1000);
  console.log('[Job Scheduler] Expired Seat Hold Cleaner initialized.');
};
