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
- Booking confirmation, cancellation, and completed-refund emails through Brevo; email delivery state is tracked separately from payment/booking state
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

Backend settings are documented in `backend/.env.example`. Set `SUPABASE_URL` and the server-only `SUPABASE_SECRET_KEY` (the previous `SUPABASE_SERVICE_ROLE_KEY` name remains supported) to verify Auth sessions. Razorpay checkout requires `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`; webhook setup is not needed for checkout confirmation. Set `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, and `BREVO_SENDER_NAME` for transactional email. The sender address/domain must be verified in Brevo. R2 settings are optional unless image uploads are enabled.

Frontend settings are documented in `frontend/.env.example`. Use `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (the legacy `VITE_SUPABASE_ANON_KEY` name is still accepted). Only the publishable/anon key belongs in the browser. Never put Supabase secret/service role, Razorpay secret, Brevo API key, database, or webhook credentials in `VITE_*` variables.

### Supabase Auth dashboard setup

- In Authentication → URL Configuration, set the local Site URL to `http://localhost:5173` and allow `http://localhost:5173/auth/callback` and `http://localhost:5173/reset-password` as redirect URLs.
- For production, add the actual deployed frontend origin and its `/auth/callback` and `/reset-password` paths. The application derives these paths from the current origin; do not add a placeholder production domain.
- In Authentication → Email Templates → Confirm signup, paste [`docs/supabase-confirm-signup.html`](docs/supabase-confirm-signup.html). Its `{{ .ConfirmationURL }}` link uses Supabase's configured redirect allowlist.
- To enable Google OAuth, enable the Google provider in Authentication → Providers and configure its client credentials. Add the Supabase project callback URL shown in that provider's settings to the Google OAuth client's authorized redirect URIs. The app returns through `/auth/callback`.

### Brevo setup and delivery

- Create a Brevo API key and verify the sender email/domain in Brevo.
- Set `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, and `BREVO_SENDER_NAME` only in `backend/.env` or the backend deployment secret store. Set `FRONTEND_URL` to the exact deployed CineVerse origin so ticket links point back to the app.
- Booking confirmation mail is attempted only after server-side Razorpay signature and captured-payment checks have confirmed the booking and persisted its QR ticket. Cancellation mail follows persisted cancellation. A refund mail is sent only after a valid Razorpay refund webhook event; webhooks remain optional for the normal checkout flow.
- Email failures update the relevant email delivery state and safe server logs; they do not change a confirmed booking or captured payment. Email sending can be retried through the backend email service without issuing another booking confirmation as part of the payment flow.

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
