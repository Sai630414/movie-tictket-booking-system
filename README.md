# CineVerse Movie & Event Booking

CineVerse is a React and Express application for discovering movies and events, reserving cinema seats or event tickets, paying through Razorpay, and managing bookings.

## Features

- Movie, event, and venue discovery with search and filters
- Supabase email signup/login, Google OAuth, email verification callbacks, password reset, and MongoDB user profiles/server-side roles
- Admin management for movies, events, venues, screens, shows, users, and bookings
- Temporary movie seat holds and event ticket reservations
- Server-calculated pricing, coupons, taxes, and fees
- Razorpay order creation, Checkout, server-side signature and capture verification, plus an optional webhook endpoint for later activation
- Opaque, unique QR ticket tokens with admin-only server verification and one-time scan acceptance
- Booking confirmation, cancellation, refund, and ticket resend emails through Brevo; email delivery state is tracked separately from payment/booking state
- Booking ticket WhatsApp and SMS delivery through Twilio
- Responsive React UI using the existing CineVerse dark theme

## Stack and folders

- Frontend: React 18, Vite, React Router, Axios, Supabase JS
- Backend: Node.js, Express, Mongoose, MongoDB, Supabase Auth, Razorpay
- `frontend/src/pages`, `components`, `context`, and `services`: UI and API client
- `backend/src/controllers`, `routes`, `models`, `services`, `middleware`, and `jobs`: API and booking logic
- `backend/scripts/seed.js`: development catalog seed script

## Requirements

- Node.js 20 LTS or later and npm
- MongoDB 6+ (local or managed)
- Supabase project for registration/login and protected API access
- Razorpay account credentials for payments
- Brevo account with a verified sender for transactional email

## Setup

1. Copy `backend/.env.example` to `backend/.env` and enter the MongoDB, Supabase, and Razorpay settings. Do not commit either `.env` file.
2. Copy `frontend/.env.example` to `frontend/.env`; configure the same Supabase project and the backend API URL.
3. Install and start the backend:

   ```powershell
   cd backend
   npm ci
   npm run dev
   ```

4. In another terminal, install and start the frontend:

   ```powershell
   cd frontend
   npm ci
   npm run dev
   ```

The frontend runs at `http://localhost:5173`, the API at `http://localhost:5000`, and the health check is `http://localhost:5000/health`.

## Environment variables

Backend settings are documented in `backend/.env.example`. Set `SUPABASE_URL` and the server-only `SUPABASE_SECRET_KEY` (the previous `SUPABASE_SERVICE_ROLE_KEY` name remains supported) to verify Auth sessions. Razorpay checkout requires `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`; webhook setup is not needed for checkout confirmation. Set `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, and `BREVO_SENDER_NAME` for all backend transactional email. Verify the sender address/domain in Brevo. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `TWILIO_WHATSAPP_NUMBER`, `TWILIO_WHATSAPP_CONTENT_SID`, and `TWILIO_WHATSAPP_TEMPLATE_FIELDS` for booking SMS and WhatsApp; use E.164 phone numbers and an enabled Twilio WhatsApp sender. WhatsApp requires an approved Content Template for business-initiated booking notifications. R2 settings are optional unless image uploads are enabled.

Frontend settings are documented in `frontend/.env.example`. Use `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (the legacy `VITE_SUPABASE_ANON_KEY` name is still accepted). Only the publishable/anon key belongs in the browser. Never put Supabase secret/service role, Razorpay secret, Brevo API key, database, or webhook credentials in `VITE_*` variables.

### Supabase Auth dashboard setup

- In Authentication → URL Configuration, set the local Site URL to `http://localhost:5173` and allow `http://localhost:5173/auth/callback` and `http://localhost:5173/reset-password` as redirect URLs.
- For production, add the actual deployed frontend origin and its `/auth/callback` and `/reset-password` paths. The application derives these paths from the current origin; do not add a placeholder production domain.
- In Authentication → Email Templates → Confirm signup, paste [`docs/supabase-confirm-signup.html`](docs/supabase-confirm-signup.html). Its `{{ .ConfirmationURL }}` link uses Supabase's configured redirect allowlist.
- To enable Google OAuth, enable the Google provider in Authentication → Providers and configure its client credentials. Add the Supabase project callback URL shown in that provider's settings to the Google OAuth client's authorized redirect URIs. The app returns through `/auth/callback`.

### Brevo setup and delivery

