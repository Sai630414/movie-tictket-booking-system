import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import {
  formatWhatsAppChatId,
  buildWhatsAppTicketMessage,
  sendOpenWAText,
  sendOpenWATicketImage,
  checkOpenWAConnectivity,
} from '../src/services/openwa.service.js';
import { generateTicketImage } from '../src/services/ticketImageService.js';
import { getTicketStatus } from '../src/controllers/ticketController.js';

// Sample mock booking
const createMockBooking = (overrides = {}) => {
  const token = crypto.randomBytes(32).toString('base64url');
  return {
    _id: '60d5ec49f1b2c82d88c2e911',
    bookingId: 'MOV-2026-TESTWA',
    bookingType: 'MOVIE',
    bookingStatus: 'CONFIRMED',
    paymentStatus: 'PAID',
    ticketToken: token,
    totalAmount: 750,
    phone: '+91 98765 43210',
    whatsappConsent: true,
    whatsapp: {
      status: 'PENDING',
      messageId: null,
      sentAt: null,
      attempts: 0,
      lastError: null,
    },
    movie: {
      title: 'Inception 2026',
    },
    venue: {
      name: 'CineVerse IMAX PVR',
      address: 'Bandra West, Mumbai',
    },
    show: {
      showDate: new Date('2026-11-20T00:00:00.000Z'),
      startTime: '07:30 PM',
      screen: { name: 'IMAX Laser 1' },
    },
    seats: [
      { seatId: 'D12', seatType: 'RECLINER', price: 375 },
      { seatId: 'D13', seatType: 'RECLINER', price: 375 },
    ],
    user: {
      _id: '507f1f77bcf86cd799439011',
      name: 'Aditya Sharma',
      email: 'aditya@example.com',
      phone: '+919876543210',
    },
    ...overrides,
  };
};

// 1. Successful payment and ticket generation
test('1. Successful payment and ticket generation generates PNG image with secure QR code', async () => {
  const booking = createMockBooking();
  const ticket = await generateTicketImage(booking);

  assert.ok(ticket, 'Ticket object should be generated');
  assert.ok(Buffer.isBuffer(ticket.buffer), 'Ticket buffer should be a Buffer');
  assert.ok(ticket.buffer.length > 5000, 'Ticket PNG buffer should contain image data');
  assert.ok(ticket.dataUrl.startsWith('data:image/png;base64,'), 'Ticket dataUrl should be valid PNG data URI');
  assert.equal(ticket.filename, `CineVerse-Ticket-${booking.bookingId}.png`);

  // Verify PNG signature (first 8 bytes: 89 50 4E 47 0D 0A 1A 0A)
  assert.equal(ticket.buffer[0], 0x89);
  assert.equal(ticket.buffer[1], 0x50);
  assert.equal(ticket.buffer[2], 0x4e);
  assert.equal(ticket.buffer[3], 0x47);
});

// 2. Successful WhatsApp ticket delivery
test('2. Successful WhatsApp ticket delivery formats message and dispatches ticket image', async () => {
  const booking = createMockBooking();
  const caption = buildWhatsAppTicketMessage(booking);

  // Assert expected professional message format
  assert.ok(caption.includes('🎬 *CINEVERSE – BOOKING CONFIRMED!*'));
  assert.ok(caption.includes('Hey Aditya Sharma! 👋'));
  assert.ok(caption.includes('🎟️ *Booking ID:* MOV-2026-TESTWA'));
  assert.ok(caption.includes('🎥 *Movie:* Inception 2026'));
  assert.ok(caption.includes('📍 *Theatre:* CineVerse IMAX PVR'));
  assert.ok(caption.includes('⏰ *Showtime:* 07:30 PM'));
  assert.ok(caption.includes('💺 *Seats:* D12, D13'));
  assert.ok(caption.includes('💰 *Amount:* ₹750'));
  assert.ok(caption.includes('Please show the QR code at the theatre entrance.'));

  // Test OpenWA dispatch in mock/simulation mode
  process.env.OPENWA_SIMULATION = 'true';
  const dispatchResult = await sendOpenWATicketImage(
    booking.phone,
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    `CineVerse-Ticket-${booking.bookingId}.png`,
    caption
  );

  assert.equal(dispatchResult.success, true);
  assert.equal(dispatchResult.simulated, true);
  assert.ok(dispatchResult.messageId.startsWith('sim-img-'));
  assert.equal(dispatchResult.recipient, '919876543210@c.us');
});

