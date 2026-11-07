import QRCode from 'qrcode';
import sharp from 'sharp';

const escapeXml = (unsafe = '') => {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const formatDate = (dateValue) => {
  if (!dateValue) return 'Date to be confirmed';
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return 'Date to be confirmed';
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Build SVG markup for the ticket template
 */
const buildTicketSvg = ({
  bookingId,
  customerName,
  movieTitle,
  venueName,
  venueAddress,
  showDate,
  showTime,
  screenName,
  seatsStr,
  amountStr,
}) => {
  const safeTitle = escapeXml(movieTitle);
  const safeCustomer = escapeXml(customerName);
  const safeBookingId = escapeXml(bookingId);
  const safeVenue = escapeXml(venueName);
  const safeAddress = escapeXml(venueAddress);
  const safeShowDate = escapeXml(showDate);
  const safeShowTime = escapeXml(showTime);
  const safeScreen = escapeXml(screenName || 'Standard Screen');
  const safeSeats = escapeXml(seatsStr);
  const safeAmount = escapeXml(amountStr);

  return `
<svg width="750" height="1060" viewBox="0 0 750 1060" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b0f19"/>
      <stop offset="50%" stop-color="#111827"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>

    <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#e50914"/>
      <stop offset="100%" stop-color="#ff3b30"/>
    </linearGradient>

    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="750" height="1060" fill="url(#bgGrad)"/>

  <!-- Ticket Card Shell -->
  <rect x="25" y="25" width="700" height="1010" rx="20" ry="20"
        fill="#131b2e" stroke="#1f293d" stroke-width="2" filter="url(#cardShadow)"/>

  <!-- Top Accent Bar -->
  <path d="M 25 45 Q 25 25 45 25 L 705 25 Q 725 25 725 45 L 725 35 L 25 35 Z" fill="url(#brandGrad)"/>

  <!-- CineVerse Header -->
  <g transform="translate(55, 65)">
    <!-- Brand Box -->
    <rect x="0" y="0" width="38" height="38" rx="8" ry="8" fill="#e50914"/>
    <text x="19" y="26" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="22" font-weight="900" fill="#ffffff" text-anchor="middle">C</text>

    <!-- Brand Name -->
    <text x="50" y="27" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="24" font-weight="900" fill="#ffffff" letter-spacing="2">CINEVERSE</text>
    <text x="215" y="26" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="12" font-weight="700" fill="#94a3b8" letter-spacing="1">OFFICIAL E-TICKET</text>

    <!-- Status Badge -->
    <rect x="525" y="4" width="115" height="30" rx="15" fill="#14532d" stroke="#22c55e" stroke-width="1.5"/>
    <text x="582" y="24" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="12" font-weight="800" fill="#4ade80" text-anchor="middle" letter-spacing="1">CONFIRMED</text>
  </g>

  <!-- Divider Line -->
  <line x1="55" y1="125" x2="695" y2="125" stroke="#23324d" stroke-width="1.5"/>

  <!-- Movie / Event Title -->
  <text x="55" y="165" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="13" font-weight="700" fill="#e50914" letter-spacing="1.5">NOW SHOWING</text>
  <text x="55" y="205" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="30" font-weight="800" fill="#ffffff">${safeTitle}</text>

  <!-- Theatre & Location -->
  <g transform="translate(55, 230)">
    <text x="0" y="15" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="15" font-weight="700" fill="#e2e8f0">📍 ${safeVenue}</text>
    ${safeAddress ? `<text x="24" y="36" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="12" fill="#94a3b8">${safeAddress}</text>` : ''}
  </g>

  <!-- Info Grid 2x2 -->
  <g transform="translate(55, 290)">
    <!-- Box 1: Customer Name -->
    <rect x="0" y="0" width="305" height="74" rx="12" fill="#1a233a" stroke="#263554" stroke-width="1"/>
    <text x="20" y="26" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="11" font-weight="700" fill="#94a3b8" letter-spacing="1">GUEST NAME</text>
    <text x="20" y="52" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="16" font-weight="700" fill="#ffffff">${safeCustomer}</text>

    <!-- Box 2: Booking ID -->
    <rect x="335" y="0" width="305" height="74" rx="12" fill="#1a233a" stroke="#263554" stroke-width="1"/>
    <text x="355" y="26" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="11" font-weight="700" fill="#94a3b8" letter-spacing="1">BOOKING ID</text>
    <text x="355" y="52" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="16" font-weight="800" fill="#38bdf8" letter-spacing="0.5">${safeBookingId}</text>

    <!-- Box 3: Show Date & Time -->
    <rect x="0" y="90" width="305" height="74" rx="12" fill="#1a233a" stroke="#263554" stroke-width="1"/>
    <text x="20" y="116" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="11" font-weight="700" fill="#94a3b8" letter-spacing="1">DATE &amp; TIME</text>
    <text x="20" y="142" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="15" font-weight="700" fill="#ffffff">${safeShowDate} · ${safeShowTime}</text>

    <!-- Box 4: Screen & Seats -->
    <rect x="335" y="90" width="305" height="74" rx="12" fill="#1a233a" stroke="#263554" stroke-width="1"/>
    <text x="355" y="116" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="11" font-weight="700" fill="#94a3b8" letter-spacing="1">${safeScreen.toUpperCase()}</text>
    <text x="355" y="142" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="15" font-weight="800" fill="#facc15">${safeSeats}</text>
  </g>

  <!-- Total Amount Row -->
  <g transform="translate(55, 480)">
    <rect x="0" y="0" width="640" height="56" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1"/>
    <text x="24" y="34" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="14" font-weight="600" fill="#94a3b8">Total Paid (Incl. GST)</text>
    <text x="616" y="36" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="20" font-weight="900" fill="#22c55e" text-anchor="end">${safeAmount}</text>
  </g>

  <!-- Perforated Tear Line with Notches -->
  <path d="M 25 570 L 45 570" stroke="#475569" stroke-dasharray="8 6" stroke-width="2"/>
  <line x1="45" y1="570" x2="705" y2="570" stroke="#475569" stroke-dasharray="8 6" stroke-width="2"/>
  <!-- Left Notch -->
  <circle cx="25" cy="570" r="16" fill="#0b0f19"/>
  <!-- Right Notch -->
  <circle cx="725" cy="570" r="16" fill="#0b0f19"/>

  <!-- QR Code Container Box -->
  <g transform="translate(255, 605)">
    <rect x="0" y="0" width="240" height="240" rx="16" fill="#ffffff" stroke="#cbd5e1" stroke-width="3"/>
  </g>

  <!-- Instructions below QR -->
  <text x="375" y="875" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="15" font-weight="700" fill="#f8fafc" text-anchor="middle">SHOW THIS QR CODE AT ENTRANCE</text>
  <text x="375" y="902" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="12" fill="#94a3b8" text-anchor="middle">Arrive at least 15 minutes before the showtime · Valid for one-time entry</text>

  <!-- Security Verification Footer -->
  <g transform="translate(55, 935)">
    <rect x="0" y="0" width="640" height="60" rx="10" fill="#0f172a" stroke="#1e293b" stroke-width="1"/>
    <text x="24" y="34" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="11" font-weight="600" fill="#64748b">VERIFIED BY CINEVERSE DIGITAL SECURE PASS SYSTEM</text>
    <text x="616" y="34" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="11" font-weight="700" fill="#38bdf8" text-anchor="end">TOKEN PROTECTED 🔒</text>
  </g>
</svg>
  `.trim();
};

/**
 * Generate a production-grade ticket PNG image buffer and Data URL
 * @param {Object} booking - Fully populated booking document
 * @returns {Promise<{ buffer: Buffer, dataUrl: String, filename: String }>}
 */
export const generateTicketImage = async (booking) => {
  if (!booking) {
    throw new Error('Booking is required to generate ticket image');
  }

  const title = booking.movie?.title || booking.event?.name || 'CineVerse Ticket';
  const customerName = booking.user?.name || booking.user?.email || 'Valued Customer';
  const bookingId = booking.bookingId || String(booking._id);
  const venueName = booking.venue?.name || 'CineVerse Cinema';
  const venueAddress = booking.venue?.address || booking.venue?.city || '';

  const showDate = formatDate(
    booking.bookingType === 'EVENT' ? booking.event?.date : booking.show?.showDate
  );
  const showTime =
    (booking.bookingType === 'EVENT' ? booking.event?.startTime : booking.show?.startTime) ||
    'Scheduled Time';
  const screenName = booking.show?.screen?.name || (booking.bookingType === 'EVENT' ? 'Main Stage' : 'Screen 1');

  // Format Seats / Tickets
  let seatsStr = 'General Admission';
  if (booking.seats?.length > 0) {
    seatsStr = booking.seats.map((s) => s.seatId).join(', ');
  } else if (booking.ticketItems?.length > 0) {
    seatsStr = booking.ticketItems.map((item) => `${item.categoryName} x ${item.quantity}`).join(', ');
  }

  // Format Amount
  const amountStr = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(booking.totalAmount || 0);

  // Generate secure QR Code Buffer
  const qrToken = booking.ticketToken || booking.bookingId;
  const qrContent = `CINEVERSE-TICKET:${qrToken}`;
  const qrBuffer = await QRCode.toBuffer(qrContent, {
    type: 'png',
    width: 216,
    margin: 1,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H',
  });

  // Build SVG background with all typography and layout
  const svgMarkup = buildTicketSvg({
    bookingId,
    customerName,
    movieTitle: title,
    venueName,
    venueAddress,
    showDate,
    showTime,
    screenName,
    seatsStr,
    amountStr,
  });

  // Composite the QR code buffer over the SVG base at the white box coords (255 + 12 = 267, 605 + 12 = 617)
  const baseImage = sharp(Buffer.from(svgMarkup));
  const finalPngBuffer = await baseImage
    .composite([
      {
        input: qrBuffer,
        top: 617,
        left: 267,
      },
    ])
    .png({ quality: 95, compressionLevel: 8 })
    .toBuffer();

  const dataUrl = `data:image/png;base64,${finalPngBuffer.toString('base64')}`;
  const filename = `CineVerse-Ticket-${bookingId}.png`;

  return {
    buffer: finalPngBuffer,
    dataUrl,
    filename,
  };
};

