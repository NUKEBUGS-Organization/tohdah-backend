# Environment Variable Matrix

Cross-reference for **tohdah-backend** and **tohdah-frontend**. Values in `.env.example` are development defaults unless noted.

## Backend (`tohdah-backend/.env`)

| Variable                 | Required | Default / example           | Description |
|--------------------------|----------|-----------------------------|-------------|
| `PORT`                   | No       | `3000`                      | API listen port |
| `MONGODB_URI`            | Yes      | `mongodb://localhost:27017/tohdah` | MongoDB connection string |
| `CORS_ORIGIN`            | Yes      | `http://localhost:5173`     | Allowed browser origins (comma-separated) |
| `JWT_ACCESS_SECRET`      | Yes      | —                           | Secret for access tokens (~15m) |
| `JWT_REFRESH_SECRET`     | Yes      | —                           | Secret for refresh tokens |
| `JWT_RESET_SECRET`       | Yes      | —                           | Secret for password-reset tokens |
| `UPLOAD_DEST`            | No       | `./uploads`                 | Local upload directory when `USE_CLOUD_STORAGE=false` |
| `MAX_FILE_SIZE_MB`       | No       | `5`                         | Max upload size (MB) |
| `ALLOWED_FILE_TYPES`     | No       | `image/jpeg,image/png,...`  | Allowed MIME types for uploads |
| `BASE_URL`               | Yes      | `http://localhost:3000`     | Public API origin (returned in local file URLs; no `/api/v1` suffix) |
| `USE_CLOUD_STORAGE`      | No       | `false`                     | When `true`, uploads go to Cloudinary (Multer uses memory storage) |
| `CLOUDINARY_CLOUD_NAME`  | If cloud | —                           | Cloudinary cloud name |
| `CLOUDINARY_API_KEY`     | If cloud | —                           | Cloudinary API key |
| `CLOUDINARY_API_SECRET`  | If cloud | —                           | Cloudinary API secret |
| `RESEND_API_KEY`         | For mail | —                           | Resend API key; without it, transactional email is skipped (logged) |
| `EMAIL_FROM`             | No       | `noreply@tohdah.com`        | From address for Resend |
| `FRONTEND_URL`           | No       | `http://localhost:5173`     | Links in emails (welcome, booking) |
| `STRIPE_SECRET_KEY`      | For pay  | `sk_test_…`                 | Stripe secret key (PaymentIntents + refunds) |
| `STRIPE_WEBHOOK_SECRET`  | Webhooks | `whsec_…`                   | Stripe signing secret for `POST /payments/webhook` |
| `STRIPE_CURRENCY`        | No       | `usd`                       | Default currency for intents when booking has no `currency` |
| `THROTTLE_TTL_MS`        | No       | `60000`                     | Global throttler window (ms) |
| `THROTTLE_LIMIT`         | No       | `60`                        | Global max hits per window per IP |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | For FCM | `./firebase-service-account.json` | Path to Firebase service account JSON (gitignored); omit file to disable push |
| `REDIS_URL`              | Yes*     | `redis://localhost:6379`    | Redis connection URL for refresh sessions + OTP (`ioredis`) |
| `REDIS_TTL_SECONDS`      | No       | `604800`                    | TTL (seconds) for refresh token keys (default 7 days) |

\*Required for login/refresh/logout and password-reset OTP in production; without Redis those flows fail once the client tries to use them.

| `GOOGLE_CLIENT_ID`       | For Google sign-in | — | OAuth 2.0 Web client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET`   | For Google sign-in | — | OAuth client secret |
| `GOOGLE_CALLBACK_URL`    | For Google sign-in | `http://localhost:3000/api/v1/auth/google/callback` | Authorized redirect URI (must match Google Console exactly; includes global `/api/v1` prefix) |

## Frontend (`tohdah-frontend/.env`)

| Variable                        | Required | Default / example                    | Description |
|---------------------------------|----------|--------------------------------------|-------------|
| `VITE_API_BASE_URL`             | Yes      | `http://localhost:3000/api/v1`       | Backend REST prefix for `fetch` |
| `VITE_STRIPE_PUBLISHABLE_KEY`   | Checkout | `pk_test_…`                          | Stripe publishable key for Elements |
| `VITE_FIREBASE_API_KEY`         | For push | —                                    | Firebase Web SDK `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN`     | For push | —                                    | Firebase Web SDK `authDomain` |
| `VITE_FIREBASE_PROJECT_ID`      | For push | —                                    | Firebase Web SDK `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET`  | For push | —                                    | Firebase Web SDK `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | For push | —                              | Firebase Web SDK `messagingSenderId` |
| `VITE_FIREBASE_APP_ID`          | For push | —                                    | Firebase Web SDK `appId` |
| `VITE_FIREBASE_VAPID_KEY`       | For push | —                                    | Web Push certificate (FCM Console) |

## Production checklist

- [ ] Generate strong JWT secrets (min 64 chars, random)  
  `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- [ ] Set `MONGODB_URI` to Atlas or production cluster
- [ ] Set `CORS_ORIGIN` to the production frontend origin only
- [ ] Set `BASE_URL` to the production API origin (scheme + host + port if any)
- [ ] Set `RESEND_API_KEY` and verified `EMAIL_FROM` domain where required
- [ ] Set `STRIPE_SECRET_KEY` (live) and `STRIPE_WEBHOOK_SECRET` for production webhook URL
- [ ] Set `USE_CLOUD_STORAGE=true` and Cloudinary credentials (or keep disk + persistent volume)
- [ ] Change admin seed credentials immediately after first deploy
- [ ] Tune `THROTTLE_*` and upload limits to match reverse-proxy caps
- [ ] Enable MongoDB authentication and least-privilege DB users

## Still recommended (later scale)

- **WebSockets** for real-time chat instead of polling
