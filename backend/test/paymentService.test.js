import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { verifyPaymentSignature } from '../src/services/paymentService.js';

test('accepts only the HMAC signature for the matching Razorpay order and payment', () => {
  const secret = 'unit-test-secret';
  const orderId = 'order_test_123';
  const paymentId = 'pay_test_456';
  process.env.RAZORPAY_KEY_SECRET = secret;
  const signature = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');

  assert.equal(verifyPaymentSignature(orderId, paymentId, signature), true);
  assert.equal(verifyPaymentSignature('order_mock_123', paymentId, 'mock_signature'), false);
  assert.equal(verifyPaymentSignature(orderId, 'pay_other', signature), false);
  assert.equal(verifyPaymentSignature(orderId, paymentId, 'not-a-hex-signature'), false);
});

test('rejects signatures if the payment secret or required values are missing', () => {
  delete process.env.RAZORPAY_KEY_SECRET;
  assert.equal(verifyPaymentSignature('order_test', 'pay_test', 'signature'), false);
  process.env.RAZORPAY_KEY_SECRET = 'unit-test-secret';
  assert.equal(verifyPaymentSignature('', 'pay_test', 'signature'), false);
});
