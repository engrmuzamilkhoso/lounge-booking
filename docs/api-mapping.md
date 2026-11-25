# API Mapping — Laravel routes → NestJS endpoints / Next.js pages

Conventions for the new API:

- Base path `/api/v1`. JSON only. Proper HTTP status codes.
- Admin endpoints under `/api/v1/admin/*`, guarded by JWT + permission guard
  (`@RequirePermission('booking_access')`) using the **same permission titles** as today.
- Customer endpoints guarded by JWT; customer identity always taken from the token, never from the request body.
- Lists: `?page=&pageSize=&sort=&search=` → `{ items, total, page, pageSize }`.
- **One API for web and mobile.** The mobile app is built against this API (Laravel is being retired,
  so there is no legacy adapter). It keeps the Laravel mobile API's ideas: the same flows, and the
  `{ status, message, data }` envelope with an app-readable code, while also using correct HTTP status codes.

### Response format (web + mobile)

```jsonc
// 200 / 201
{ "status": "0000", "message": "Success", "data": { ... } }
// list endpoints add pagination
{ "status": "0000", "message": "Success", "data": [ ... ], "meta": { "page": 1, "pageSize": 20, "total": 179 } }
// 4xx / 5xx
{ "status": "0005", "message": "Missing-Parameters", "errors": { "flightNumber": ["flightNumber is required"] } }
```

