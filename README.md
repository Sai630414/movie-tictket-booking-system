# CineVerse Movie & Event Booking

CineVerse is a React and Express application for discovering movies and events, reserving cinema seats or event tickets, paying through Razorpay, and managing bookings.

## Features

- Movie, event, and venue discovery with search and filters
- Supabase signup/login with MongoDB user profiles and server-side roles
- Admin management for movies, events, venues, screens, shows, users, and bookings
- Temporary movie seat holds and event ticket reservations
- Server-calculated pricing, coupons, taxes, and fees
- Razorpay order creation, Checkout, server-side signature and capture verification, plus an optional webhook endpoint for later activation
- QR ticket details, booking history, cancellation, notifications, and refund-pending status
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

Backend settings are documented in `backend/.env.example`. Supabase URL, anon key, and service role key are required for authenticated APIs. Keep the service role key only on the server. Razorpay checkout requires only `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`; webhook configuration is optional and is not needed for the initial payment flow. R2 settings are optional unless image uploads are enabled.

Frontend settings are documented in `frontend/.env.example`. Only the Supabase URL and public anon key belong in the browser. Never put service role, Razorpay secret, database, or webhook credentials in `VITE_*` variables.

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

The backend currently has no test or lint script. `node --check` can be used to check backend JavaScript syntax.

## API overview

All routes use `/api`. Main route groups are `/auth`, `/users`, `/movies`, `/events`, `/venues`, `/shows`, `/bookings`, `/payments`, `/notifications`, and `/admin`. Protected routes require a Supabase bearer access token; admin routes also check the MongoDB profile role. Seat holds and event inventory are enforced server-side. Payment confirmation requires a valid Razorpay signature and a captured provider payment matching the booking amount.

## Deployment

1. Provision MongoDB, Supabase Auth, Razorpay, and (if needed) Cloudflare R2.
2. Deploy the backend with `NODE_ENV=production`, `MONGODB_URI`, Supabase server credentials, Razorpay credentials, `FRONTEND_URL`, and the production `PORT` supplied by the host.
3. Checkout confirmation uses the server-side Razorpay signature and captured-payment verification; no webhook setup is required. The webhook endpoint can be configured later if desired.
4. Deploy the frontend using `npm ci && npm run build`; publish `frontend/dist` and set `VITE_API_URL`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY` at build time.
5. Add the production frontend URL to Supabase Auth redirect/site URL settings and set `FRONTEND_URL` on the API. Restrict database and storage credentials to the backend.
6. Promote the first administrator through a trusted MongoDB console after that account is created.

The application requires live Supabase and Razorpay credentials for real sign-in and checkout. Add the production frontend URL and `/reset-password` to Supabase's allowed redirect URLs. Missing configuration fails closed for protected auth, uploads, and checkout.

## Troubleshooting

- `Authentication service is not configured`: set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` on the API; set the frontend Supabase URL and anon key too.
- MongoDB connection errors: verify `MONGODB_URI`, network access rules, and database availability.
- Payment unavailable: configure Razorpay test or live keys on the API and its key ID in the browser config if needed.
- Seat unavailable or expired: refresh the show seat map and reserve again; holds expire after ten minutes.
- CORS errors: set `FRONTEND_URL` to the exact frontend origin.
