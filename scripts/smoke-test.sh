#!/usr/bin/env bash
# Run: chmod +x scripts/smoke-test.sh && ./scripts/smoke-test.sh
# Requires: curl, jq, API running at localhost:3000 with MongoDB
# Note: creates test users — re-running will fail on step 2/3 (duplicate email).
# Clear test users between runs, e.g.:
#   db.users.deleteMany({ email: /smoke\.com$/ })
#
# Base URL includes API version prefix (see main.ts setGlobalPrefix).
# Step 8 (forgot-password) sends a real email when RESEND_API_KEY is set — OTP is no
# longer returned in the JSON body; check the inbox instead.
#
# Step 11 optionally creates POST /payments/intent/:bookingId when STRIPE_SECRET_KEY is set.
# Steps 12+ require status=paid. When MONGODB_URI points at localhost/127.0.0.1 and mongosh
# is installed, step [11b] marks the booking paid (dev smoke only; use real Stripe in prod).

set -e
BASE="${BASE_URL:-http://localhost:3000/api/v1}"

command -v curl >/dev/null 2>&1 || { echo "curl required"; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "jq required"; exit 1; }

smoke_mark_booking_paid() {
  local bid="$1"
  local URI="${MONGODB_URI:-mongodb://127.0.0.1:27017/tohdah}"
  if [[ "$URI" != *localhost* && "$URI" != *127.0.0.1* ]]; then
    echo "Refusing auto paid: MONGODB_URI must reference localhost for smoke safety."
    return 1
  fi
  command -v mongosh >/dev/null 2>&1 || {
    echo "mongosh required to mark booking paid for smoke (or confirm PaymentIntent via Stripe + webhook)."
    return 1
  }
  mongosh "$URI" --quiet --eval \
    "db.bookings.updateOne({_id:ObjectId(\"$bid\")},{\$set:{status:\"paid\",paymentIntentId:\"pi_smoke_local\"}})" \
    >/dev/null
}

echo "=== Tohdah API Smoke Test ==="
echo "BASE=$BASE"

echo "[1] Health check..."
curl -sf "$BASE/" | jq .

echo "[2] Register traveler..."
curl -sf -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test Traveler","email":"traveler@smoke.com","phoneNumber":"+15550001111","password":"Test1234!","accountType":"traveler"}' | jq .

echo "[3] Register requester..."
curl -sf -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test Requester","email":"requester@smoke.com","phoneNumber":"+15550002222","password":"Test1234!","accountType":"requester"}' | jq .

echo "[4] Login traveler..."
T_LOGIN=$(curl -sf -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"traveler@smoke.com","password":"Test1234!"}')
T_TOKEN=$(echo "$T_LOGIN" | jq -r .accessToken)
T_REFRESH=$(echo "$T_LOGIN" | jq -r .refreshToken)
T_ID=$(echo "$T_LOGIN" | jq -r .user.id)
echo "Traveler id: $T_ID token: ${T_TOKEN:0:20}..."

echo "[5] Login requester..."
R_LOGIN=$(curl -sf -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"requester@smoke.com","password":"Test1234!"}')
R_TOKEN=$(echo "$R_LOGIN" | jq -r .accessToken)
R_ID=$(echo "$R_LOGIN" | jq -r .user.id)
echo "Requester id: $R_ID token: ${R_TOKEN:0:20}..."

echo "[6] Auth me (traveler)..."
curl -sf "$BASE/auth/me" -H "Authorization: Bearer $T_TOKEN" | jq .email