The app switches on `status`; HTTP clients, logs and monitoring rely on the HTTP code.
Codes are normalised to 4 digits (Laravel's `00010`–`00012` become `0010`–`0012`). Codes and
HTTP mapping live in `packages/shared-types` so web, API and mobile share one list (§4).

## 1. Public site (web.php) → Next.js page + NestJS endpoint

| Laravel                                                                             | Next.js page                          | NestJS endpoint                                                         |
| ----------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------- |
| `GET /`                                                                             | `/`                                   | —                                                                       |
| `GET /aboutus`, `/contact-us`, `/terms-conditions`, `/privacy-policy`, `/products`  | same paths                            | —                                                                       |
| `GET /faq`                                                                          | `/faq`                                | `GET /faq`                                                              |
| `POST /createInquiry`                                                               | contact form                          | `POST /inquiries` (honeypot preserved, rate-limited)                    |
| `GET /signin`, `POST /login`                                                        | `/signin`                             | `POST /auth/login`                                                      |
| `GET /signup`, `POST /register`                                                     | `/signup`                             | `POST /auth/register`                                                   |
| `GET /check_email_exist`                                                            | signup form                           | `GET /auth/email-available?email=` (rate-limited)                       |
| Laravel password reset routes                                                       | `/forgot-password`, `/reset-password` | `POST /auth/forgot-password`, `POST /auth/reset-password`               |
| `GET /lounge`                                                                       | `/lounge` (protected)                 | `GET /services`                                                         |
| `GET /meet_assist`, `/lounge_services`, `/premier_services`, `/membership_services` | same paths (protected)                | `GET /services/:id`, `GET /products?serviceId=&categoryId=`             |
| `GET /get_products` (HTML fragment)                                                 | client-side render                    | `GET /products?serviceId=&categoryId=`                                  |
| `GET /verify_membership`                                                            | membership page                       | `POST /memberships/verify` → `{ valid, remainingVisits, membershipId }` |
| `GET /bookingForm`                                                                  | `/booking/new?productId=…`            | `GET /products/:id`, `GET /cards`                                       |
| `POST /addBookingDetail`                                                            | booking form submit                   | `POST /bookings` (transaction, server-side price, idempotency key)      |
| `GET /thankyou`                                                                     | `/booking/thank-you?code=`            | —                                                                       |
| `GET /mybookings`                                                                   | `/my-bookings`                        | `GET /me/bookings`                                                      |
| `GET /bookingDetail/{id}`                                                           | `/my-bookings/[id]`                   | `GET /me/bookings/:id` (owner check)                                    |
| `GET /membership`                                                                   | `/membership`                         | `GET /membership-types`                                                 |
| `GET /membershipForm`, `POST /membershipCreate`                                     | `/membership/apply`                   | `POST /memberships/applications`                                        |
| `GET /cauth` (admin login view)                                                     | `/admin/login`                        | `POST /auth/login`                                                      |
| `/profile/password` (GET/POST)                                                      | `/admin/profile`                      | `PATCH /me/password`, `PATCH /me`                                       |

## 2. Admin (web.php `/admin/*`) → `/api/v1/admin/*`

| Laravel resource                                                               | Permission prefix                                   | NestJS endpoints                                                                                       |
| ------------------------------------------------------------------------------ | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `GET /admin` dashboard                                                         | `dashboard` (today: role 1)                         | `GET /admin/dashboard`                                                                                 |
| `users` (+ `storeCustomer`)                                                    | `user_`                                             | `GET/POST /admin/users`, `GET/PATCH/DELETE /admin/users/:id`, `DELETE /admin/users` (bulk)             |
| `roles`                                                                        | `role_`                                             | `/admin/roles` CRUD                                                                                    |
| `permissions`                                                                  | `permission_`                                       | `/admin/permissions` CRUD                                                                              |
| `services`                                                                     | `service_`                                          | `/admin/services` CRUD                                                                                 |
| `product-categories`                                                           | `product_category_`                                 | `/admin/product-categories` CRUD                                                                       |
| `products`, `products/lounge_service_products`, `products/membership_products` | `product_`, `product_lounge`, `product_memberships` | `/admin/products` CRUD + `?serviceId=` / `?categoryId=` filters                                        |
| `bookings`                                                                     | `booking_`                                          | `/admin/bookings` CRUD (create/edit to be **fixed**, currently broken)                                 |
| `bookings/makeAttendeeClone`                                                   | —                                                   | not needed (client-side form row)                                                                      |
| `booking-details`                                                              | `booking_detail_`                                   | `/admin/bookings/:id/attendees` CRUD                                                                   |
| `memberships`, `approveMembership`, `getApproveMembershipForm`                 | `membership_`, `approve_membership`                 | `/admin/memberships` CRUD, `GET /admin/memberships/next-serial`, `POST /admin/memberships/:id/approve` |
| `membership-types`                                                             | `membership_type_`                                  | `/admin/membership-types` CRUD                                                                         |
| `cards`                                                                        | `card_`                                             | `/admin/cards` CRUD                                                                                    |
| `nationalities`, `statuses`, `source-requests`                                 | `nationality_`, `status_`, `source_request_`        | lookup CRUD                                                                                            |
| `faq-categories`, `faq-questions`                                              | `faq_category_`, `faq_question_`                    | CRUD                                                                                                   |
| `audit-logs` (index/show)                                                      | `audit_log_`                                        | `GET /admin/audit-logs`, `GET /admin/audit-logs/:id`                                                   |
| `global-search`                                                                | —                                                   | `GET /admin/search?q=`                                                                                 |
| `booking-types`, `movements`, `vouchers`, `majestic-cards`, `product-tags`     | various                                             | **pending decision** (unused today)                                                                    |
| `*/media`, `*/ckmedia` uploads                                                 | various                                             | **pending decision** (media unused today)                                                              |

## 3. Mobile app endpoints (based on Laravel `api.php`)

The mobile app and the web app call the same customer endpoints. All are under `/api/v1`.

| Laravel                             | Laravel behaviour                             | New endpoint                                              | What changes                                                                                                                                                                                                                                                  |
| ----------------------------------- | --------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST auth/login`                   | `{user, token}`                               | `POST /auth/login`                                        | Returns `{ user, accessToken, refreshToken }` (JWT)                                                                                                                                                                                                           |
| —                                   | —                                             | `POST /auth/refresh`                                      | New: swaps a refresh token for a new pair (rotation)                                                                                                                                                                                                          |
| `POST auth/register`                | validated, role Customer, staff email         | `POST /auth/register`                                     | Same fields and rules (name, lname, email, password ≥ 6, cnic unique, contact)                                                                                                                                                                                |
| `POST auth/logout`                  | revokes all tokens                            | `POST /auth/logout`                                       | Revokes this device's refresh token; `?allDevices=true` keeps the old behaviour                                                                                                                                                                               |
| `POST auth/requestOtp`              | 4-digit OTP by email, 5 min                   | `POST /auth/otp/request`                                  | Same email and expiry; OTP stored hashed; rate-limited; same response whether the email exists or not                                                                                                                                                         |
| `POST auth/verifyOtp`               | success only                                  | `POST /auth/otp/verify`                                   | Returns `{ resetToken }` (single use, 15 min); max 5 attempts per OTP                                                                                                                                                                                         |
| `POST auth/resetPassword`           | email + password, **no proof**                | `POST /auth/password/reset`                               | Requires `resetToken` + new password                                                                                                                                                                                                                          |
| —                                   | —                                             | `GET /me`, `PATCH /me`, `PATCH /me/password`              | Profile (web already had this; app gets it too)                                                                                                                                                                                                               |
| `GET lounge_service/list`           | all services                                  | `GET /services`                                           | Same fields incl. `appDesc`, `appRoute`, `appIcon`                                                                                                                                                                                                            |
| `GET products/list`                 | by service + category                         | `GET /products?serviceId=&categoryId=`                    | Same filter; excludes soft-deleted                                                                                                                                                                                                                            |
| (web only)                          |                                               | `GET /cards`                                              | Eligible bank cards for lounge bookings                                                                                                                                                                                                                       |
| (web only)                          |                                               | `GET /nationalities`                                      | For attendee forms                                                                                                                                                                                                                                            |
| (web only)                          |                                               | `GET /membership-types`, `POST /memberships/applications` | Membership plans and application                                                                                                                                                                                                                              |
| (web only)                          |                                               | `POST /memberships/verify`                                | `{ membershipId, remainingVisits }` or code `0013`/`0014`                                                                                                                                                                                                     |
| `GET booking/store`                 | GET; `customer_id` from client; no passengers | `POST /bookings`                                          | POST; customer from token; **same rules as web**: attendees per adult/child/infant, bank card required for Lounge, price computed by server, membership visits checked, `Idempotency-Key` header; `sourceRequestId` = 2 (App) or 1 (Web) from the client type |
| `GET booking/getBookingsByCustomer` | any `customer_id`                             | `GET /me/bookings`, `GET /me/bookings/:id`                | Own bookings only; paginated                                                                                                                                                                                                                                  |
| `POST booking/whatsappBookingStore` | table missing                                 | `POST /whatsapp-bookings`                                 | Same fields and validation (service, amount, departure date `YYYY-MM-DD`, time `HH:mm:ss`, non-negative quantities)                                                                                                                                           |
| scaffold `apiResource` routes       | unclear authorization                         | —                                                         | Removed; admin functions are under `/admin/*` with permission checks                                                                                                                                                                                          |

## 4. Response codes

Existing Laravel codes are kept with the same meaning; new codes cover cases Laravel didn't handle.

| Code | Message                   | HTTP      | Source                                                                        |
| ---- | ------------------------- | --------- | ----------------------------------------------------------------------------- |
| 0000 | Success                   | 200 / 201 | Laravel                                                                       |
| 0001 | Invalid-Email             | 400       | Laravel                                                                       |
| 0002 | Invalid-Credentials       | 401       | Laravel                                                                       |
| 0003 | User-Exists               | 409       | Laravel                                                                       |
| 0004 | Invalid-Data              | 422       | Laravel                                                                       |
| 0005 | Missing-Parameters        | 422       | Laravel                                                                       |
| 0006 | Invalid-Email-Format      | 422       | Laravel                                                                       |
| 0007 | Email-Not-Found           | 404       | Laravel (only used where it doesn't reveal accounts, i.e. not on OTP request) |
| 0008 | Invalid-OTP-Format        | 422       | Laravel                                                                       |
| 0009 | Invalid-OTP               | 400       | Laravel                                                                       |
| 0010 | OTP-Expired               | 400       | Laravel `00010`                                                               |
| 0011 | No-Record                 | 404       | Laravel `00011` (lists return `[]` with 0000, not this)                       |
| 0012 | Invalid-Data-Type         | 422       | Laravel `00012`                                                               |
| 0013 | Membership-Not-Found      | 404       | new (web returned `0`)                                                        |
| 0014 | Membership-Limit-Exceeded | 409       | new (web returned `2`)                                                        |
| 0015 | Unauthorized              | 401       | new (missing/expired token)                                                   |
| 0016 | Forbidden                 | 403       | new                                                                           |
| 0017 | Invalid-Reset-Token       | 400       | new                                                                           |
| 0018 | Too-Many-Attempts         | 429       | new                                                                           |
| 0019 | Price-Mismatch            | 409       | new (client total ≠ server total; booking not created)                        |
| 9999 | Server-Error              | 500       | new                                                                           |

## 5. Online payments (Safepay) — added 26 Nov 2026

| Endpoint                                       | Who                    | Purpose                                                                                                                                                                          |
| ---------------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /bookings/:id/checkout`                  | customer (own booking) | Create or reuse the Safepay session; returns `{ checkoutUrl, amount, currency }`. `0020` free booking, `0021` already paid, `0022` gateway error, `0023` payments not configured |
| `POST /payments/safepay/confirm` `{ tracker }` | customer (own payment) | After Safepay's redirect: verify with Safepay and return `{ bookingId, bookingCode, bookingPaymentStatus, paymentStatus }`                                                       |
| `POST /payments/safepay/webhook`               | Safepay (signed)       | `payment.succeeded` / `payment.failed` / `payment.refunded`; signature `x-sfpy-signature` (HMAC-SHA512). Not in Swagger                                                          |
| `POST /auth/google` `{ idToken }`              | public                 | Google sign-in / sign-up; returns the session plus `isNewAccount`                                                                                                                |

Booking responses now include `paymentStatus` (`not_required`, `pending`, `paid`, `failed`, `refunded`) and `payments[]`.

## 6. Lounge passes (QR check-in) — added 26 Nov 2026

New feature, not in Laravel. Every booking has an unguessable `pass_token` (64 hex characters,
generated by the database). Once a booking is settled (`paymentStatus` `paid` or `not_required`)
the customer sees it as a QR code on the payment-success page, on the booking page and in the
confirmation email. The QR code holds `<WEB_URL>/staff/pass/<token>`.

| Endpoint | Permission | Purpose |
|---|---|---|
| `GET /me/bookings/:id` → `pass` | customer | `{ token, status, checkedInAt }`, `null` until paid |
| `GET /admin/booking-passes/:token` | `booking_show` | Verify a scanned pass |
| `GET /admin/booking-passes?code=ML0000201` | `booking_show` | Same, by booking reference |
| `POST /admin/booking-passes/:token/check-in` | `booking_show` + `booking_edit` | Let the customer in (single use, audited) |

Pass status: `valid`, `already_used`, `payment_required`, `expired` (departure more than one day
ago, Pakistan time), `cancelled` (booking deleted). The verification also returns `departsToday`
so staff are warned about passes for another day. Check-in errors: `0024 Pass-Already-Used`
(HTTP 409), `0025 Pass-Not-Valid` (HTTP 422). Two staff scanning the same pass at once cannot
both check it in (conditional update).

Website pages: `/staff/check-in` (camera scanner where the browser supports it, plus booking
reference lookup) and `/staff/pass/[token]` (verdict, passenger ID list, check-in button).
Phones whose browser cannot read QR codes (iPhone Safari) use the camera app: the QR code is a
link to the verification page.