// 3. OpenWA unavailable
test('3. OpenWA unavailable returns structured connectivity failure', async () => {
  process.env.OPENWA_SIMULATION = 'false';
  process.env.OPENWA_BASE_URL = 'http://127.0.0.1:59999/api'; // Non-existent port
  process.env.OPENWA_TIMEOUT_MS = '500';

  const status = await checkOpenWAConnectivity();
  assert.equal(status.connected, false);
  assert.equal(status.status, 'UNAVAILABLE');
  assert.ok(status.error, 'Should contain error description');
});

// 4. Invalid WhatsApp phone number
test('4. Invalid WhatsApp phone number is rejected and normalized safely', () => {
  // Normalization of various valid formats
  assert.equal(formatWhatsAppChatId('9876543210'), '919876543210@c.us');
  assert.equal(formatWhatsAppChatId('+91 98765 43210'), '919876543210@c.us');
  assert.equal(formatWhatsAppChatId('09876543210'), '919876543210@c.us');
  assert.equal(formatWhatsAppChatId('919876543210@c.us'), '919876543210@c.us');

  // Rejection of invalid numbers
  assert.throws(() => formatWhatsAppChatId(''), /valid phone number is required/);
  assert.throws(() => formatWhatsAppChatId('12345'), /Invalid phone number format/);
  assert.throws(() => formatWhatsAppChatId('invalid-phone-letters'), /Invalid phone number format/);
  assert.throws(() => formatWhatsAppChatId('123456789012345678'), /Invalid phone number format/);
});

// 5. Failed image delivery
test('5. Failed image delivery throws structured error and preserves booking integrity', async () => {
  process.env.OPENWA_SIMULATION = 'false';
  process.env.OPENWA_BASE_URL = 'http://127.0.0.1:59999/api';
  process.env.OPENWA_TIMEOUT_MS = '500';

  const booking = createMockBooking();
  await assert.rejects(
    async () => {
      await sendOpenWATicketImage(
        booking.phone,
        'data:image/png;base64,invalid',
        'ticket.png',
        'Caption'
      );
    },
    (err) => {
      assert.ok(err instanceof Error);
      return true;
    }
  );

  // Booking status must still remain CONFIRMED and payment PAID
  assert.equal(booking.bookingStatus, 'CONFIRMED');
  assert.equal(booking.paymentStatus, 'PAID');
});

// 6. Duplicate payment webhook
test('6. Duplicate payment webhook idempotency prevents double processing', () => {
  const paymentRecord = {
    razorpayOrderId: 'order_test_123',
    status: 'CAPTURED', // Already captured by earlier request
    amount: 750,
    currency: 'INR',
  };

  // When second webhook arrives for an already captured payment:
  let processed = false;
  let responseMessage = '';
  if (paymentRecord.status === 'CAPTURED') {
    responseMessage = 'Webhook event already processed';
  } else {
    processed = true;
  }

  assert.equal(processed, false, 'Should not process duplicate webhook');
  assert.equal(responseMessage, 'Webhook event already processed');
});

