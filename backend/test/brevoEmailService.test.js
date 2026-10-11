import test from 'node:test';
import assert from 'node:assert/strict';
import { makeQrAttachment, sendBrevoEmail } from '../src/services/email/brevoEmailService.js';
import { generateQRCode } from '../src/utils/qrGenerator.js';

test('Brevo accepts QR as a named base64 PNG attachment (mocked provider)', async () => {
  const originalFetch = globalThis.fetch;
  const oldEnv = Object.fromEntries(['BREVO_API_KEY', 'BREVO_SENDER_EMAIL', 'BREVO_SENDER_NAME'].map((key) => [key, process.env[key]]));
  let payload;
  process.env.BREVO_API_KEY = 'test-api-key';
  process.env.BREVO_SENDER_EMAIL = 'tickets@example.test';
  process.env.BREVO_SENDER_NAME = 'CineVerse';
  globalThis.fetch = async (_url, options) => {
    payload = JSON.parse(options.body);
    return new Response(JSON.stringify({ messageId: '<mock-message-id>' }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  };

  try {
    const qrCode = await generateQRCode('CINEVERSE-TICKET:opaque-test-token');
    const attachment = makeQrAttachment({ bookingId: 'CV-1', qrCode });
    const result = await sendBrevoEmail({ to: 'guest@example.test', subject: 'Ticket', html: '<p>Your ticket</p>', attachment });
    assert.equal(result.success, true);
    assert.equal(result.messageId, '<mock-message-id>');
    assert.equal(payload.attachment[0].name, 'cineverse-ticket-CV-1.png');
    assert.deepEqual(Object.keys(payload.attachment[0]).sort(), ['content', 'name']);
    assert.deepEqual([...Buffer.from(payload.attachment[0].content, 'base64').subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    assert.equal(payload.to[0].email, 'guest@example.test');
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(oldEnv)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});

test('Brevo provider rejection is reported as failure', async () => {
  const originalFetch = globalThis.fetch;
  const oldEnv = Object.fromEntries(['BREVO_API_KEY', 'BREVO_SENDER_EMAIL'].map((key) => [key, process.env[key]]));
  process.env.BREVO_API_KEY = 'test-api-key';
  process.env.BREVO_SENDER_EMAIL = 'tickets@example.test';
  globalThis.fetch = async () => new Response(JSON.stringify({ code: 'invalid_parameter' }), { status: 400 });
  try {
    const result = await sendBrevoEmail({ to: 'guest@example.test', subject: 'Ticket', html: '<p>Ticket</p>' });
    assert.equal(result.success, false);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(oldEnv)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
