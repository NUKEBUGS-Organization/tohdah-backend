# Tohdah API Integration Guide

Audience: frontend (Vite + React). All paths are relative to the API base URL.

## Base URL

All REST routes are served under **`/api/v1`** (global prefix).

- **Development:** `http://localhost:3000/api/v1`
- **Production:** set `VITE_API_BASE_URL` in the frontend `.env` (e.g. `https://api.yourdomain.com/api/v1`) and use that as the fetch base.

## Authentication

- **Protected routes** require header: `Authorization: Bearer <accessToken>`
- **Access token** expires in **15 minutes**
- On **401** from any protected call: `POST /auth/refresh` with body `{ refreshToken }` (same refresh token you stored at login). Retry the original request with the new access token.
- **Refresh tokens** include a `jti` (session id); each login or refresh stores a bcrypt hash in **Redis** under `tohdah:refresh:{userId}:{jti}` with a 7-day TTL, so multiple devices can stay signed in and server-side revoke is instant (`DELETE /users/sessions` or password change).
- If refresh returns **401** or fails: redirect to `/login` and clear tokens.

## Token storage recommendation

- Keep **accessToken** in memory only (React context or a small auth store).
- Store **refreshToken** in `localStorage` under key `tohdah_refresh` (or an httpOnly cookie if you add a BFF later).
- **Do not** persist access tokens in `localStorage` (XSS risk).

---

## MODULE 1 — AUTH

### `POST /auth/register`

- **Body**

```ts
interface RegisterDto {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string; // min 8, letter + number
  accountType?: 'traveler' | 'requester' | 'both';
}
```

- **Response**

```ts
interface RegisterResponse {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  accountType: 'traveler' | 'requester' | 'both' | null;
}
```

- **Errors:** `409` duplicate email; `400` validation
- **Screen:** Sign up / registration

### `POST /auth/login`

- **Body:** `{ email: string; password: string }`
- **Response:** `{ accessToken: string; refreshToken: string; user: { id; fullName; email; accountType } }`
- **Errors:** `401` bad credentials; `401` account suspended/banned (`Account is not active`)
- **Screen:** Login

### Google OAuth (browser redirect flow)

Backend uses **Passport** + **`passport-google-oauth20`** (not Firebase Auth server-side).

- **`GET /auth/google`** — **No JSON body.** Redirects the browser to Google’s consent screen. From the SPA, navigate with **`window.location.href = `${VITE_API_BASE_URL}/auth/google`** (full API base including `/api/v1`).
- **`GET /auth/google/callback`** — Handled after Google redirects back. Validates the profile, **find-or-creates / links** the user, stores the refresh hash in **Redis**, then **HTTP redirects** (302) to:
  - **`{FRONTEND_URL}/auth/google/callback`** with query params:
    - **`accessToken`**, **`refreshToken`**, **`isNewUser`** (`true` | `false` string).

The SPA route **`/auth/google/callback`** should read those params, persist tokens like a normal login, call **`GET /auth/me`**, then route by onboarding (same rules as password login).

- **Authorized redirect URIs** in Google Cloud Console must include exactly **`GOOGLE_CALLBACK_URL`** (e.g. `http://localhost:3000/api/v1/auth/google/callback` locally).
- **Security note:** Passing tokens in the query string exposes them to browser history and Referer logs; acceptable for MVP; tighten later (e.g. short-lived auth code exchanged server-side).

### `POST /auth/refresh`

- **Body:** `{ refreshToken: string }`
- **Response:** `{ accessToken: string; refreshToken: string }`
- **Errors:** `401` invalid/expired refresh
- **Screen:** Silent refresh helper / session restore

### `POST /auth/logout`

- **Body:** `{ refreshToken: string }`
- **Response:** `{ message: string }` (refresh invalidated server-side)
- **Screen:** Logout

### `POST /auth/forgot-password`

- **Body:** `{ email: string }`
- **Response:** `{ message: string }` — always the same generic copy whether or not the email exists (anti-enumeration). When `RESEND_API_KEY` is set, a reset OTP is emailed; the OTP is **never** returned in JSON.
- **Errors:** `400` validation; `429` if rate-limited
- **Screen:** Forgot password

### `POST /auth/verify-otp`

- **Body:** `{ email: string; otp: string }` (6 digits)
- **Response:** includes reset token payload per `AuthService`
- **Screen:** OTP entry

### `POST /auth/reset-password`

- **Body:** `{ passwordResetToken: string; newPassword: string }`
- **Response:** `{ message: string }`
- **Errors:** `401` bad token
- **Screen:** Reset password form

### `GET /auth/me`

