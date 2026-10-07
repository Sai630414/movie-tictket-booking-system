import test from 'node:test';
import assert from 'node:assert/strict';
import { getTicketStatus } from '../src/controllers/ticketController.js';

const upcoming = new Date(Date.now() + 24 * 60 * 60 * 1000);

test('ticket verification rejects unpaid, cancelled and refunded bookings', () => {
  const base = { bookingType: 'MOVIE', bookingStatus: 'CONFIRMED', paymentStatus: 'PAID', show: { showDate: upcoming, startTime: '7:30 PM' } };
  assert.equal(getTicketStatus({ ...base, paymentStatus: 'PENDING' }), 'INVALID');
  assert.equal(getTicketStatus({ ...base, bookingStatus: 'CANCELLED' }), 'CANCELLED');
  assert.equal(getTicketStatus({ ...base, paymentStatus: 'REFUNDED' }), 'REFUNDED');
});

test('ticket verification rejects used or expired tickets and accepts a future paid ticket', () => {
  const futureEvent = { bookingType: 'EVENT', bookingStatus: 'CONFIRMED', paymentStatus: 'PAID', event: { date: upcoming, startTime: '7:00 PM', endTime: '10:00 PM' } };
  assert.equal(getTicketStatus({ ...futureEvent, ticketUsedAt: new Date() }), 'ALREADY_USED');
  assert.equal(getTicketStatus({ ...futureEvent, event: { date: new Date(Date.now() - 24 * 60 * 60 * 1000), startTime: '7:00 PM', endTime: '10:00 PM' } }), 'EXPIRED');
  assert.equal(getTicketStatus(futureEvent), 'VALID');
});
