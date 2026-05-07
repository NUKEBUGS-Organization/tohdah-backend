# Tohdah API

REST API for the Tohdah peer-to-peer delivery platform (travelers matched with senders, bookings, chat, trust, admin).

## Tech stack

- **Runtime:** Node.js 20+
- **Framework:** NestJS 11 (Express)
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT access + refresh (Redis-backed sessions with `jti`), Passport JWT, optional **Google OAuth** (`passport-google-oauth20`)
- **Validation:** class-validator / class-transformer
- **Uploads:** Multer, local disk under `UPLOAD_DEST` (upgrade path to S3/Cloudinary)

## Prerequisites

- Node.js **20+**
- **MongoDB** (local or Atlas URI)
- **Redis 7+** — e.g. `brew install redis && brew services start redis`; confirm `redis-cli ping` → `PONG`
- Copy **`.env.example`** → **`.env`** and fill secrets (see table below)

## Setup

```bash
npm install
cp .env.example .env
# Edit .env: set JWT_* secrets, MONGODB_URI, BASE_URL, REDIS_URL, etc.
npm run start:dev
```

The API listens on `PORT` (default **3000**). Upload directories under `UPLOAD_DEST` are created automatically on first use.

### Seed admin user

Creates `admin@tohdah.com` if missing. **Change the password and email in production.**

```bash
npx ts-node -r tsconfig-paths/register src/scripts/seed-admin.ts
```

## Scripts

| Command | Description |
|--------|-------------|
| `npm run start:dev` | Dev server with watch |
| `npm run build` | Production build → `dist/` |
| `npm run start:prod` | Run compiled app |
| `npm test` | Unit tests |
| `npm run test:e2e` | E2E tests (Jest config in `test/`) |
| `npm run lint` | ESLint |

## Modules (backend)

| # | Module | What it covers |
|---|--------|------------------|
| 1 | **Auth** | Register, login, refresh, logout, password reset, `GET /auth/me` |
| 2 | **Trips** | Traveler trip CRUD + browse |
| 3 | **Requests** | Delivery request CRUD + browse |
| 4 | **Bookings** | Matching, offers, pay stub, lifecycle, proof of delivery, disputes |
| 5 | **Chat & notifications** | Booking chat; user notification feed |
| 6 | **Reviews & trust** | Post-booking reviews; trust score and verification stub |
| 7 | **Profile & onboarding** | User profile, stats, onboarding, account settings, reports |
| 8 | **Admin** | Dashboard, user moderation, disputes, support requests, impact |
| 9 | **File upload** | Avatars, delivery/item/chat images (local disk; see `API_INTEGRATION.md`) |

## API base URL & docs

- **Local:** `http://localhost:3000` (or `BASE_URL` from `.env`)
- **Frontend integration:** see **[API_INTEGRATION.md](./API_INTEGRATION.md)** for every route, bodies, errors, and polling guidance.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `PORT` | HTTP port |
| `MONGODB_URI` | MongoDB connection string |
| `CORS_ORIGIN` | Comma-separated allowed origins |
| `JWT_ACCESS_SECRET` | Access token signing |
| `JWT_REFRESH_SECRET` | Refresh token signing |
| `REDIS_URL` | Redis connection (`redis://localhost:6379`) |
| `REDIS_TTL_SECONDS` | Refresh session TTL (default `604800` = 7 days) |
| `JWT_RESET_SECRET` | Password reset token signing |
| `UPLOAD_DEST` | Local upload root (default `./uploads`) |
| `MAX_FILE_SIZE_MB` | Max upload size per file |
| `ALLOWED_FILE_TYPES` | Comma-separated MIME types |
| `BASE_URL` | Public origin for generated file URLs |
| `FRONTEND_URL` | SPA origin for OAuth redirect after Google (`/auth/google/callback`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth Web client credentials |
| `GOOGLE_CALLBACK_URL` | Authorized redirect URI (e.g. `http://localhost:3000/api/v1/auth/google/callback`) |

## License

Private / UNLICENSED (see `package.json`).
