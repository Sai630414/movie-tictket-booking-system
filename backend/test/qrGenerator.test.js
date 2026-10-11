import test from 'node:test';
import assert from 'node:assert/strict';
import { generateQRCode } from '../src/utils/qrGenerator.js';

test('ticket QR generator returns a PNG data URL for its opaque ticket payload', async () => {
  const ticketPayload = 'CINEVERSE-TICKET:opaque-test-token';
  const qrCode = await generateQRCode(ticketPayload);
  assert.match(qrCode, /^data:image\/png;base64,/);
  const png = Buffer.from(qrCode.slice('data:image/png;base64,'.length), 'base64');
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.ok(png.length > 100);
});
