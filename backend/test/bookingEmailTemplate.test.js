import test from 'node:test';
import assert from 'node:assert/strict';
import { renderBookingEmail } from '../src/services/email/templates/bookingEmailLayout.js';
import { makeQrAttachment } from '../src/services/email/brevoEmailService.js';
import { generateQRCode } from '../src/utils/qrGenerator.js';

const movieBooking = {
  _id: 'booking-doc-id', bookingId: 'CV-123', bookingType: 'MOVIE', bookingStatus: 'CONFIRMED', paymentStatus: 'PAID',
  subtotal: 600, convenienceFee: 30, tax: 108, discount: 50, couponCode: 'CINE50', totalAmount: 688,
  qrCode: 'data:image/png;base64,cXRlc3Q=',
  movie: { title: '<Orbit & Beyond>', poster: 'https://images.example.test/poster.png' },
  venue: { name: 'CineVerse Cinema', address: 'Mumbai' },
  show: { showDate: '2026-10-25T00:00:00.000Z', startTime: '7:30 PM', endTime: '10:00 PM', screen: { name: 'Screen 3' } },
  seats: [{ seatId: 'F10', price: 300 }, { seatId: 'F11', price: 300 }], user: { email: 'guest@example.test' },
};

test('movie confirmation email includes ticket details and explains its PNG attachment', () => {
  const html = renderBookingEmail(movieBooking, { kind: 'confirmation', frontendUrl: 'https://tickets.example.test' });
  for (const text of ['BOOKING CONFIRMED', 'CineVerse Cinema', 'Screen 3', 'F10, F11', '₹688', 'CV-123', 'Payment status', 'attached as a PNG', 'View Ticket']) {
    assert.ok(html.includes(text), `email should contain ${text}`);
  }
  assert.ok(html.includes('&lt;Orbit &amp; Beyond&gt;'));
  assert.ok(!html.includes('<Orbit & Beyond>'));
  assert.ok(html.includes('https://tickets.example.test/ticket/booking-doc-id'));
});

test('generated QR data URL becomes a named base64 PNG attachment supported by Brevo', async () => {
  const qrCode = await generateQRCode('CINEVERSE-TICKET:opaque-test-token');
  const [attachment] = makeQrAttachment({ ...movieBooking, qrCode });
  assert.equal(attachment.name, 'cineverse-ticket-CV-123.png');
  const png = Buffer.from(attachment.content, 'base64');
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(Object.hasOwn(attachment, 'contentId'), false);
  assert.deepEqual(makeQrAttachment({ ...movieBooking, qrCode: 'data:image/jpeg;base64,cXRlc3Q=' }), []);
});

test('event cancellation and refund emails contain event ticket and status details', () => {
  const eventBooking = {
    ...movieBooking,
    bookingType: 'EVENT',
    event: { name: 'Acoustic Symphony', poster: 'https://images.example.test/event.png', date: '2026-11-05T00:00:00.000Z', startTime: '7 PM', endTime: '10 PM', location: 'BKC' },
    ticketItems: [{ categoryName: 'VIP', price: 1200, quantity: 2 }],
  };
  const cancellation = renderBookingEmail(eventBooking, { kind: 'cancellation', frontendUrl: 'https://tickets.example.test' });
  const refund = renderBookingEmail({ ...eventBooking, paymentStatus: 'REFUNDED' }, { kind: 'refund', frontendUrl: 'https://tickets.example.test' });
  assert.ok(cancellation.includes('BOOKING CANCELLED'));
  assert.ok(cancellation.includes('VIP × 2'));
  assert.ok(cancellation.includes('Acoustic Symphony'));
  assert.ok(refund.includes('REFUND PROCESSED'));
  assert.ok(refund.includes('Refund amount'));
});
