import { Booking } from '../../models/Booking.js';
import { renderBookingEmail } from './templates/bookingEmailLayout.js';

const EMAIL_TYPES = {
  confirmation: {
    status: 'confirmationEmailStatus', sentAt: 'confirmationEmailSentAt', messageId: 'confirmationEmailMessageId',
    subject: (booking) => `Booking confirmed: ${booking.bookingId}`,
    eligible: (booking) => booking.bookingStatus === 'CONFIRMED' && booking.paymentStatus === 'PAID',
  },
  cancellation: {
    status: 'cancellationEmailStatus', sentAt: 'cancellationEmailSentAt', messageId: 'cancellationEmailMessageId',
    subject: (booking) => `Booking cancelled: ${booking.bookingId}`,
    eligible: (booking) => booking.bookingStatus === 'CANCELLED',
  },
  refund: {
    status: 'refundEmailStatus', sentAt: 'refundEmailSentAt', messageId: 'refundEmailMessageId',
    subject: (booking) => `Refund processed: ${booking.bookingId}`,
    eligible: (booking) => booking.paymentStatus === 'REFUNDED',
  },
};

const getEmailConfig = () => ({
  apiKey: process.env.BREVO_API_KEY,
  senderEmail: process.env.BREVO_SENDER_EMAIL,
  senderName: process.env.BREVO_SENDER_NAME || 'CineVerse',
  frontendUrl: (process.env.FRONTEND_URL || '').replace(/\/$/, ''),
});

const populatedBooking = (id) => Booking.findById(id)
  .populate('user movie event venue')
  .populate({ path: 'show', populate: { path: 'screen' } });

const makeAttachment = (booking) => {
  if (!booking.qrCode?.startsWith('data:image/png;base64,')) return [];
  return [{
    name: `cineverse-ticket-${booking.bookingId}.png`,
    content: booking.qrCode.slice('data:image/png;base64,'.length),
    contentId: 'cineverse-ticket-qr',
  }];
};

const sendViaBrevo = async ({ to, subject, html, attachment, config }) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': config.apiKey, 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { email: config.senderEmail, name: config.senderName },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        ...(attachment.length ? { attachment } : {}),
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      console.error('[Brevo email delivery failed]', { status: response.status });
      return { success: false };
    }
    const result = await response.json().catch(() => ({}));
    return { success: true, messageId: result.messageId || '' };
  } catch (error) {
    console.error('[Brevo email delivery failed]', { reason: error.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR' });
    return { success: false };
  } finally {
    clearTimeout(timeout);
  }
};

const sendBookingEmail = async (bookingId, kind, { retry = false } = {}) => {
  const definition = EMAIL_TYPES[kind];
  if (!definition) return { success: false, status: 'FAILED' };
  const config = getEmailConfig();
  if (!config.apiKey || !config.senderEmail || !config.frontendUrl) return { success: false, status: 'PENDING', reason: 'EMAIL_NOT_CONFIGURED' };

  const booking = await populatedBooking(bookingId);
  if (!booking || !definition.eligible(booking)) return { success: false, status: 'SKIPPED' };
  if (!booking.user?.email) return { success: false, status: 'FAILED', reason: 'RECIPIENT_UNAVAILABLE' };

  const statusField = definition.status;
  const previousStates = retry ? ['PENDING', 'FAILED'] : ['PENDING'];
  const claimed = await Booking.findOneAndUpdate(
    { _id: bookingId, bookingStatus: booking.bookingStatus, paymentStatus: booking.paymentStatus, [statusField]: { $in: previousStates } },
    { $set: { [statusField]: 'SENDING' } },
    { new: true }
  );
  if (!claimed) return { success: true, status: booking[statusField] };

  const html = renderBookingEmail(booking, { kind, frontendUrl: config.frontendUrl });
  const attachment = kind === 'confirmation' ? makeAttachment(booking) : [];
  const result = await sendViaBrevo({
    to: booking.user.email,
    subject: definition.subject(booking),
    html,
    attachment,
    config,
  });

  if (!result.success) {
    await Booking.updateOne({ _id: bookingId, [statusField]: 'SENDING' }, { $set: { [statusField]: 'FAILED' } });
    return { success: false, status: 'FAILED' };
  }

  await Booking.updateOne(
    { _id: bookingId, [statusField]: 'SENDING' },
    { $set: { [statusField]: 'SENT', [definition.sentAt]: new Date(), [definition.messageId]: result.messageId } }
  );
  return { success: true, status: 'SENT', messageId: result.messageId };
};

export const sendBookingConfirmation = (bookingId, options) => sendBookingEmail(bookingId, 'confirmation', options);
export const sendCancellationEmail = (bookingId, options) => sendBookingEmail(bookingId, 'cancellation', options);
export const sendRefundEmail = (bookingId, options) => sendBookingEmail(bookingId, 'refund', options);

export const retryBookingEmail = (bookingId, kind) => sendBookingEmail(bookingId, kind, { retry: true });
