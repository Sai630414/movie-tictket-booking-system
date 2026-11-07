const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const safeImageUrl = value => /^https:\/\//i.test(value || '') ? escapeHtml(value) : '';

const money = value => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0,
}).format(Number(value) || 0);

const dateText = value => {
  if (!value) return 'To be announced';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'To be announced' : new Intl.DateTimeFormat('en-IN', {
    weekday: 'short', day: '2-digit', month: 'long', year: 'numeric',
  }).format(date);
};

const detailRow = (label, value) => `
  <tr>
    <td style="padding:10px 0;border-bottom:1px solid #eceef1;color:#777d87;font-size:13px;vertical-align:top">${escapeHtml(label)}</td>
    <td style="padding:10px 0;border-bottom:1px solid #eceef1;color:#22252b;font-size:14px;font-weight:700;text-align:right;vertical-align:top">${escapeHtml(value || 'Not available')}</td>
  </tr>`;

export const renderBookingEmail = (booking, { kind, frontendUrl }) => {
  const isEvent = booking.bookingType === 'EVENT';
  const title = isEvent ? booking.event?.name : booking.movie?.title;
  const poster = safeImageUrl(isEvent ? (booking.event?.banner || booking.event?.poster) : booking.movie?.poster);
  const venue = booking.venue?.name || (isEvent ? booking.event?.location : '') || 'CineVerse Venue';
  const location = isEvent ? (booking.event?.location || booking.venue?.address) : booking.venue?.address;
  const scheduledDate = isEvent ? booking.event?.date : booking.show?.showDate;
  const startTime = isEvent ? booking.event?.startTime : booking.show?.startTime;
  const endTime = isEvent ? booking.event?.endTime : booking.show?.endTime;
  const showTime = `${startTime || 'To be announced'}${endTime ? ` - ${endTime}` : ''}`;
  const seats = booking.seats || [];
  const ticketItems = booking.ticketItems || [];
  const ticketCount = isEvent
    ? ticketItems.reduce((total, item) => total + Number(item.quantity || 0), 0)
    : seats.length;
  const ticketLabel = isEvent
    ? ticketItems.map(item => `${item.categoryName} × ${item.quantity}`).join(', ')
    : seats.map(seat => seat.seatId).join(', ');
  const kindLabel = kind === 'refund' ? 'REFUND PROCESSED' : kind === 'cancellation' ? 'BOOKING CANCELLED' : 'BOOKING CONFIRMED';
  const accent = kind === 'refund' ? '#087f8c' : kind === 'cancellation' ? '#c62835' : '#16834a';
  const accentBackground = kind === 'refund' ? '#e9f6f8' : kind === 'cancellation' ? '#fdecef' : '#eaf6ee';
  const subtitle = kind === 'refund'
    ? 'Your refund has been processed.'
    : kind === 'cancellation'
      ? 'Your booking has been cancelled.'
      : `Your ${isEvent ? 'event' : 'movie'} plans are all set.`;
  const viewLabel = 'View Ticket';
  const viewUrl = `${String(frontendUrl || '').replace(/\/$/, '')}/ticket/${encodeURIComponent(booking._id)}`;
  const imageBlock = poster ? `
    <tr><td style="padding:0">
      <img src="${poster}" width="620" alt="${escapeHtml(title || 'CineVerse')}" style="display:block;width:100%;max-width:620px;max-height:260px;object-fit:cover;border:0;border-radius:16px 16px 0 0">
    </td></tr>` : '';
  const itemRows = isEvent
    ? ticketItems.map(item => detailRow(item.categoryName, `${item.quantity} x ${money(item.price)} = ${money(Number(item.quantity) * Number(item.price))}`)).join('')
    : seats.map(seat => detailRow(`Seat ${seat.seatId}`, seat.seatType || 'Standard')).join('');
  const qrNotice = kind === 'confirmation' && booking.qrCode ? `
    <tr><td style="padding:0 28px 22px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f7f5;border:1px solid #dce9e0;border-radius:10px">
        <tr><td style="padding:15px 16px;color:#37443b;font-size:13px;line-height:1.6">
          <strong style="color:#176b3c">Your entry QR is attached</strong><br>
          <img src="cid:cineverse-ticket-qr" alt="QR Code" style="display:none" />
          Keep the PNG ticket attachment ready and show its QR code at the entrance. You can also open your digital ticket using the button below.
        </td></tr>
      </table>
    </td></tr>` : '';
  const amountLabel = kind === 'refund' ? 'Refund amount' : kind === 'confirmation' ? 'Total paid' : 'Booking total';
  const totalBlock = detailRow('Subtotal', money(booking.subtotal))
    + detailRow('Convenience fee', money(booking.convenienceFee))
    + detailRow('Tax', money(booking.tax))
    + detailRow('Discount', booking.discount ? `-${money(booking.discount)}${booking.couponCode ? ` (${booking.couponCode})` : ''}` : money(0));
  const paymentStatus = kind === 'refund' ? booking.paymentStatus : booking.paymentStatus || 'PAID';
  const screenRow = !isEvent && booking.show?.screen?.name ? detailRow('Screen', booking.show.screen.name) : '';

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(kindLabel)} - CineVerse</title></head>
<body style="margin:0;padding:0;background:#f1f3f6;color:#22252b;font-family:Arial,Helvetica,sans-serif">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(subtitle)} Booking ${escapeHtml(booking.bookingId)}.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f3f6">
    <tr><td align="center" style="padding:34px 12px">
      <table role="presentation" width="620" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:620px">
        <tr><td style="padding:0 4px 18px">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td width="38" height="38" align="center" valign="middle" style="width:38px;height:38px;border-radius:10px;background:#e50914;color:#fff;font-size:19px;font-weight:800">C</td>
            <td style="padding-left:10px;color:#191b20;font-size:20px;font-weight:800;letter-spacing:.5px">CINEVERSE</td>
          </tr></table>
        </td></tr>
        <tr><td style="overflow:hidden;border:1px solid #e2e5e9;border-radius:16px;background:#fff;box-shadow:0 12px 34px rgba(25,31,40,.08)">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${imageBlock}
            <tr><td style="padding:28px 28px 14px">
              <span style="display:inline-block;padding:6px 10px;border-radius:999px;background:${accentBackground};color:${accent};font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase">${kindLabel}</span>
              <h1 style="margin:14px 0 7px;color:#17191e;font-size:26px;line-height:1.25">${escapeHtml(title || 'Your CineVerse booking')}</h1>
              <p style="margin:0;color:#69717c;font-size:15px;line-height:1.6">${escapeHtml(subtitle)}</p>
            </td></tr>
            <tr><td style="padding:8px 28px 22px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:4px 16px;border:1px solid #e8eaee;border-radius:12px;background:#fafbfc">
                ${detailRow('Venue', venue)}
                ${location ? detailRow('Location', location) : ''}
                ${detailRow('Date', dateText(scheduledDate))}
                ${detailRow('Time', showTime)}
                ${screenRow}
                ${detailRow(isEvent ? 'Ticket types' : 'Seats', ticketLabel || 'Details in your booking')}
                ${detailRow('Ticket quantity', String(ticketCount))}
              </table>
            </td></tr>
            <tr><td style="padding:0 28px 20px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${itemRows}
                ${totalBlock}
                <tr><td style="padding:16px 0 3px;color:#22252b;font-size:14px;font-weight:700">${escapeHtml(amountLabel)}</td><td align="right" style="padding:16px 0 3px;color:#b67c09;font-size:22px;font-weight:800">${money(booking.totalAmount)}</td></tr>
                ${detailRow('Payment status', paymentStatus)}
                ${detailRow('Booking reference', booking.bookingId)}
              </table>
            </td></tr>
            ${qrNotice}
            <tr><td align="center" style="padding:5px 28px 30px">
              <a href="${escapeHtml(viewUrl)}" style="display:inline-block;padding:14px 25px;border-radius:8px;background:#e50914;color:#fff;font-size:14px;font-weight:800;text-decoration:none">${viewLabel}</a>
              <p style="margin:15px 0 0;color:#858b94;font-size:12px;line-height:1.55">Keep your booking reference handy if you contact support.</p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td align="center" style="padding:20px 10px 0;color:#858b94;font-size:12px;line-height:1.7">CineVerse - great stories, shared together.<br>Need help? Contact CineVerse support through the app.</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
};