- **Auth:** required
- **Response:** full safe user profile (id, fullName, email, phoneNumber, accountType, profile fields, verification flags, rating, reviewCount, onboarding fields, `createdAt`, …) — no secrets
- **Errors:** `401`
- **Screen:** App shell / profile header / any screen needing current user

### Frontend integration notes — Auth

- Central **AuthContext** (or Zustand slice) holding `accessToken`, `user` from `/auth/me`, and `setTokens` / `logout`.
- After login/register, optionally call `GET /auth/me` to hydrate extended profile.
- Central **HTTP client** should attach `Authorization` and run refresh-on-401 once.

---

## MODULE 2 — TRIPS

Base path: `/trips` (all JWT-protected).

### `POST /trips`

- **Body:** `CreateTripDto` — `origin`, `destination`, `departureDate`, `arrivalDate` (ISO strings), `luggageSpace`, `pricingType` (`fixed` | `negotiable`), optional `acceptedCategories`, `deliveryPreferences`, `pricePerKg`, `notes`, `isFlexibleDates` boolean, etc. (see `src/trips/dto/create-trip.dto.ts`)
- **Response:** created trip document
- **Errors:** `400` validation
- **Screen:** Create trip

### `GET /trips/my`

- **Query:** pagination / filters as implemented in `TripsService`
- **Response:** list of user’s trips
- **Screen:** My trips

### `GET /trips/browse`

- **Query:** browse filters (see `BrowseTripsQueryDto`)
- **Response:** paginated trips
- **Screen:** Browse trips (traveler marketplace)

### `GET /trips/:id`

- **Response:** single trip
- **Errors:** `404`
- **Screen:** Trip detail

### `PATCH /trips/:id`

- **Body:** partial update DTO
- **Response:** updated trip
- **Errors:** `403` not owner; `404`
- **Screen:** Edit trip

### `DELETE /trips/:id`

- **Response:** success / void per implementation
- **Errors:** `403`; `404`
- **Screen:** Cancel/delete trip

### Frontend integration notes — Trips

- Store “my trips” in a **TripsContext** or React Query cache keyed by user.
- Browse view: refetch on filter change; optional polling if you show live seat counts later (not required today).

---

## MODULE 3 — REQUESTS

Base path: `/requests` (JWT).

### `POST /requests`

- **Body:** `CreateRequestDto` (see `src/requests/dto/create-request.dto.ts`) — includes `type` `standard` | `support`, item fields, origin/destination, `deliveryDeadline`, optional support-only fields (`paymentType`, `beneficiaryType`, …)
- **Response:** created request
- **Errors:** `400` (e.g. support missing required fields)
- **Screen:** Create request

### `GET /requests/my`

- **Response:** user’s requests
- **Screen:** My requests

### `GET /requests/browse`

- **Query:** `BrowseRequestsQueryDto` (status, supportOnly, etc.)
- **Response:** paginated requests for travelers
- **Screen:** Browse requests

### `GET /requests/:id`

- **Errors:** `404`
- **Screen:** Request detail

### `PATCH /requests/:id`

- **Body:** partial update
- **Errors:** `403`; `404`
- **Screen:** Edit request

### `DELETE /requests/:id`

- **Screen:** Cancel request

### Frontend integration notes — Requests

- For **support** requests, after admin approval flows exist, refetch status when returning to the app (pull-to-refresh).
- Standard vs support: branch UI on `type`.

---

## MODULE 4 — BOOKINGS (MATCHING)

Base path: `/bookings` (JWT).

### `POST /bookings/match`

- **Body:** `CreateBookingDto` (`requestId`, `tripId`, `offeredFee`, …)
- **Response:** new booking
- **Errors:** `400` business rules; `404` refs
- **Screen:** Match / send offer

### `GET /bookings/my`

- **Query:** `status?`, `role?`, `page?`, `limit?`
- **Response:** `{ data, total, page, limit }` (shape per service)
- **Screen:** My bookings inbox

### `GET /bookings/:id`

- **Errors:** `403` not a party; `404`
- **Screen:** Booking detail, tracking

### `POST /bookings/:id/accept`

- **Screen:** Traveler accepts booking

### `POST /bookings/:id/counter`

- **Body:** `CounterOfferDto`
- **Screen:** Counter-offer

### `POST /bookings/:id/decline`

- **Screen:** Decline match

### `POST /bookings/:id/accept-counter`

- **Screen:** Accept counter

### `POST /bookings/:id/pay` (deprecated)

- **Status:** `410 Gone` with message directing clients to Stripe PaymentIntents (below). Kept so older clients receive a clear error instead of `404`.
- **Screen:** n/a — use checkout flow below

