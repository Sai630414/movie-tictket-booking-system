import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatTicketMessage,
  generateTicketEmailHtml,
  sendTicketEmail,
  sendTicketWhatsApp,
  sendTicketSMS,
  sendTicketDelivery,
} from '../src/services/deliveryService.js';

const mockBooking = {
  _id: '507f1f77bcf86cd799439011',
  bookingId: 'MOV-2026-TEST01',
  movie: {
    title: 'Cyberpulse: Neo Tokyo 2099',
    poster: 'https://example.com/poster.jpg',
  },
  venue: {
    name: 'PVR ICON Grand',
    address: 'Phoenix Palladium, Lower Parel',
  },
  show: {
    showDate: new Date('2026-10-15T00:00:00.000Z'),
    startTime: '06:45 PM',
  },
  seats: [
    { seatId: 'A1', seatType: 'PREMIUM', price: 250 },
    { seatId: 'A2', seatType: 'PREMIUM', price: 250 },
  ],
  totalAmount: 560,
  qrCode: 'data:image/png;base64,mockqrdata',
  user: {
    email: 'testuser@example.com',
    phone: '+919876543210',
  },
};

test('formatTicketMessage includes core booking, venue, seats, and link details', () => {
  const message = formatTicketMessage(mockBooking);

  assert.ok(message.includes('CineVerse Ticket Confirmed!'));
  assert.ok(message.includes('MOV-2026-TEST01'));
  assert.ok(message.includes('Cyberpulse: Neo Tokyo 2099'));
  assert.ok(message.includes('PVR ICON Grand'));
  assert.ok(message.includes('06:45 PM'));
  assert.ok(message.includes('A1 (PREMIUM), A2 (PREMIUM)'));
  assert.ok(message.includes('₹560'));
  assert.ok(message.includes('/bookings/MOV-2026-TEST01'));
});

test('generateTicketEmailHtml produces well-structured HTML with embedded details', () => {
  const html = generateTicketEmailHtml(mockBooking);

  assert.ok(html.includes('MOV-2026-TEST01'));
  assert.ok(html.includes('Cyberpulse: Neo Tokyo 2099'));
  assert.ok(html.includes('PVR ICON Grand'));
  assert.ok(html.includes('Phoenix Palladium, Lower Parel'));
  assert.ok(html.includes('₹560'));
  assert.ok(html.includes('data:image/png;base64,mockqrdata'));
  assert.ok(html.includes('Scan this QR code'));
});

test('sendTicketEmail returns error when recipient email is missing', async () => {
  const result = await sendTicketEmail(mockBooking, '');
  assert.equal(result.success, false);
  assert.ok(result.error.includes('No recipient email provided'));
});

test('sendTicketWhatsApp & sendTicketSMS gracefully handle missing recipients', async () => {
  const waResult = await sendTicketWhatsApp(mockBooking, '');
  assert.equal(waResult.success, false);
  assert.ok(waResult.error.includes('No recipient phone number provided'));

  const smsResult = await sendTicketSMS(mockBooking, '');
  assert.equal(smsResult.success, false);
  assert.ok(smsResult.error.includes('No recipient phone number provided'));
});

test('sendTicketWhatsApp & sendTicketSMS return simulated success when Twilio is unconfigured', async () => {
  delete process.env.TWILIO_ACCOUNT_SID;
  delete process.env.TWILIO_AUTH_TOKEN;

  const waResult = await sendTicketWhatsApp(mockBooking, '+919876543210');
  assert.equal(waResult.success, true);
  assert.equal(waResult.simulated, true);
  assert.equal(waResult.channel, 'whatsapp');

  const smsResult = await sendTicketSMS(mockBooking, '+919876543210');
  assert.equal(smsResult.success, true);
  assert.equal(smsResult.simulated, true);
  assert.equal(smsResult.channel, 'sms');
});

test('sendTicketDelivery coordinates multi-channel dispatch', async () => {
  const results = await sendTicketDelivery(mockBooking, {
    channels: ['whatsapp', 'sms'],
  });

  assert.ok(results.whatsapp);
  assert.equal(results.whatsapp.success, true);
  assert.ok(results.sms);
  assert.equal(results.sms.success, true);
});