- Create a Brevo API key and verify the sender email/domain in Brevo.
- Configure Supabase Auth's custom SMTP settings with Brevo's SMTP relay so signup confirmation and password reset messages also come from Brevo. Supabase Auth generates those emails; the backend handles booking and ticket emails.
- Configure Supabase Auth phone SMS with Twilio for onboarding and login OTPs. The app requests/verifies OTPs through Supabase Auth; booking ticket SMS/WhatsApp messages go through the backend Twilio integration.
- Set `TWILIO_WHATSAPP_NUMBER` to the exact Twilio sender in `whatsapp:+<country_code><number>` form and set `TWILIO_WHATSAPP_CONTENT_SID` to a Content SID available to that account. Set `TWILIO_WHATSAPP_TEMPLATE_FIELDS` to the comma-separated placeholder values in the exact order required by that template, choosing from `bookingId,title,venue,dateTime,items,amount,ticketUrl`. Do not reuse a production SID or assume a Sandbox SID/variable layout; copy the supported template and SID from the same Twilio Console account.
- To test with the WhatsApp Sandbox, open Twilio Console > Messaging > Try it out > Send a WhatsApp message, join the Sandbox from the recipient phone using the displayed join phrase, and use the Sandbox sender and one of its supported Content SIDs/variable layouts. In the app, enable WhatsApp ticket updates in My Profile first. The ticket button sends the approved template with the authenticated user's saved number; retries do not send again after Twilio accepts the request.
- Twilio trial SMS accounts reject custom message bodies. For a trial, set `TWILIO_SMS_TRIAL_TEMPLATE=sms_order_confirmation` (or another supported Twilio template name); trial messages are generic and can only go to verified recipients. Clear this setting after upgrading to send the full booking details.
- Set `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, and `BREVO_SENDER_NAME` only in `backend/.env` or the backend deployment secret store. Set `FRONTEND_URL` to the exact deployed CineVerse origin so ticket links point back to the app.
- Booking confirmation mail is attempted only after server-side Razorpay signature and captured-payment checks have confirmed the booking and persisted its QR ticket. Cancellation mail follows persisted cancellation. A refund mail is sent only after a valid Razorpay refund webhook event; webhooks remain optional for the normal checkout flow.
- Confirmation email includes the QR as a named PNG attachment. The QR is an opaque ticket token generated only after server-side payment confirmation; Brevo's API accepts base64 attachments but does not support CID inline images. Email delivery state tracks Brevo acceptance, not final inbox delivery. Failures update the relevant state and safe server logs without changing the booking; a retry uses the booking's email idempotency claim.

### Ticket scanning

QR codes contain only an opaque random `CINEVERSE-TICKET:` token. An authenticated admin scanner can POST `{ "ticket": "CINEVERSE-TICKET:<token>" }` to `/api/tickets/verify`. The endpoint checks booking/payment status and event/show expiry, then atomically accepts a valid token once. Results include `VALID`, `ALREADY_USED`, `CANCELLED`, `REFUNDED`, `INVALID`, or `EXPIRED`.

## Database and admin setup

MongoDB collections and indexes are managed by Mongoose. The API creates a regular MongoDB profile when a valid Supabase session first reaches `/api/auth/me`. New accounts always receive the `user` role; a trusted administrator can promote a profile through the admin users API. For the first administrator, create an account through Supabase, sign in once so its MongoDB profile is created, then assign `role: "admin"` to that user's MongoDB document using a trusted database console. Do not set the role in Supabase user metadata or from the client.

Seed catalog fixtures only against a development database:

```powershell
cd backend
npm run seed
```

The seed script must not be used against production data.

## Commands and checks

```powershell
cd frontend
npm run dev
npm run lint
npm run build
```

```powershell
cd backend
npm run dev
npm start
```

The backend provides `npm test` for its payment-signature checks. `node --check` can also be used to check backend JavaScript syntax.

## API overview

All routes use `/api`. Main route groups are `/auth`, `/users`, `/movies`, `/events`, `/venues`, `/shows`, `/bookings`, `/payments`, `/tickets`, `/notifications`, and `/admin`. Protected routes require a Supabase bearer access token; admin routes also check the MongoDB profile role. Seat holds and event inventory are enforced server-side. Payment confirmation requires a valid Razorpay signature and a captured provider payment matching the booking amount.

## Deployment

1. Provision MongoDB, Supabase Auth, Razorpay, Brevo, and (if needed) Cloudflare R2.
2. Deploy the backend with `NODE_ENV=production`, `MONGODB_URI`, Supabase server credentials, Razorpay credentials, Brevo credentials, `FRONTEND_URL`, and the production `PORT` supplied by the host.
3. Checkout confirmation uses the server-side Razorpay signature and captured-payment verification; no webhook setup is required. The webhook endpoint can be configured later if desired.
4. Deploy the frontend using `npm ci && npm run build`; publish `frontend/dist` and set `VITE_API_URL`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_PUBLISHABLE_KEY` at build time.
5. Add the deployed frontend callback and password-reset URLs to Supabase Auth redirect settings, and set `FRONTEND_URL` on the API. Restrict database and storage credentials to the backend.
6. Promote the first administrator through a trusted MongoDB console after that account is created.

The application requires live Supabase and Razorpay credentials for real sign-in and checkout. Add the production frontend URL and `/reset-password` to Supabase's allowed redirect URLs. Missing configuration fails closed for protected auth, uploads, and checkout.

## Troubleshooting

- `Authentication service is not configured`: set `SUPABASE_URL` and `SUPABASE_SECRET_KEY` on the API; set the frontend Supabase URL and publishable/anon key too.
- Transactional messages remain pending/failed: verify the Brevo API key and verified sender are set on the backend, plus `FRONTEND_URL` for working ticket links.
- MongoDB connection errors: verify `MONGODB_URI`, network access rules, and database availability.
- Payment unavailable: configure Razorpay test or live keys on the API and its key ID in the browser config if needed.
- Seat unavailable or expired: refresh the show seat map and reserve again; holds expire after ten minutes.
- CORS errors: set `FRONTEND_URL` to the exact frontend origin.
