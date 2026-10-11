import { sendBookingConfirmation } from './email/brevoEmailService.js';
import { Booking } from '../models/Booking.js';

const isE164 = (phone) => /^\+[1-9]\d{7,14}$/.test(String(phone || '').trim());

const recordProcessingFailure = (channel, error, results) => {
  console.error('[Ticket delivery processing failed]', { channel, reason: error?.name || 'DELIVERY_ERROR' });
  results[channel] = { success: false, channel, error: 'Notification delivery could not be processed' };
};

/**
 * Format human-readable ticket message for SMS and WhatsApp
 */
export const formatTicketMessage = (booking) => {
  const title = booking.movie?.title || booking.event?.name || 'Booking';
  const venueName = booking.venue?.name || 'Cinema Venue';
  const showDateStr = booking.show?.showDate
    ? new Date(booking.show.showDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    : booking.event?.date
    ? new Date(booking.event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    : 'Scheduled Date';
  const timeStr = booking.show?.startTime || booking.event?.startTime || '';

  let seatOrTierStr = '';
  if (booking.seats?.length > 0) {
    seatOrTierStr = `Seats: ${booking.seats.map((s) => `${s.seatId} (${s.seatType})`).join(', ')}`;
  } else if (booking.ticketItems?.length > 0) {
    seatOrTierStr = `Tickets: ${booking.ticketItems.map((t) => `${t.categoryName} x ${t.quantity}`).join(', ')}`;
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const ticketUrl = `${frontendUrl}/bookings/${booking.bookingId || booking._id}`;

  return [
    `🎟️ *CineVerse Ticket Confirmed!*`,
    `Booking ID: #${booking.bookingId}`,
    `Title: *${title}*`,
    `Venue: ${venueName}`,
    `Date & Time: ${showDateStr}${timeStr ? ` at ${timeStr}` : ''}`,
    seatOrTierStr,
    `Total Paid: ₹${booking.totalAmount}`,
    `\nView your digital QR ticket here:`,
    ticketUrl,
  ].filter(Boolean).join('\n');
};

/**
 * Generate responsive HTML email content
 */
export const generateTicketEmailHtml = (booking) => {
  const title = booking.movie?.title || booking.event?.name || 'Ticket Booking';
  const poster = booking.movie?.poster || booking.event?.poster || '';
  const venueName = booking.venue?.name || 'Cinema Venue';
  const venueAddress = booking.venue?.address || '';
  const showDateStr = booking.show?.showDate
    ? new Date(booking.show.showDate).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })
    : booking.event?.date
    ? new Date(booking.event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })
    : '';
  const timeStr = booking.show?.startTime || booking.event?.startTime || '';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const ticketUrl = `${frontendUrl}/bookings/${booking.bookingId || booking._id}`;

  let seatsMarkup = '';
  if (booking.seats?.length > 0) {
    seatsMarkup = `
      <div style="margin-bottom: 16px;">
        <span style="color: #9ca3af; font-size: 12px; text-transform: uppercase;">Seats</span>
        <div style="margin-top: 6px;">
          ${booking.seats
            .map(
              (s) =>
                `<span style="display: inline-block; padding: 4px 10px; background-color: rgba(229, 9, 20, 0.15); border: 1px solid rgba(229, 9, 20, 0.4); border-radius: 6px; color: #ef4444; font-weight: bold; margin-right: 6px; font-size: 13px;">${s.seatId} <small style="font-size: 10px; opacity: 0.8;">(${s.seatType})</small></span>`
            )
            .join('')}
        </div>
      </div>
    `;
  } else if (booking.ticketItems?.length > 0) {
    seatsMarkup = `
      <div style="margin-bottom: 16px;">
        <span style="color: #9ca3af; font-size: 12px; text-transform: uppercase;">Tickets</span>
        <div style="margin-top: 6px;">
          ${booking.ticketItems
            .map(
              (t) =>
                `<div style="display: flex; justify-content: space-between; color: #e5e7eb; font-size: 13px; margin-bottom: 4px;"><span>${t.categoryName} × ${t.quantity}</span><span>₹${t.price * t.quantity}</span></div>`
            )
            .join('')}
        </div>
      </div>
    `;
  }

  const qrMarkup = booking.qrCode
    ? `<div style="text-align: center; margin-top: 24px; padding-top: 20px; border-top: 1px dashed #374151;">
         <p style="color: #9ca3af; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Entry QR Code</p>
         <img src="${booking.qrCode}" alt="Ticket QR" style="width: 140px; height: 140px; border-radius: 8px; border: 6px solid #ffffff; background: #ffffff; display: inline-block;" />
         <p style="color: #6b7280; font-size: 11px; margin-top: 8px;">Scan this QR code at cinema / event gate for entry</p>
       </div>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your CineVerse Ticket - #${booking.bookingId}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f1015; color: #ffffff; margin: 0; padding: 24px;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table width="560" border="0" cellspacing="0" cellpadding="0" style="background-color: #181920; border: 1px solid #2e303d; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #e50914 0%, #b20710 100%); padding: 20px 28px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,0.8);">CineVerse Ticket</span>
                    <h2 style="margin: 4px 0 0; font-size: 20px; font-weight: 800; color: #ffffff;">#${booking.bookingId}</h2>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 6px 12px; background-color: rgba(255,255,255,0.2); border-radius: 20px; font-size: 12px; font-weight: bold; color: #ffffff;">CONFIRMED</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 28px;">
              ${poster ? `<div style="text-align: center; margin-bottom: 20px;"><img src="${poster}" alt="${title}" style="max-height: 180px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.4);" /></div>` : ''}

              <h1 style="margin: 0 0 16px; font-size: 22px; color: #ffffff; font-weight: 800;">${title}</h1>

              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                <tr>
                  <td width="50%" valign="top" style="padding-bottom: 12px;">
                    <span style="color: #9ca3af; font-size: 11px; text-transform: uppercase;">Venue</span>
                    <p style="margin: 4px 0 0; color: #f3f4f6; font-size: 14px; font-weight: 600;">📍 ${venueName}</p>
                    ${venueAddress ? `<p style="margin: 2px 0 0; color: #9ca3af; font-size: 12px;">${venueAddress}</p>` : ''}
                  </td>
                  <td width="50%" valign="top" style="padding-bottom: 12px;">
                    <span style="color: #9ca3af; font-size: 11px; text-transform: uppercase;">Date & Time</span>
                    <p style="margin: 4px 0 0; color: #f3f4f6; font-size: 14px; font-weight: 600;">📅 ${showDateStr}</p>
                    ${timeStr ? `<p style="margin: 2px 0 0; color: #f59e0b; font-size: 13px; font-weight: bold;">🕐 ${timeStr}</p>` : ''}
                  </td>
                </tr>
                <tr>
                  <td width="50%" valign="top">
                    <span style="color: #9ca3af; font-size: 11px; text-transform: uppercase;">Payment Status</span>
                    <p style="margin: 4px 0 0; color: #10b981; font-size: 14px; font-weight: bold;">PAID</p>
                  </td>
                  <td width="50%" valign="top">
                    <span style="color: #9ca3af; font-size: 11px; text-transform: uppercase;">Total Amount</span>
                    <p style="margin: 4px 0 0; color: #f59e0b; font-size: 18px; font-weight: 800;">₹${booking.totalAmount}</p>
                  </td>
                </tr>
              </table>

              ${seatsMarkup}

              ${qrMarkup}

              <div style="text-align: center; margin-top: 28px;">
                <a href="${ticketUrl}" style="display: inline-block; padding: 12px 28px; background-color: #e50914; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 14px; border-radius: 8px;">View Ticket in Browser</a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #121318; padding: 16px 28px; text-align: center; border-top: 1px solid #2e303d;">
              <p style="margin: 0; color: #6b7280; font-size: 11px;">CineVerse Entertainment Inc. · Need help? Contact support@cineverse.com</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

/**
 * Send Ticket via Email
 */
export const sendTicketEmail = async (booking) => {
  if (!booking.user?.email) {
    return { success: false, channel: 'email', error: 'No recipient email provided' };
  }
  const result = await sendBookingConfirmation(booking._id, { retry: true });
  return { ...result, channel: 'email', recipient: booking.user.email };
};

/**
 * Send Ticket via WhatsApp
 */
export const sendTicketWhatsApp = async (booking, recipientPhone) => {
  if (!recipientPhone) {
    return { success: false, channel: 'whatsapp', error: 'No recipient phone number provided' };
  }
  if (!isE164(recipientPhone)) return { success: false, channel: 'whatsapp', error: 'Recipient phone number must use E.164 format' };

  const messageText = formatTicketMessage(booking);
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;
  const contentSid = process.env.TWILIO_WHATSAPP_CONTENT_SID;
  const templateFields = (process.env.TWILIO_WHATSAPP_TEMPLATE_FIELDS || '').split(',').map((field) => field.trim()).filter(Boolean);

  if (accountSid && authToken && fromWhatsAppNumber && !contentSid) {
    return {
      success: false,
      channel: 'whatsapp',
      error: 'TWILIO_WHATSAPP_CONTENT_SID is required for booking notifications. Configure an approved WhatsApp Content Template in Twilio.',
    };
  }

  if (accountSid && authToken && fromWhatsAppNumber && contentSid) {
    try {
      const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const title = booking.movie?.title || booking.event?.name || 'Booking';
      const venueName = booking.venue?.name || 'Cinema Venue';
      const date = booking.show?.showDate
        ? new Date(booking.show.showDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })
        : booking.event?.date
          ? new Date(booking.event.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })
          : 'Scheduled Date';
      const time = booking.show?.startTime || booking.event?.startTime || '';
      const seatsOrTickets = booking.seats?.length
        ? `Seats: ${booking.seats.map((seat) => seat.seatId).join(', ')}`
        : (booking.ticketItems || []).map((ticket) => `${ticket.categoryName} x ${ticket.quantity}`).join(', ');
      const ticketUrl = `${(process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')}/bookings/${encodeURIComponent(booking.bookingId || booking._id)}`;
      const templateValues = {
        bookingId: booking.bookingId || String(booking._id),
        title,
        venue: venueName,
        dateTime: `${date}${time ? ` at ${time}` : ''}`,
        items: seatsOrTickets || 'Ticket details in your digital ticket',
        amount: `INR ${booking.totalAmount}`,
        ticketUrl,
      };
      const unsupportedField = templateFields.find((field) => !Object.hasOwn(templateValues, field));
      if (unsupportedField) {
        return { success: false, channel: 'whatsapp', error: 'TWILIO_WHATSAPP_TEMPLATE_FIELDS contains an unsupported field', code: 'INVALID_TEMPLATE_FIELDS' };
      }
      const contentVariables = Object.fromEntries(templateFields.map((field, index) => [String(index + 1), templateValues[field]]));
      const params = new URLSearchParams({
        From: fromWhatsAppNumber.startsWith('whatsapp:') ? fromWhatsAppNumber : `whatsapp:${fromWhatsAppNumber}`,
        To: `whatsapp:${recipientPhone}`,
        ContentSid: contentSid,
        ...(templateFields.length ? { ContentVariables: JSON.stringify(contentVariables) } : {}),
      });

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const data = await response.json();
      if (!response.ok) {
        throw Object.assign(new Error('Twilio WhatsApp dispatch failed'), { code: data.code, status: response.status });
      }

      return {
        success: true,
        channel: 'whatsapp',
        sid: data.sid,
        status: data.status || 'queued',
        recipient: recipientPhone,
      };
    } catch (err) {
      console.error('[Twilio WhatsApp Error]', { code: err.code || 'TWILIO_REQUEST_FAILED', status: err.status || 0 });
      return { success: false, channel: 'whatsapp', error: 'Twilio could not accept the WhatsApp message', code: err.code || 'TWILIO_REQUEST_FAILED' };
    }
  }

  // Simulation mode
  console.info('[Twilio WhatsApp not configured]', { simulated: true });

  return {
    success: false,
    channel: 'whatsapp',
    simulated: true,
    recipient: recipientPhone,
    error: 'Twilio credentials or WhatsApp sender are not configured',
    message: 'No provider message was sent',
  };
};

