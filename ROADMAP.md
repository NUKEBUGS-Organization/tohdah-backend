# Tohdah — Technical Roadmap

## Current state

The **Tohdah** platform ships a NestJS **REST API** under **`/api/v1`** (auth, trips, requests, bookings, payments/Stripe webhooks, chat, notifications, reviews, trust, users, onboarding, admin, uploads) with **MongoDB** persistence, plus a **Vite + React + Mantine** web app. Core journeys—register (welcome email via Resend when configured), trips/requests, match, **Stripe PaymentIntent checkout**, in-transit, proof of delivery, complete, reviews, chat, notifications, trust, admin moderation—are implemented end-to-end.

### Implemented (production hardening)

- **Rate limiting** — `@nestjs/throttler` with global + named limits (`auth`, `sensitive`, `upload`); health, `GET /auth/me`, admin routes, and Stripe webhook skip throttling.
- **Email (Resend)** — transactional `EmailService`; forgot-password sends OTP (never returned in JSON); welcome on register.
- **Cloud storage (Cloudinary)** — optional via `USE_CLOUD_STORAGE` + Multer memory storage.
- **Stripe payments** — `POST /payments/intent/:bookingId`, `POST /payments/webhook`, `paymentIntentId` on bookings; `POST /bookings/:id/pay` returns **410**; admin dispute refunds call Stripe when a `paymentIntentId` exists.
- **Helmet** + CSP (including `crossOriginResourcePolicy: cross-origin` for `/uploads`).
- **Input sanitization** — `sanitize-html` via global `SanitizePipe` after `ValidationPipe` (whitelist + forbid unknown fields).
- **Compression** + JSON/urlencoded **1mb** body limits via `useBodyParser`.
- **Global HTTP exception filter** (structured JSON + 5xx logging).
- **MongoDB connection** logging via `connectionFactory`.
- **Graceful shutdown** — `enableShutdownHooks()`.
- **Compound indexes** — trips, requests, bookings, messages, notifications, reviews, users (see schema files).
- **Read performance** — `.lean()` on browse + my-bookings list paths where appropriate.
- **Firebase FCM push notifications** — Web push via `firebase-admin` + registered device tokens on users; foreground Mantine toasts + background service worker.
- **Redis** — Refresh token hashes (`tohdah:refresh:{userId}:{jti}`) with rotation and multi-session support; password-reset OTP in Redis (`tohdah:otp:{email}`, 10m TTL); `GET/DELETE /users/sessions` for counts and revoke-all.
- **Google OAuth** — Passport `google` strategy (`passport-google-oauth20`): `GET /auth/google` → Google → `GET /auth/google/callback` issues JWT + Redis refresh, redirects to `FRONTEND_URL/auth/google/callback` with tokens in query (`accessToken`, `refreshToken`, `isNewUser`); linking `googleId` on existing emails; new users get `authProvider: 'google'` + placeholder phone/password hash.

## Production blockers (remaining)

1. **Real-time chat** — Today the web client polls; add **WebSockets** / Socket.io when product requires live delivery.

## Phase 2 features (post-launch growth)

4. Live GPS / location sharing for in-transit deliveries  
5. Nonprofit / sponsorship partner portal (backend placeholders exist; product workflow TBD)  
6. Donation wallet with real payment flow  
7. Referral rewards automation (credit on qualified conversion)  
8. Loyalty tier automation from points rules  
9. KYC — Stripe Identity, Onfido, or similar  
10. AI-assisted matching (rank trips vs requests)  
11. Mobile apps — React Native / Expo sharing API types with the web client  

## Phase 3+ (platform maturity)

12. Multi-currency  
13. International shipping / customs compliance  
14. Insurance opt-in for high-value items  
15. Traveler SLA and on-time metrics  
16. Fraud / abuse detection (rules + ML)  
17. Partner / B2B API for logistics integrations  