### `POST /payments/intent/:bookingId`

- **Auth:** JWT (requester only); booking must be `confirmed`.
- **Response:** `{ clientSecret: string; paymentIntentId: string }` for Stripe.js `confirmCardPayment`.
- **Errors:** `400`, `403`, `404`; `429` if rate-limited
- **Screen:** Checkout — install `@stripe/stripe-js` and `@stripe/react-stripe-js`, set `VITE_STRIPE_PUBLISHABLE_KEY`, then confirm the PaymentIntent; poll `GET /bookings/:id` until `status` is `paid` after the webhook runs.

### `POST /payments/webhook`

- **Auth:** none (Stripe signature verification). Requires raw body; configure Stripe CLI or dashboard webhook to this URL.
- **Body:** Stripe event payload (raw JSON)
- **Behavior:** On `payment_intent.succeeded`, loads `bookingId` from PaymentIntent metadata and marks the booking `paid`, storing `paymentIntentId`.

### `POST /bookings/:id/in-transit`

- **Screen:** Traveler marks in transit

### `POST /bookings/:id/proof-of-delivery`

- **Body:** `ProofOfDeliveryDto` — `{ podPhotoUrl: string; podConfirmationCode: string }` (upload image first via `POST /upload/delivery/:bookingId`, then send URL here)
- **Screen:** Proof of delivery

### `POST /bookings/:id/complete`

- **Screen:** Requester completes after delivery

### `POST /bookings/:id/dispute`

- **Body:** `DisputeDto`
- **Screen:** Raise dispute

### `POST /bookings/:id/cancel`

- **Body:** `CancelBookingDto`
- **Screen:** Cancel booking

### Frontend integration notes — Bookings

- Treat booking as the **source of truth** for post-match state; derive UI steps from `status`.
- **Live tracking (polling):** while the tracking UI is open, poll `GET /bookings/:id` every **10s** (see WebSocket note at end).

---

## MODULE 5 — CHAT

Base path: `/chat` (JWT).

### `GET /chat/my`

- **Response:** conversations for current user
- **Screen:** Chat inbox

### `GET /chat/:bookingId/messages`

- **Query:** `page?`, `limit?` (`GetMessagesQueryDto`)
- **Errors:** `403` if not a booking party
- **Screen:** Chat thread

### `POST /chat/:bookingId/messages`

- **Body:** `{ content: string; imageUrl?: string }` — `imageUrl` optional absolute URL (from `POST /upload/chat/:bookingId`)
- **Response:** created message
- **Errors:** `403`; `400` validation
- **Screen:** Send message / image

### `PATCH /chat/messages/:messageId/read`

- **Screen:** Mark read / receipts

### Frontend integration notes — Chat

- Poll `GET /chat/:bookingId/messages` every **5s** while the thread is open (see end of doc for WebSocket note).
- Store active `bookingId` in chat route state; clear interval on unmount.

---

## MODULE 5 — NOTIFICATIONS

Base path: `/notifications` (JWT).

### `GET /notifications`

- **Query:** `isRead?`, `type?`, `page?`, `limit?`
- **Response:** `{ data, total, page, limit, unreadCount }`
- **Screen:** Notification center / bell dropdown

### `PATCH /notifications/read-all`

- **Response:** counts / acknowledgement per service
- **Screen:** Mark all read

### `PATCH /notifications/:id/read`

- **Screen:** Mark one read

### `DELETE /notifications/:id`

- **Screen:** Dismiss notification

### Frontend integration notes — Notifications

- Poll `GET /notifications?isRead=false` every **30s** when the user is authenticated (or when bell is visible).
- Keep `unreadCount` in global UI state.

---

## MODULE 6 — REVIEWS

Base path: `/reviews` (JWT).

### `POST /reviews`

- **Body:** `CreateReviewDto` — `bookingId`, `revieweeId`, `overallRating` (1–5), optional `categoryRatings`, `comment`
- **Errors:** `400` / `403` / `404` per rules
- **Screen:** Leave review

### `GET /reviews/my`

- **Screen:** Reviews I wrote

### `GET /reviews/user/:userId`

- **Screen:** Public reviews for a user

### `GET /reviews/booking/:bookingId`

- **Screen:** Reviews for a booking

### Frontend integration notes — Reviews

- After `POST /bookings/:id/complete`, prompt review using `bookingId` + counterparty id from booking payload.
- React Query: invalidate `reviews` keys after create.

---

## MODULE 6 — TRUST SCORE

Base path: `/trust` (JWT).

### `GET /trust/me`

- **Response:** trust breakdown for current user
- **Screen:** Trust dashboard (self)

