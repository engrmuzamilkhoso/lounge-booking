# Architecture Analysis — Majestic Lounge (Laravel)

> Phase 1 output. Describes the system **as it exists in source code and the latest database dump**
> (`backup/new_majestic.sql`, generated 21 Jul 2026, MariaDB 10.11). Nothing here is assumed.
> Analysed on branch `dev` including uncommitted working-copy changes.

## 1. What the system is

A customer-facing booking site for **airport premium services** in Pakistan (Meet & Assist, Lounge,
Premier Services, Corporate Membership), plus an internal **admin panel**, plus a small
**mobile-app REST API**.

Customers register, pick a service/product, choose passenger counts, enter flight and passenger
details, and submit a booking. There is **no online payment**: a booking is a request, and the
business is notified by email. Lounge access is tied to a **bank card** (eligible card list with BINs);
membership-based bookings consume **visits** from an approved membership.

## 2. Technology inventory

| Area             | Current                                                                                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework        | Laravel 10 (`laravel/framework ^10.0`), PHP ^8.1 (prod runs PHP 8.4)                                                                                             |
| Scaffold origin  | Laravel **QuickAdminPanel** generator (permission naming, `_fk_917xxxx` FK names, CRUD layout)                                                                   |
| Database         | **MariaDB** 10.11 (prod), driver `mysql`                                                                                                                         |
| Auth (web)       | Session auth via `laravel/ui` `AuthenticatesUsers` / `RegistersUsers`                                                                                            |
| Auth (API)       | `laravel/sanctum` personal access tokens                                                                                                                         |
| Authorization    | Custom RBAC: `roles`, `permissions`, pivots; `AuthGates` middleware defines a Gate per permission on every web request                                           |
| Admin UI         | CoreUI 3.2 + Bootstrap 4 + jQuery 3.3 + DataTables (server-side via `yajra/laravel-datatables-oracle`) + Select2 + Dropzone + CKEditor 5 + moment, all from CDNs |
| Public UI        | UIdeck-style template: Bootstrap (bundled), jQuery 3.7.1, WOW.js, animate.css, LineIcons, Toastify; custom `public/front_assets/js/main.js` (640 lines)          |
| Media            | `spatie/laravel-medialibrary` v10 configured on Product, ProductCategory, Card, BookingDetail, Membership — **`media` table has 0 rows**                         |
| Charts           | `laraveldaily/laravel-charts` (used as config arrays only; dashboard renders number blocks)                                                                      |
| Mail             | SMTP, all mail queued (`Mail::queue`)                                                                                                                            |
| Queue            | `database` driver; worker started by a cPanel cron running `artisan queue:work`                                                                                  |
| Scheduler        | None (`Console\Kernel::schedule` empty)                                                                                                                          |
| Sessions / cache | file                                                                                                                                                             |
| Build tooling    | Vite configured but **unused** — assets are static files in `public/`                                                                                            |
| Timezone         | `config/app.php` → `UTC`                                                                                                                                         |
| Hosting          | Shared cPanel host (MariaDB `-cll-lve`, `/home/<account>/...` paths)                                                                                             |

## 3. Code structure

```
app/
  Http/Controllers/
    HomeController.php, ServicesController.php     ← public site + booking flow
    Auth/*                                           ← web login/register/password
    Admin/* (24 controllers)                         ← admin CRUD (QuickAdminPanel)
    Api/V1/Admin/* (16 controllers)                  ← mobile API + generated CRUD APIs
    Traits/ ApiResponse, ApiLogger, Common, MediaUploadingTrait
  Http/Requests/*        ← Store/Update/MassDestroy FormRequests (authorize() = Gate check)
  Http/Middleware/AuthFront.php, AuthGates.php
  Models/* (22)           ← Eloquent, most with SoftDeletes + Auditable
  Traits/Auditable.php    ← writes audit_logs on created/updated/deleted
  Mail/* (6)              ← order, inquiry, OTP, welcome, register notification
  Enums/Responses.php     ← mobile API status codes ("0000|Success" …)
resources/views/
  frontend/* (25 + ajax)  ← public site
  admin/* (~100)          ← admin CRUD screens
  emails/*                ← HTML email templates
routes/web.php, routes/api.php
```

