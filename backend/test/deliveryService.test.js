import test from 'node:test';
import assert from 'node:assert/strict';
import { Booking } from '../src/models/Booking.js';
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
  const result = await sendTicketEmail({ ...mockBooking, user: {} });
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

test('WhatsApp reports a missing approved template configuration without calling Twilio', async () => {
  const oldFetch = globalThis.fetch;
  const oldValues = Object.fromEntries(['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_WHATSAPP_NUMBER', 'TWILIO_WHATSAPP_CONTENT_SID'].map((key) => [key, process.env[key]]));
  process.env.TWILIO_ACCOUNT_SID = 'ACtest';
  process.env.TWILIO_AUTH_TOKEN = 'test-token';
  process.env.TWILIO_WHATSAPP_NUMBER = 'whatsapp:+14155238886';
  delete process.env.TWILIO_WHATSAPP_CONTENT_SID;
  globalThis.fetch = async () => { throw new Error('should not be called'); };
  try {
    const result = await sendTicketWhatsApp(mockBooking, '+919876543210');
    assert.equal(result.success, false);
    assert.match(result.error, /TWILIO_WHATSAPP_CONTENT_SID/);
  } finally {
    globalThis.fetch = oldFetch;
    for (const [key, value] of Object.entries(oldValues)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});

test('unconfigured Twilio channels are marked simulated and failed, never as sent', async () => {
  delete process.env.TWILIO_ACCOUNT_SID;
  delete process.env.TWILIO_AUTH_TOKEN;

  const waResult = await sendTicketWhatsApp(mockBooking, '+919876543210');
  assert.equal(waResult.success, false);
  assert.equal(waResult.simulated, true);
  assert.equal(waResult.channel, 'whatsapp');

  const smsResult = await sendTicketSMS(mockBooking, '+919876543210');
  assert.equal(smsResult.success, false);
  assert.equal(smsResult.simulated, true);
  assert.equal(smsResult.channel, 'sms');
});

test('sendTicketDelivery coordinates multi-channel dispatch', async () => {
  const oldMethods = { findOneAndUpdate: Booking.findOneAndUpdate, findById: Booking.findById, updateOne: Booking.updateOne };
  const oldFetch = globalThis.fetch;
  const originalStatus = process.env.TWILIO_ACCOUNT_SID;
  const originalToken = process.env.TWILIO_AUTH_TOKEN;
  const originalSmsFrom = process.env.TWILIO_PHONE_NUMBER;
  const originalWhatsAppFrom = process.env.TWILIO_WHATSAPP_NUMBER;
  const originalTemplateFields = process.env.TWILIO_WHATSAPP_TEMPLATE_FIELDS;
  let smsStatus = 'PENDING';
  let whatsAppStatus = 'PENDING';
  let apiCalls = 0;
  Booking.findOneAndUpdate = async (filter) => {
    const stateField = filter.confirmationWhatsAppStatus ? 'confirmationWhatsAppStatus' : 'confirmationSmsStatus';
    const current = stateField === 'confirmationWhatsAppStatus' ? whatsAppStatus : smsStatus;
    if (!filter[stateField].$in.includes(current)) return null;
    if (stateField === 'confirmationWhatsAppStatus') whatsAppStatus = 'SENDING';
    else smsStatus = 'SENDING';
    return { _id: mockBooking._id };
  };
  Booking.updateOne = async (filter, update) => {
    if (filter.confirmationWhatsAppStatus) whatsAppStatus = update.$set.confirmationWhatsAppStatus;
    if (filter.confirmationSmsStatus) smsStatus = update.$set.confirmationSmsStatus;
  };
  Booking.findById = async () => ({ confirmationWhatsAppStatus: whatsAppStatus, confirmationSmsStatus: smsStatus });
  Object.assign(process.env, {
    TWILIO_ACCOUNT_SID: 'ACtest', TWILIO_AUTH_TOKEN: 'test-token',
    TWILIO_PHONE_NUMBER: '+15005550006', TWILIO_WHATSAPP_NUMBER: 'whatsapp:+14155238886',
    TWILIO_WHATSAPP_CONTENT_SID: 'HXtest',
    TWILIO_WHATSAPP_TEMPLATE_FIELDS: 'bookingId,title,venue,dateTime,items,amount,ticketUrl',
  });
  globalThis.fetch = async (_url, request) => {
    apiCalls += 1;
    const params = new URLSearchParams(request.body);
    if (params.has('ContentSid')) {
      assert.equal(params.get('From'), 'whatsapp:+14155238886');
      assert.equal(params.get('ContentSid'), 'HXtest');
      assert.deepEqual(Object.keys(JSON.parse(params.get('ContentVariables'))), ['1', '2', '3', '4', '5', '6', '7']);
    }
    else assert.equal(params.get('From'), '+15005550006');
    return new Response(JSON.stringify({ sid: `SM${apiCalls}`, status: 'queued' }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  };
  const booking = { ...mockBooking, bookingStatus: 'CONFIRMED', paymentStatus: 'PAID', user: { ...mockBooking.user, whatsappOptIn: true } };
  try {
    const results = await sendTicketDelivery(booking, { channels: ['whatsapp', 'sms'] });
    assert.equal(results.whatsapp.success, true);
    assert.equal(results.sms.success, true);
    assert.equal(apiCalls, 2);
    const retry = await sendTicketDelivery(booking, { channels: ['whatsapp', 'sms'] });
    assert.equal(retry.whatsapp.alreadySent, true);
    assert.equal(retry.sms.alreadySent, true);
    assert.equal(apiCalls, 2);
  } finally {
    Booking.findOneAndUpdate = oldMethods.findOneAndUpdate;
    Booking.findById = oldMethods.findById;
    Booking.updateOne = oldMethods.updateOne;
    globalThis.fetch = oldFetch;
    for (const [key, value] of Object.entries({ TWILIO_ACCOUNT_SID: originalStatus, TWILIO_AUTH_TOKEN: originalToken, TWILIO_PHONE_NUMBER: originalSmsFrom, TWILIO_WHATSAPP_NUMBER: originalWhatsAppFrom })) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
    delete process.env.TWILIO_WHATSAPP_CONTENT_SID;
    if (originalTemplateFields === undefined) delete process.env.TWILIO_WHATSAPP_TEMPLATE_FIELDS;
    else process.env.TWILIO_WHATSAPP_TEMPLATE_FIELDS = originalTemplateFields;
  }
});

test('WhatsApp opt-out skips delivery without calling Twilio', async () => {
  const oldUpdateOne = Booking.updateOne;
  const oldFetch = globalThis.fetch;
  let apiCalls = 0;
  Booking.updateOne = async () => {};
  globalThis.fetch = async () => { apiCalls += 1; throw new Error('should not be called'); };
  try {
    const booking = { ...mockBooking, bookingStatus: 'CONFIRMED', paymentStatus: 'PAID', user: { ...mockBooking.user, whatsappOptIn: false } };
    const result = await sendTicketDelivery(booking, { channels: ['whatsapp'] });
    assert.equal(result.whatsapp.success, false);
    assert.equal(result.whatsapp.skipped, true);
    assert.equal(result.whatsapp.reason, 'WHATSAPP_OPT_IN_REQUIRED');
    assert.equal(apiCalls, 0);
  } finally {
    Booking.updateOne = oldUpdateOne;
    globalThis.fetch = oldFetch;
  }
});