### `GET /trust/user/:userId`

- **Screen:** Trust on public profile

### `GET /trust/badges/:userId`

- **Screen:** Badges display

### `PATCH /trust/verify`

- **Body:** `{ field: 'email' | 'phone' | 'id' | 'selfie' }` (stub for dev)
- **Screen:** Dev-only / admin simulation (replace with real KYC later)

### Frontend integration notes — Trust

- Cache trust with profile; refresh after verification state changes or new reviews.

---

## MODULE 7 — PROFILE + ONBOARDING

Users base: `/users` (JWT). Onboarding: `/onboarding` (JWT).

### `GET /auth/me`

- (Also listed under Auth.) Extended profile for the logged-in user.
- **Screen:** Profile / settings bootstrap

### `PATCH /users/profile`

- **Body:** `UpdateProfileDto` — optional `fullName`, `bio`, `location`, `languages`, `travelPreferences`, `profilePhoto`, `accountType`
- **Response:** same shape as `GET /auth/me`
- **Screen:** Edit profile

### `GET /users/:userId/profile`

- **Response:** public profile + booking counts
- **Screen:** Other user’s public profile

### `GET /users/:userId/stats`

- **Response:** activity stats object
- **Screen:** Profile stats tab

### `POST /onboarding/step`

- **Body:** `OnboardingStepDto` — `step` 1–4 plus fields per step (see backend DTO)
- **Errors:** `400` skip steps / already completed messages
- **Screen:** Onboarding wizard

### `GET /onboarding/status`

- **Response:** `{ onboardingCompleted, onboardingStep, nextStep, accountType }`
- **Screen:** Onboarding resume banner

### `PATCH /users/change-password`

- **Body:** `{ currentPassword; newPassword; confirmNewPassword }`
- **Errors:** `401` wrong password; `400` mismatch
- **Screen:** Security settings

### `PATCH /users/change-email` / `PATCH /users/change-phone`

- **Body:** email/phone + `password`
- **Errors:** `401`; `409` duplicate
- **Screen:** Account settings

### `POST /users/block/:targetUserId` / `DELETE /users/block/:targetUserId`

- **Screen:** Block controls

### `GET /users/blocked`

- **Screen:** Block list

### `POST /users/report`

- **Body:** `ReportUserDto` (`targetUserId`, `reason` enum, optional `description`)
- **Screen:** Report user modal

### `GET /users/sessions`

- **Auth:** required
- **Response:** `{ activeSessions: number }` — count of Redis-backed refresh sessions for the current user
- **Screen:** Account security (“active sessions”)

### `DELETE /users/sessions`

- **Auth:** required
- **Response:** `{ message: string }` — deletes all refresh keys for the user (sign out everywhere except clients still holding old access JWTs until expiry)
- **Screen:** “Sign out of all devices”

### `POST /users/fcm-token` / `DELETE /users/fcm-token`

- **Body:** `{ token: string }` (FCM device token)
- **Auth:** required
- **Screen:** Push notification registration / logout cleanup

### Frontend integration notes — Profile + onboarding

- Single **UserProfile** context or React Query `['me']` query for `/auth/me`.
- Gate app routes on `onboardingCompleted` + `nextStep` from `/onboarding/status`.

---

## MODULE 8 — ADMIN

Base path: `/admin`. All routes require **admin** or **superadmin** JWT (`AdminGuard`). Role `PATCH .../role` additionally requires **superadmin** (`SuperAdminGuard`).

### `GET /admin/stats`

- **Response:** platform metrics object (users, trips, requests, bookings, revenue, impact)
- **Screen:** Admin dashboard home

### `GET /admin/users`

- **Query:** search, role, accountType, status, isVerified, dateFrom, dateTo, page, limit
- **Screen:** User list

### `GET /admin/users/:userId`

- **Response:** full user (no secrets) + stats + recent booking/trip/request ids
- **Screen:** Admin user detail

### `PATCH /admin/users/:userId/suspend`

- **Body:** `{ reason: string }`
- **Errors:** `403` if target is admin
- **Screen:** Suspend user

### `PATCH /admin/users/:userId/ban`

- **Body:** `{ reason: string }`
- **Screen:** Ban user

### `PATCH /admin/users/:userId/reinstate`

- **Screen:** Reinstate

### `PATCH /admin/users/:userId/role`

- **Auth:** superadmin only
- **Body:** `{ role: 'user' | 'admin' }`
- **Screen:** Superadmin role management

### `GET /admin/trips` / `GET /admin/requests` / `GET /admin/bookings`

- **Query:** filters + pagination per controller
- **Screen:** Ops monitors

### `GET /admin/disputes`