echo "[7] Create trip..."
TRIP=$(curl -sf -X POST "$BASE/trips" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $T_TOKEN" \
  -d '{"origin":"London","destination":"Paris","departureDate":"2026-08-01T00:00:00.000Z","arrivalDate":"2026-08-02T00:00:00.000Z","luggageSpace":"medium","pricingType":"fixed","pricePerKg":5,"acceptedCategories":["documents","clothing"],"openToCommunitySupport":true}')
TRIP_ID=$(echo "$TRIP" | jq -r '._id // .id')
echo "Trip ID: $TRIP_ID"

echo "[8] Create request..."
REQUEST=$(curl -sf -X POST "$BASE/requests" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $R_TOKEN" \
  -d '{"type":"standard","itemName":"Book","itemDescription":"A paperback novel","itemCategory":"documents","itemSize":"small","origin":"London","destination":"Paris","deliveryDeadline":"2026-08-02T00:00:00.000Z","budget":20}')
REQUEST_ID=$(echo "$REQUEST" | jq -r '._id // .id')
echo "Request ID: $REQUEST_ID"

echo "[9] Match request to trip..."
BOOKING=$(curl -sf -X POST "$BASE/bookings/match" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $R_TOKEN" \
  -d "{\"requestId\":\"$REQUEST_ID\",\"tripId\":\"$TRIP_ID\",\"offeredFee\":15}")
BOOKING_ID=$(echo "$BOOKING" | jq -r '._id // .id')
echo "Booking ID: $BOOKING_ID ref: $(echo "$BOOKING" | jq -r .bookingRef)"
POD_CODE=$(echo "$BOOKING" | jq -r .podConfirmationCode)
echo "POD code: $POD_CODE"

echo "[10] Traveler accepts booking..."
curl -sf -X POST "$BASE/bookings/$BOOKING_ID/accept" -H "Authorization: Bearer $T_TOKEN" | jq -r .status

if [[ -n "${STRIPE_SECRET_KEY:-}" ]]; then
  echo "[11] Create Stripe PaymentIntent (requester)..."
  INTENT=$(curl -sf -X POST "$BASE/payments/intent/$BOOKING_ID" \
    -H "Authorization: Bearer $R_TOKEN")
  echo "$INTENT" | jq .
else
  echo "[11] Skipping PaymentIntent (STRIPE_SECRET_KEY unset — set it to exercise Stripe)."
fi
echo "[11b] Mark booking paid for local smoke (localhost Mongo + mongosh only)..."
smoke_mark_booking_paid "$BOOKING_ID"
echo "Marked paid for smoke continuation."

echo "[12] In transit..."
curl -sf -X POST "$BASE/bookings/$BOOKING_ID/in-transit" -H "Authorization: Bearer $T_TOKEN" | jq -r .status

echo "[13] Proof of delivery..."
curl -sf -X POST "$BASE/bookings/$BOOKING_ID/proof-of-delivery" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $T_TOKEN" \
  -d "{\"podPhotoUrl\":\"https://example.com/photo.jpg\",\"podConfirmationCode\":\"$POD_CODE\"}" | jq -r .status

echo "[14] Complete booking..."
curl -sf -X POST "$BASE/bookings/$BOOKING_ID/complete" -H "Authorization: Bearer $R_TOKEN" | jq -r .status

echo "[15] Leave review..."
curl -sf -X POST "$BASE/reviews" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $R_TOKEN" \
  -d "{\"bookingId\":\"$BOOKING_ID\",\"revieweeId\":\"$T_ID\",\"overallRating\":5,\"comment\":\"Excellent smoke test delivery!\"}" | jq -r .overallRating

echo "[16] Trust score (traveler)..."
curl -sf "$BASE/trust/user/$T_ID" -H "Authorization: Bearer $T_TOKEN" | jq -r .score

echo "[17] Notifications (traveler)..."
curl -sf "$BASE/notifications" -H "Authorization: Bearer $T_TOKEN" | jq -r .unreadCount

echo "[18] Chat message..."
curl -sf -X POST "$BASE/chat/$BOOKING_ID/messages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $R_TOKEN" \
  -d '{"content":"Thanks for the delivery!"}' | jq -r .content

echo "[19] Token refresh..."
NEW_TOKENS=$(curl -sf -X POST "$BASE/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$T_REFRESH\"}")
T_REFRESH=$(echo "$NEW_TOKENS" | jq -r .refreshToken)
echo "$(echo "$NEW_TOKENS" | jq -r .accessToken)" | cut -c1-30
echo "..."

echo "[20] Logout traveler..."
curl -sf -X POST "$BASE/auth/logout" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$T_REFRESH\"}" | jq -r .message

echo ""
echo "=== All 20 smoke tests passed ==="
