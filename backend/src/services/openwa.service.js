/**
 * OpenWA WhatsApp Automation Service
 * Handles OpenWA connectivity, session lifecycle, message formatting,
 * phone number validation, text message dispatch, and ticket image delivery.
 */

const getOpenWAConfig = () => {
  const baseUrl = (process.env.OPENWA_BASE_URL || 'http://localhost:2785/api').replace(/\/+$/, '');
  const apiKey = process.env.OPENWA_API_KEY || '';
  const sessionId = process.env.OPENWA_SESSION_ID || 'default';
  const timeoutMs = Number(process.env.OPENWA_TIMEOUT_MS) || 15000;
  const simulation = process.env.OPENWA_SIMULATION === 'true';

  return { baseUrl, apiKey, sessionId, timeoutMs, simulation };
};

/**
 * Normalize and validate phone numbers into WhatsApp Chat IDs (@c.us)
 * Handles Indian numbers (+91, 0, or 10 digits) and standard international E.164.
 * @param {string} phone
 * @returns {string} chatId (e.g. "919876543210@c.us")
 */
export const formatWhatsAppChatId = (phone) => {
  if (!phone || typeof phone !== 'string') {
    throw new Error('A valid phone number is required for WhatsApp delivery');
  }

  const trimmed = phone.trim();
  if (trimmed.endsWith('@c.us') || trimmed.endsWith('@g.us')) {
    const rawNumber = trimmed.replace(/@[cg]\.us$/, '').replace(/\D/g, '');
    if (rawNumber.length < 10 || rawNumber.length > 15) {
      throw new Error(`Invalid phone number length: ${rawNumber.length} digits`);
    }
    return `${rawNumber}@c.us`;
  }

  // Strip all non-digits
  let digits = trimmed.replace(/\D/g, '');

  // Strip leading 0 if present (e.g., 09876543210)
  if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1);
  }

  // If 10 digits, assume standard Indian mobile and prefix 91
  if (digits.length === 10) {
    digits = `91${digits}`;
  }

  if (digits.length < 10 || digits.length > 15) {
    throw new Error(`Invalid phone number format: must contain 10-15 digits (got ${digits.length})`);
  }

  return `${digits}@c.us`;
};

/**
 * Mask phone numbers for secure logging without exposing PII
 */
export const maskPhoneNumber = (chatIdOrPhone) => {
  if (!chatIdOrPhone) return '***';
  const str = String(chatIdOrPhone).replace('@c.us', '');
  if (str.length <= 4) return '****';
  return `${str.slice(0, 3)}****${str.slice(-3)}`;
};

/**
 * Make an HTTP request to the OpenWA API with timeout and error mapping
 */