- **Screen:** Dispute queue

### `POST /admin/disputes/:bookingId/resolve`

- **Body:** `ResolveDisputeDto` (`resolution`, optional `refundAmount`, `notes`)
- **Screen:** Resolve dispute form

### `GET /admin/support-requests`

- **Screen:** Support moderation queue

### `POST /admin/support-requests/:requestId/approve`

- **Body:** `{ notes?: string }`
- **Screen:** Approve support request

### `POST /admin/support-requests/:requestId/reject`

- **Body:** `{ notes: string }` (required)
- **Screen:** Reject support request

### `GET /admin/impact`

- **Query:** optional `dateFrom`, `dateTo`
- **Screen:** Impact dashboard

### `GET /admin/referrals`

- **Screen:** Referrals list

### `GET /admin/loyalty`

- **Screen:** Loyalty overview

### Frontend integration notes — Admin

- Separate **AdminLayout** using the same tokens but a distinct axios instance or `baseURL` prefix `/admin` is not needed — same host, same client, route group `/admin/*` in React.
- Handle `403` with “Not authorized” if a normal user hits admin routes.

---

## MODULE 9 — FILE UPLOAD

Base path: `/upload` (JWT). **Multipart form field name:** `file` (single file).

### `POST /upload/avatar`

- **Body:** `multipart/form-data` with field `file`
- **Response:** `{ url: string }` — also updates `User.profilePhoto` server-side; deletes previous **local** avatar URL if it pointed at this API’s `BASE_URL`
- **Errors:** `400` invalid type/size; `401`
- **Screen:** Profile photo change

### `POST /upload/delivery/:bookingId`

- **Auth:** must be booking requester or traveler
- **Response:** `{ url: string }` — then call `POST /bookings/:id/proof-of-delivery` with `podPhotoUrl: url`
- **Screen:** Proof-of-delivery camera / picker

### `POST /upload/item`

- **Response:** `{ url: string }` — attach to request payload where your UI stores item images
- **Screen:** Optional item photos on create request

### `POST /upload/chat/:bookingId`

- **Auth:** booking participant
- **Response:** `{ url: string }` — pass as `imageUrl` on `POST /chat/:bookingId/messages`
- **Screen:** Chat image picker

### Frontend integration notes — File upload

- Use `FormData`: `formData.append('file', blob, 'photo.jpg')`.
- Max size defaults to **5MB**; allowed MIME **jpeg, png, webp** (configurable server-side).
- After avatar upload, refresh `GET /auth/me` or patch local user state with returned `url`.

---

## Environment variables (frontend)

```env
VITE_API_BASE_URL=http://localhost:3000
```

Build API URLs as `` `${import.meta.env.VITE_API_BASE_URL}/auth/login` ``.

---

## Suggested API client setup

Axios example with refresh and typed helper:

```ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

const api = axios.create({ baseURL });

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const rt = localStorage.getItem('tohdah_refresh');
  if (!rt) return null;
  const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken: rt });
  setAccessToken(data.accessToken);
  localStorage.setItem('tohdah_refresh', data.refreshToken);
  return data.accessToken;
}

api.interceptors.response.use(
  (r) => r,
  async (err: AxiosError) => {
    const status = err.response?.status;
    const original = err.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (status === 401 && !original._retry) {
      original._retry = true;
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const newToken = await refreshPromise;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export async function apiRequest<T>(
  method: 'get' | 'post' | 'patch' | 'put' | 'delete',
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await api.request<T>({ url: path, method, data: body });
  return res.data;
}
```

---

## Error handling convention

NestJS errors are JSON bodies shaped like:

```ts
interface HttpErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
}
```

- Read `statusCode` for branching; display `message` (if array, join) in a toast.
- **401:** trigger refresh flow or logout.
- **403:** permission denied (different from 401).
- **404:** missing resource.
- **409:** conflict (duplicate email/phone, etc.).

Normalize handling in one `handleApiError(err)` utility.

---

## WebSocket / real-time note

Chat, notifications, and live booking tracking **do not use WebSockets** in this backend version. Use **HTTP polling** instead:

| Feature | Endpoint | Suggested interval |
|--------|----------|----------------------|
| Chat (thread open) | `GET /chat/:bookingId/messages` | **5s** |
| Notifications (app open) | `GET /notifications` (e.g. `isRead=false`) | **30s** |
| Live tracking (screen open) | `GET /bookings/:id` | **10s** |

**Upgrade path:** Socket.io (or similar) for chat typing, delivery updates, and notification push is planned but **not implemented** yet—keep polling logic behind small hooks (`usePoll`) so you can swap transport later.