/**
 * Send Ticket via SMS
 */
export const sendTicketSMS = async (booking, recipientPhone) => {
  if (!recipientPhone) {
    return { success: false, channel: 'sms', error: 'No recipient phone number provided' };
  }
  if (!isE164(recipientPhone)) return { success: false, channel: 'sms', error: 'Recipient phone number must use E.164 format' };

  const messageText = formatTicketMessage(booking);
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
  const trialTemplate = process.env.TWILIO_SMS_TRIAL_TEMPLATE;

  if (accountSid && authToken && fromPhoneNumber) {
    try {
      const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const params = new URLSearchParams({
        From: fromPhoneNumber,
        To: recipientPhone,
        // Trial accounts accept only Twilio's predefined template names as Body.
        Body: trialTemplate || messageText,
      });

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const data = await response.json();
      if (!response.ok) {
        throw Object.assign(new Error('Twilio SMS dispatch failed'), { code: data.code, status: response.status });
      }

      return {
        success: true,
        channel: 'sms',
        sid: data.sid,
        status: data.status || 'queued',
        recipient: recipientPhone,
      };
    } catch (err) {
      console.error('[Twilio SMS Error]', { code: err.code || 'TWILIO_REQUEST_FAILED', status: err.status || 0 });
      return { success: false, channel: 'sms', error: 'Twilio could not accept the SMS message', code: err.code || 'TWILIO_REQUEST_FAILED' };
    }
  }

  // Simulation mode
  console.info('[Twilio SMS not configured]', { simulated: true });

  return {
    success: false,
    channel: 'sms',
    simulated: true,
    recipient: recipientPhone,
    error: 'Twilio credentials or SMS sender are not configured',
    message: 'No provider message was sent',
  };
};