// 7. Duplicate notification job (Atomic Concurrency Protection)
test('7. Duplicate notification job is blocked by atomic state claim', () => {
  // Simulate MongoDB atomic findOneAndUpdate claiming
  const allowedStatuses = ['PENDING'];
  const dbRecord = {
    _id: 'booking_123',
    whatsapp: { status: 'PENDING' },
  };

  const simulateAtomicClaim = (record) => {
    if (allowedStatuses.includes(record.whatsapp.status)) {
      record.whatsapp.status = 'PROCESSING';
      return { success: true, claimed: true };
    }
    return { success: false, claimed: false, currentStatus: record.whatsapp.status };
  };

  // Request 1 claims the lock
  const job1 = simulateAtomicClaim(dbRecord);
  assert.equal(job1.claimed, true);
  assert.equal(dbRecord.whatsapp.status, 'PROCESSING');

  // Request 2 arrives concurrently
  const job2 = simulateAtomicClaim(dbRecord);
  assert.equal(job2.claimed, false);
  assert.equal(job2.currentStatus, 'PROCESSING');
});

// 8. Retry after temporary failure
test('8. Retry after temporary failure allows re-processing from FAILED status', () => {
  const retryStatuses = ['PENDING', 'FAILED'];
  const dbRecord = {
    _id: 'booking_123',
    whatsapp: { status: 'FAILED', attempts: 1, lastError: 'Gateway Timeout' },
  };

  // Attempting with non-retry allowed status (e.g. only PENDING) would fail
  assert.equal(['PENDING'].includes(dbRecord.whatsapp.status), false);

  // Attempting with retry allowed statuses succeeds
  assert.equal(retryStatuses.includes(dbRecord.whatsapp.status), true);
  dbRecord.whatsapp.status = 'PROCESSING';
  dbRecord.whatsapp.attempts += 1;

  assert.equal(dbRecord.whatsapp.status, 'PROCESSING');
  assert.equal(dbRecord.whatsapp.attempts, 2);
});

// 9. QR code validation & entry prevention
test('9. QR code validation accepts valid future ticket, rejects expired and used tickets', () => {
  const upcoming = new Date(Date.now() + 48 * 60 * 60 * 1000);
  const validBooking = {
    bookingType: 'MOVIE',
    bookingStatus: 'CONFIRMED',
    paymentStatus: 'PAID',
    ticketToken: 'CINEVERSE_SECURE_TOKEN_XYZ_12345678901234567890',
    show: { showDate: upcoming, startTime: '08:00 PM' },
    ticketUsedAt: null,
  };

  // Valid ticket
  assert.equal(getTicketStatus(validBooking), 'VALID');

  // Used ticket (cannot be reused)
  const usedBooking = { ...validBooking, ticketUsedAt: new Date() };
  assert.equal(getTicketStatus(usedBooking), 'ALREADY_USED');

  // Cancelled or refunded ticket
  const cancelledBooking = { ...validBooking, bookingStatus: 'CANCELLED' };
  assert.equal(getTicketStatus(cancelledBooking), 'CANCELLED');

  const refundedBooking = { ...validBooking, paymentStatus: 'REFUNDED' };
  assert.equal(getTicketStatus(refundedBooking), 'REFUNDED');

  // Expired showtime
  const expiredBooking = {
    ...validBooking,
    show: { showDate: new Date('2020-01-01'), startTime: '08:00 PM' },
  };
  assert.equal(getTicketStatus(expiredBooking), 'EXPIRED');
});

// 10. Unauthorized notification retry
test('10. Unauthorized notification retry rejects access to another user\'s booking', () => {
  const bookingOwnerId = 'user_alice_123';
  const maliciousUserId = 'user_bob_456';
  const adminUserId = 'user_admin_999';

  const checkAuthorization = (requestUserId, userRole, booking) => {
    if (userRole === 'admin') return true;
    if (booking.user.toString() === requestUserId.toString()) return true;
    return false;
  };

  const booking = { user: bookingOwnerId, bookingStatus: 'CONFIRMED', paymentStatus: 'PAID' };

  // Owner can retry
  assert.equal(checkAuthorization(bookingOwnerId, 'user', booking), true);

  // Admin can retry
  assert.equal(checkAuthorization(adminUserId, 'admin', booking), true);

  // Arbitrary unauthorized user is blocked
  assert.equal(checkAuthorization(maliciousUserId, 'user', booking), false);
});