There is **no service layer**: all business logic lives in controllers.

## 4. Request flows

### 4.1 Public booking flow (the core business workflow)

```
/lounge (auth)  → choose service tile
  /meet_assist | /lounge_services | /premier_services | /membership_services   (service id hard-coded 1/2/4/3)
     → tabs call GET /get_products?service_id&category_id  (returns HTML fragment)
     → user adjusts adult/child/infant/guest counters; total computed in browser (main.js)
  GET /bookingForm?product_id&service_id&category_id&adults[]&children[]&infants[]&guests[]&total_amount&membership_id
     → renders passenger form (+ bank card select when service_id == 2)
  POST /addBookingDetail
     → generate code "ML" + (last booking id + 1) zero-padded to 7
     → insert bookings row (source_request_id = 1 "Web")
     → insert one booking_details row per adult/child/infant
     → queue orderMail to configured notification emails + customer
     → redirect /thankyou with order number
```

Membership path: on `/membership_services` the customer enters a membership number →
`GET /verify_membership` returns `0` (not found / not approved), `2` (visit limit used), or `1` (ok),
and stores the membership id in session.

### 4.2 Authentication flows

- Web login `POST /login` (custom form on `/signin`, hidden `screen=front` → redirect `/lounge`,
  otherwise `/admin`). Admin login view at `/cauth`.
- Web register `POST /register` → user + role 2 (Customer) + welcome email to staff.
- Web password reset: Laravel default broker (`password_resets` table).
- API: `POST /api/v1/auth/login|register|logout|requestOtp|verifyOtp|resetPassword` (Sanctum).

### 4.3 Admin

`/admin/*` behind `auth`. Every controller action checks `Gate::denies('<permission>')`.
Dashboard (`/admin`) additionally hard-requires role id 1 (Admin).

## 5. Integrations

| Integration     | Present?           | Notes                                                                                                                               |
| --------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Payment gateway | **No**             | No gateway code. `bank_id` = eligible bank card for lounge access, not a payment.                                                   |
| Email (SMTP)    | Yes                | 6 mailables, queued                                                                                                                 |
| SMS / WhatsApp  | Partial            | `POST /api/v1/booking/whatsappBookingStore` writes to `whatsapp_booking` — **table does not exist in prod dump** (uncommitted work) |
| File storage    | Configured, unused | media library wired, 0 media rows                                                                                                   |
| Google AdSense  | Yes                | AdSense script tag in admin layout                                                                                                  |
| Google OAuth    | No code            | an OAuth client id is noted in a text file only                                                                                     |

## 6. Background processing

- Only queued mail. Worker run by cron. 462 rows in `jobs`, 87 in `failed_jobs` at dump time —
  indicates the worker is not reliably draining the queue and mail is failing.
- No scheduled tasks.

## 7. Risks and defects found

Severity: **C** critical, **H** high, **M** medium, **L** low.

### Security