/**
 * Multi-channel ticket delivery coordinator
 */
export const sendTicketDelivery = async (booking, options = {}) => {
  const channels = options.channels || ['email'];
  // Recipient identity always comes from the persisted booking owner, never request fields.
  const recipientPhone = booking.user?.phone;

  const results = {};
  const promises = [];

  if (channels.includes('email') || channels.includes('all')) {
    promises.push(
      sendTicketEmail(booking).then((res) => {
        results.email = res;
      }).catch((error) => recordProcessingFailure('email', error, results))
    );
  }

  if (channels.includes('whatsapp') || channels.includes('all')) {
    promises.push((async () => {
      const stateField = 'confirmationWhatsAppStatus';
      if (!booking.user?.whatsappOptIn) {
        await Booking.updateOne({ _id: booking._id, [stateField]: { $in: ['PENDING', 'FAILED'] } }, { $set: { [stateField]: 'SKIPPED' } });
        results.whatsapp = { success: false, channel: 'whatsapp', skipped: true, reason: 'WHATSAPP_OPT_IN_REQUIRED' };
        return;
      }
      const claim = await Booking.findOneAndUpdate(
        { _id: booking._id, bookingStatus: 'CONFIRMED', paymentStatus: 'PAID', [stateField]: { $in: ['PENDING', 'FAILED', 'SKIPPED'] } },
        { $set: { [stateField]: 'SENDING' } },
        { new: true }
      );
      if (!claim) {
        const current = await Booking.findById(booking._id);
        results.whatsapp = { success: current?.[stateField] === 'SENT', channel: 'whatsapp', status: current?.[stateField] || 'NOT_CLAIMED', alreadySent: current?.[stateField] === 'SENT' };
        return;
      }
      const result = await sendTicketWhatsApp(booking, recipientPhone);
      await Booking.updateOne(
        { _id: booking._id, [stateField]: 'SENDING' },
        { $set: { [stateField]: result.success ? 'SENT' : 'FAILED', confirmationWhatsAppSid: result.sid || '', confirmationWhatsAppProviderStatus: result.status || '', ...(result.success ? { confirmationWhatsAppSentAt: new Date() } : {}) } }
      );
      results.whatsapp = result;
    })().catch((error) => recordProcessingFailure('whatsapp', error, results)));
  }

  if (channels.includes('sms') || channels.includes('all')) {
    promises.push((async () => {
      const stateField = 'confirmationSmsStatus';
      const claim = await Booking.findOneAndUpdate(
        { _id: booking._id, bookingStatus: 'CONFIRMED', paymentStatus: 'PAID', [stateField]: { $in: ['PENDING', 'FAILED'] } },
        { $set: { [stateField]: 'SENDING' } },
        { new: true }
      );
      if (!claim) {
        const current = await Booking.findById(booking._id);
        results.sms = { success: current?.[stateField] === 'SENT', channel: 'sms', status: current?.[stateField] || 'NOT_CLAIMED', alreadySent: current?.[stateField] === 'SENT' };
        return;
      }
      const result = await sendTicketSMS(booking, recipientPhone);
      await Booking.updateOne(
        { _id: booking._id, [stateField]: 'SENDING' },
        { $set: { [stateField]: result.success ? 'SENT' : 'FAILED', confirmationSmsSid: result.sid || '', confirmationSmsProviderStatus: result.status || '', ...(result.success ? { confirmationSmsSentAt: new Date() } : {}) } }
      );
      results.sms = result;
    })().catch((error) => recordProcessingFailure('sms', error, results)));
  }

  await Promise.allSettled(promises);
  return results;
};