const openwaFetch = async (endpointPath, options = {}) => {
  const config = getOpenWAConfig();
  const url = `${config.baseUrl}${endpointPath.startsWith('/') ? '' : '/'}${endpointPath}`;

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(config.apiKey ? { 'X-API-Key': config.apiKey } : {}),
    ...(options.headers || {}),
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    let data;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json().catch(() => ({}));
    } else {
      const text = await response.text().catch(() => '');
      data = { text };
    }

    if (!response.ok) {
      const errorMsg =
        (Array.isArray(data?.message) ? data.message.join('; ') : data?.message) ||
        data?.error ||
        `HTTP ${response.status} ${response.statusText}`;
      const error = new Error(`OpenWA API error: ${errorMsg}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      const timeoutErr = new Error(`OpenWA API request timed out after ${config.timeoutMs}ms`);
      timeoutErr.code = 'TIMEOUT';
      timeoutErr.status = 504;
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Dynamically resolve the active OpenWA session ID (self-healing for partial or default config)
 * @param {string} [candidateSessionId]
 * @returns {Promise<string>}
 */
export const resolveSessionId = async (candidateSessionId) => {
  const config = getOpenWAConfig();
  const candidate = candidateSessionId || config.sessionId;

  // If candidate is already a valid full UUID, use it directly
  if (candidate && candidate !== 'default' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(candidate)) {
    return candidate;
  }

  // Query /sessions to auto-discover active session
  try {
    const sessions = await openwaFetch('/sessions', { method: 'GET' });
    if (Array.isArray(sessions) && sessions.length > 0) {
      const match =
        sessions.find((s) => s.id === candidate || s.name === candidate || s.id.startsWith(candidate)) ||
        sessions.find((s) => s.status === 'ready' || s.engineLoaded) ||
        sessions[0];
      if (match?.id) {
        return match.id;
      }
    }
  } catch {
    // Tolerated if offline or testing
  }

  return candidate || 'default';
};

/**
 * Format the professional CineVerse WhatsApp booking confirmation caption
 * @param {Object} booking - Booking document with movie/event and venue
 * @returns {string} Formatted WhatsApp message
 */
export const buildWhatsAppTicketMessage = (booking) => {
  const isEvent = booking.bookingType === 'EVENT';
  const customerName = booking.user?.name || 'Movie Lover';
  const bookingId = booking.bookingId || String(booking._id);
  const movieName = booking.movie?.title || booking.event?.name || 'Selected Movie';
  const theatreName = booking.venue?.name || 'CineVerse Cinema';

  const showDate = booking.show?.showDate
    ? new Date(booking.show.showDate).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : booking.event?.date
    ? new Date(booking.event.date).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Date as per booking';

  const showTime =
    (isEvent ? booking.event?.startTime : booking.show?.startTime) || 'Scheduled Showtime';

  let seats = 'General Admission';
  if (booking.seats?.length > 0) {
    seats = booking.seats.map((s) => s.seatId).join(', ');
  } else if (booking.ticketItems?.length > 0) {
    seats = booking.ticketItems.map((item) => `${item.categoryName} x ${item.quantity}`).join(', ');
  }

  const amount = booking.totalAmount != null ? booking.totalAmount : 0;

  return [
    `🎬 *CINEVERSE – BOOKING CONFIRMED!*`,
    ``,
    `Hey ${customerName}! 👋`,
    ``,
    `Your movie booking is confirmed!`,
    ``,
    `🎟️ *Booking ID:* ${bookingId}`,
    `🎥 *Movie:* ${movieName}`,
    `📍 *Theatre:* ${theatreName}`,
    `📅 *Date:* ${showDate}`,
    `⏰ *Showtime:* ${showTime}`,
    `💺 *Seats:* ${seats}`,
    `💰 *Amount:* ₹${amount}`,
    ``,
    `Your official movie ticket is attached below.`,
    ``,
    `Please show the QR code at the theatre entrance.`,
    `Please arrive 15 minutes before the show.`,
    ``,
    `Thank you for choosing CineVerse! ❤️`,
    `Enjoy your movie!`,
  ].join('\n');
};

/**
 * Check connectivity to OpenWA Docker container
 * @returns {Promise<{ connected: boolean, status: string, latencyMs?: number, error?: string }>}
 */
export const checkOpenWAConnectivity = async () => {
  const config = getOpenWAConfig();
  const startTime = Date.now();

  try {
    let res;
    try {
      res = await openwaFetch('/health', { method: 'GET' });
    } catch {
      res = await openwaFetch('/sessions', { method: 'GET' });
    }

    const latencyMs = Date.now() - startTime;
    return {
      connected: true,
      status: res?.status || 'HEALTHY',
      baseUrl: config.baseUrl,
      sessionId: config.sessionId,
      latencyMs,
    };
  } catch (err) {
    return {
      connected: false,
      status: 'UNAVAILABLE',
      baseUrl: config.baseUrl,
      sessionId: config.sessionId,
      error: err.message,
    };
  }
};

/**
 * Get active session status from OpenWA
 * @param {string} [sessionId]
 * @returns {Promise<{ sessionId: string, status: string, ready: boolean, error?: string }>}
 */
export const getOpenWASessionStatus = async (sessionId) => {
  const resolvedSessionId = await resolveSessionId(sessionId);

  try {
    let data;
    try {
      data = await openwaFetch(`/sessions/${resolvedSessionId}`, { method: 'GET' });
    } catch {
      const allSessions = await openwaFetch('/sessions', { method: 'GET' });
      data = Array.isArray(allSessions)
        ? allSessions.find((s) => s.id === resolvedSessionId || s.name === resolvedSessionId) || { status: 'NOT_FOUND' }
        : allSessions;
    }

    const rawStatus = (data?.status || data?.state || 'ready').toLowerCase();
    const isReady = rawStatus === 'ready' || rawStatus === 'connected' || rawStatus === 'islogged';

    return {
      sessionId: resolvedSessionId,
      status: rawStatus.toUpperCase(),
      ready: isReady,
      details: data,
    };
  } catch (err) {
    return {
      sessionId: resolvedSessionId,
      status: 'DISCONNECTED',
      ready: false,
      error: err.message,
    };
  }
};

/**
 * Send a plain text message via OpenWA
 * @param {string} to - Recipient phone number
 * @param {string} text - Message text
 * @returns {Promise<{ success: boolean, messageId: string, recipient: string, simulated?: boolean }>}
 */
export const sendOpenWAText = async (to, text) => {
  const config = getOpenWAConfig();
  const chatId = formatWhatsAppChatId(to);

  if (config.simulation) {
    console.log(`[OpenWA Simulation] Dispatched text message to ${maskPhoneNumber(chatId)}`);
    return {
      success: true,
      simulated: true,
      messageId: `sim-txt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      recipient: chatId,
    };
  }

  const payload = {
    chatId,
    text,
  };

  const sessionId = await resolveSessionId();

  try {
    console.log(`[OpenWA] Sending text message to ${maskPhoneNumber(chatId)}`);
    let res;
    try {
      // Modern OpenWA Docker endpoint: /api/sessions/{sessionId}/messages/send-text
      res = await openwaFetch(`/sessions/${sessionId}/messages/send-text`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (endpointErr) {
      if (endpointErr.status === 404) {
        // Fallback to legacy EasyAPI endpoint
        res = await openwaFetch('/sendText', {
          method: 'POST',
          body: JSON.stringify({ args: { to: chatId, content: text } }),
        });
      } else {
        throw endpointErr;
      }
    }

    const messageId = res?.messageId || res?.id || res?.response?.id || `owa-${Date.now()}`;
    return {
      success: true,
      messageId: String(messageId),
      recipient: chatId,
    };
  } catch (err) {
    console.error(`[OpenWA Error] Failed to send text to ${maskPhoneNumber(chatId)}:`, err.message);
    throw err;
  }
};

/**
 * Send ticket image with professional CineVerse confirmation caption
 * @param {string} to - Recipient phone number
 * @param {string|Buffer} imageDataUrlOrBuffer - PNG base64 Data URL or Buffer
 * @param {string} filename - Ticket filename (e.g. CineVerse-Ticket-MOV-2026.png)
 * @param {string} caption - WhatsApp confirmation message caption
 * @returns {Promise<{ success: boolean, messageId: string, recipient: string, simulated?: boolean }>}
 */
export const sendOpenWATicketImage = async (to, imageDataUrlOrBuffer, filename, caption) => {
  const config = getOpenWAConfig();
  const chatId = formatWhatsAppChatId(to);

  // Extract pure base64 and mimetype
  let base64Data = '';
  let mimetype = 'image/png';

  if (Buffer.isBuffer(imageDataUrlOrBuffer)) {
    base64Data = imageDataUrlOrBuffer.toString('base64');
  } else if (typeof imageDataUrlOrBuffer === 'string') {
    if (imageDataUrlOrBuffer.startsWith('data:')) {
      const match = imageDataUrlOrBuffer.match(/^data:([^;]+);base64,(.*)$/s);
      if (match) {
        mimetype = match[1];
        base64Data = match[2];
      } else {
        base64Data = imageDataUrlOrBuffer.replace(/^data:[^;]+;base64,/, '');
      }
    } else {
      base64Data = imageDataUrlOrBuffer;
    }
  }

  if (config.simulation) {
    console.log(`[OpenWA Simulation] Dispatched ticket image "${filename}" to ${maskPhoneNumber(chatId)}`);
    return {
      success: true,
      simulated: true,
      messageId: `sim-img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      recipient: chatId,
      filename,
    };
  }

  const payload = {
    chatId,
    base64: base64Data,
    mimetype,
    filename: filename || 'CineVerse-Ticket.png',
    caption: caption || '',
  };

  const sessionId = await resolveSessionId();

  try {
    console.log(`[OpenWA] Sending ticket image "${filename}" to ${maskPhoneNumber(chatId)} (Session: ${sessionId})`);
    let res;
    try {
      // Modern OpenWA Docker endpoint: /api/sessions/{sessionId}/messages/send-image
      res = await openwaFetch(`/sessions/${sessionId}/messages/send-image`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (endpointErr) {
      if (endpointErr.status === 404) {
        // Fallback to legacy EasyAPI route
        res = await openwaFetch('/sendImage', {
          method: 'POST',
          body: JSON.stringify({
            args: {
              to: chatId,
              file: `data:${mimetype};base64,${base64Data}`,
              filename: payload.filename,
              caption: payload.caption,
            },
          }),
        });
      } else {
        throw endpointErr;
      }
    }

    const messageId = res?.messageId || res?.id || res?.response?.id || `owa-img-${Date.now()}`;
    return {
      success: true,
      messageId: String(messageId),
      recipient: chatId,
      filename: payload.filename,
    };
  } catch (err) {
    console.error(`[OpenWA Error] Failed to send ticket image to ${maskPhoneNumber(chatId)}:`, err.message);
    throw err;
  }
};