| #   | Sev   | Finding                                                                                                                                                                                                    | Location                                                               |
| --- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| S1  | **C** | `POST /api/v1/auth/resetPassword` resets **any** user's password given only an email. No OTP / token proof is required. Account takeover, including Admin.                                                 | `Api/V1/Admin/AuthController::resetPassword`                           |
| S2  | **C** | Plaintext hosting/cPanel credentials and an OAuth client secret-like value are stored in repo-root text files (`c.txt`, `db change.txt`, `aaa`). `new_majestic.sql` dumps with customer PII are committed. | repo root                                                              |
| S3  | H     | `GET /api/v1/booking/getBookingsByCustomer?customer_id=` returns any customer's bookings (IDOR).                                                                                                           | `Api/V1/Admin/BookingController`                                       |
| S4  | H     | `GET /api/v1/booking/store` (GET!) takes `customer_id` from the request and mass-assigns `$request->all()` — a user can create bookings for others and set any fillable field.                             | same                                                                   |
| S5  | H     | Booking `total_amount` is computed in the browser and trusted by the server.                                                                                                                               | `main.js::calculateTotalPrice`, `ServicesController::addBookingDetail` |
| S6  | H     | Membership visit limit is only checked by the AJAX `verify_membership`; `addBookingDetail` does not re-check, and does not check the membership belongs to the user.                                       | `ServicesController`                                                   |
| S7  | M     | OTP is 4 digits, `rand()`, no attempt limit, logged in plain text to the daily log.                                                                                                                        | `AuthController::requestOtp`                                           |
| S8  | M     | Web registration validator is empty (all rules commented out).                                                                                                                                             | `Auth/RegisterController::validator`                                   |
| S9  | M     | `check_email_exist` allows email enumeration.                                                                                                                                                              | `RegisterController`                                                   |
| S10 | M     | Generated CRUD APIs under `/api/v1/*` (bookings, cards, memberships …) are reachable by any Sanctum token; authorization depends on Gates which are only defined by the **web** `AuthGates` middleware.    | `routes/api.php`                                                       |
| S11 | L     | `/bookingDetail/{id}` and `/mybookings` have no `AuthFront` middleware; they call `Auth::user()->id` and error for guests.                                                                                 | `routes/web.php`                                                       |

### Correctness / data integrity

| #   | Sev | Finding                                                                                                                                                                                                                                                              |
| --- | --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | H   | Booking code = last id + 1 with no lock/unique constraint → **4 duplicate booking codes already in production**.                                                                                                                                                     |
| D2  | H   | Child/infant `guardian_contact` is collected on the form but **never saved** (not fillable, no column).                                                                                                                                                              |
| D3  | H   | Admin "create booking" uses `Product::with('categories')` (relation does not exist) and a non-existent `booking_booking_detail` pivot → admin booking create is broken. Admin booking edit loads non-existent relations `booking_type`, `card`, `movement` → broken. |
| D4  | M   | `cards` model fillable (`product_id`) does not match the table (`services_code`, `visit_type`, `sort_order`, `status`).                                                                                                                                              |
| D5  | M   | `whatsapp_booking` table missing in prod schema.                                                                                                                                                                                                                     |
| D6  | M   | Booking creation is not wrapped in a transaction (booking can exist without passengers).                                                                                                                                                                             |
| D7  | M   | No duplicate-submission protection on `POST /addBookingDetail`.                                                                                                                                                                                                      |
| D8  | L   | 69 `cards` rows contain MySQL zero-dates `0000-00-00`; `bookings.membership_id` uses `0` for "none".                                                                                                                                                                 |
| D10 | H   | Public membership application cannot be saved: `memberships.product_id` / `visit_limit` are NOT NULL without defaults, the form sends neither, and the DB connection is strict.                                                                                      |
| D9  | L   | Bookings have **no status column**; the `statuses` table is unused by bookings. No cancellation flow exists.                                                                                                                                                         |

### Operational

- Single shared host, file sessions, DB queue with cron-launched worker, 87 failed jobs.
- No automated tests, no CI.
- Large binaries committed (`vendor.zip` 63 MB, `new_majestic.zip` 26 MB).

## 8. Architectural observations for the migration

1. The domain is **small**: ~10 business entities, one core workflow. Most admin screens are
   generated CRUD.
2. Several entities are **scaffold leftovers** with no or trivial use (booking types, movements,
   vouchers, majestic cards, product tags, `product_product_category`). See `feature-inventory.md`.
3. Business rules are implicit (hard-coded service ids 1–4, category ids, role ids 1/2, source ids 1/2).
   The new system must make these explicit constants or seeded lookups with stable ids.
4. Mobile API contract (`{status:"0000", message:"Success", data}`) must be preserved if the
   mobile app is live — **needs confirmation** (all 179 bookings in prod have source "Web").
