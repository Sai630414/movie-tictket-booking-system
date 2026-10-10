const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const safeImageUrl = (value = '') => /^https:\/\//i.test(value) ? escapeHtml(value) : '';
const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const dateText = (value) => value ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'long' }).format(new Date(value)) : 'To be announced';
const row = (label, value) => `<tr><td style="padding:8px 0;color:#a3a3a3;font-size:13px;vertical-align:top">${escapeHtml(label)}</td><td style="padding:8px 0;color:#fff;font-size:14px;font-weight:600;text-align:right">${escapeHtml(value || '—')}</td></tr>`;

export const renderBookingEmail = (booking, { kind, frontendUrl }) => {
  const isEvent = booking.bookingType === 'EVENT';
  const title = isEvent ? booking.event?.name : booking.movie?.title;
  const venue = booking.venue?.name || 'CineVerse Venue';
  const poster = safeImageUrl(isEvent ? (booking.event?.banner || booking.event?.poster) : booking.movie?.poster);
  const show = booking.show;
  const when = isEvent ? booking.event?.date : show?.showDate;
  const startTime = isEvent ? booking.event?.startTime : show?.startTime;
  const endTime = isEvent ? booking.event?.endTime : show?.endTime;
  const location = isEvent ? (booking.event?.location || booking.venue?.address) : booking.venue?.address;
  const items = isEvent
    ? (booking.ticketItems || []).map((item) => `${item.categoryName} × ${item.quantity}`).join(', ')
    : (booking.seats || []).map((seat) => seat.seatId).join(', ');
  const count = isEvent
    ? (booking.ticketItems || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)
    : (booking.seats || []).length;
  const ticketPrice = isEvent
    ? (booking.ticketItems || []).map((item) => `${escapeHtml(item.categoryName)}: ${money(item.price)} × ${Number(item.quantity || 0)}`).join('<br>')
    : (booking.seats || []).map((seat) => `${escapeHtml(seat.seatId)}: ${money(seat.price)}`).join('<br>');
  const heading = kind === 'confirmation' ? 'BOOKING CONFIRMED' : kind === 'refund' ? 'REFUND PROCESSED' : 'BOOKING CANCELLED';
  const subheading = kind === 'confirmation'
    ? `Your ${isEvent ? 'event' : 'movie'} experience is booked!`
    : kind === 'refund' ? 'Your refund has been processed.' : 'Your CineVerse booking has been cancelled.';
  const accent = kind === 'confirmation' ? '#22c55e' : kind === 'refund' ? '#00e5ff' : '#e50914';
  const action = kind === 'confirmation' ? 'View Ticket' : 'View Booking';
  const viewUrl = `${frontendUrl}/ticket/${encodeURIComponent(booking._id)}`;
  const imageBlock = poster ? `<img src="${poster}" width="100%" alt="${escapeHtml(title)}" style="display:block;max-height:240px;object-fit:cover;border-radius:12px 12px 0 0">` : '';
  const ticketPriceBlock = ticketPrice ? `<tr><td colspan="2" style="padding:8px 0;color:#a3a3a3;font-size:13px;line-height:1.7">${ticketPrice}</td></tr>` : '';
  const qrBlock = kind === 'confirmation' && booking.qrCode
    ? '<tr><td colspan="2" align="center" style="padding:24px 0 8px"><img src="cid:cineverse-ticket-qr" width="180" height="180" alt="CineVerse ticket QR code" style="display:block;background:#fff;padding:10px;border-radius:8px"><p style="margin:10px 0 0;color:#a3a3a3;font-size:12px">Show this QR code at the venue entrance.</p></td></tr>'
    : '';
  const paymentLine = kind === 'refund'
    ? row('Refund amount', money(booking.totalAmount))
    : row(kind === 'confirmation' ? 'Amount paid' : 'Booking total', money(booking.totalAmount));
  const showLine = !isEvent && show?.screen?.name ? row('Screen', show.screen.name) : '';
  const dateLine = row('Date', dateText(when));
  const timeLine = row('Time', `${startTime || 'Time to be announced'}${endTime ? ` – ${endTime}` : ''}`);
  const entryInfo = kind === 'confirmation'
    ? (isEvent ? 'Please bring your ticket QR code and a valid photo ID for entry.' : 'Please arrive before showtime and present the ticket QR code at the cinema entrance.')
    : kind === 'refund' ? 'The refund has been initiated to the original payment method. Processing time depends on your bank.' : 'If your booking was paid, the refund will be processed separately according to the refund policy.';

  return `<!doctype html><html><body style="margin:0;padding:24px 10px;background:#141414;font-family:Arial,Helvetica,sans-serif;color:#fff"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:620px;margin:0 auto"><tr><td align="center" style="padding:10px 0 22px"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="width:38px;height:38px;text-align:center;vertical-align:middle;background:#e50914;border-radius:9px;color:#fff;font-size:21px;font-weight:bold">▶</td><td style="padding-left:10px;color:#fff;font-size:23px;font-weight:800;letter-spacing:.5px">CINE<span style="color:#e50914">VERSE</span></td></tr></table></td></tr><tr><td style="background:#222;border:1px solid #333;border-radius:14px;overflow:hidden">${imageBlock}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:28px 30px 8px"><div style="font-size:12px;font-weight:bold;letter-spacing:1.4px;color:${accent}">${heading}</div><h1 style="margin:9px 0 8px;color:#fff;font-size:25px;line-height:1.25">${escapeHtml(title || 'Your CineVerse ticket')}</h1><p style="margin:0;color:#c4c4c4;font-size:15px;line-height:1.6">${subheading}</p></td></tr><tr><td style="padding:18px 30px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${row('Venue', venue)}${row('Location', location)}${dateLine}${timeLine}${showLine}${row(isEvent ? 'Tickets' : 'Seats', items)}${row('Ticket quantity', String(count))}${ticketPriceBlock}<tr><td colspan="2" style="border-top:1px solid #3a3a3a;padding-top:10px"></td></tr>${row('Subtotal', money(booking.subtotal))}${row('Convenience fee', money(booking.convenienceFee))}${row('Tax', money(booking.tax))}${row('Discount', booking.discount ? `−${money(booking.discount)}${booking.couponCode ? ` (${escapeHtml(booking.couponCode)})` : ''}` : money(0))}${paymentLine}${row('Booking ID', booking.bookingId)}${row('Payment status', booking.paymentStatus)}${qrBlock}</table></td></tr><tr><td style="padding:22px 30px 8px;color:#bdbdbd;font-size:13px;line-height:1.65"><strong style="color:#fff">Entry information</strong><br>${entryInfo}</td></tr><tr><td align="center" style="padding:18px 30px 30px"><a href="${escapeHtml(viewUrl)}" style="display:inline-block;background:#e50914;color:#fff;text-decoration:none;font-weight:bold;font-size:15px;padding:14px 28px;border-radius:7px">${action}</a></td></tr></table></td></tr><tr><td align="center" style="padding:20px 12px;color:#777;font-size:12px;line-height:1.7">CineVerse — cinematic entertainment at your fingertips.<br>Questions about this booking? Contact CineVerse support through the app.</td></tr></table></body></html>`;
};
