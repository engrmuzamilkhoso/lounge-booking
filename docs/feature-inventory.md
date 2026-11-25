# Feature Inventory

Every feature below was traced to source code. Status column:
**Live** = reachable and working · **Broken** = reachable but fails or loses data ·
**Partial** = unfinished · **Unused** = code exists, no data / no entry point.

## 1. Public website (customer)

| #   | Feature                                                 | Route(s)                                                                                                | Status                                                                               | Business rules found in code                                                                                                                                                                                                                                              |
| --- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | Home, About, Contact, Terms, Privacy, Products (static) | `/`, `/aboutus`, `/contact-us`, `/terms-conditions`, `/privacy-policy`, `/products`                     | Live                                                                                 | Static Blade content                                                                                                                                                                                                                                                      |
| F2  | FAQ                                                     | `/faq`                                                                                                  | Live                                                                                 | Lists all `faq_questions`                                                                                                                                                                                                                                                 |
| F3  | Contact / inquiry form                                  | `POST /createInquiry`                                                                                   | Live                                                                                 | Honeypot field `website`; emails staff list + submitter (`InquiryMail`)                                                                                                                                                                                                   |
| F4  | Sign up                                                 | `/signup`, `POST /register`                                                                             | Live                                                                                 | Fields: name, lname, cnic, contact, email, password. Assigns role 2 Customer. Emails staff (`welcomeMail`). Redirect `/signin?val=success`. Server-side validation **disabled**; client JS validates; `GET /check_email_exist` for duplicate-email check                  |
| F5  | Sign in / out                                           | `/signin`, `POST /login`                                                                                | Live                                                                                 | `screen=front` → `/lounge`; else `/admin`                                                                                                                                                                                                                                 |
| F6  | Forgot / reset password (web)                           | Laravel `Auth::routes`                                                                                  | Live (default)                                                                       | Laravel token email flow                                                                                                                                                                                                                                                  |
| F7  | Service hub                                             | `/lounge` (auth)                                                                                        | Live                                                                                 | 4 tiles: Meet & Assist, Lounge, Premier, Membership                                                                                                                                                                                                                       |
| F8  | Service product pages                                   | `/meet_assist` (service 1), `/lounge_services` (2), `/premier_services` (4), `/membership_services` (3) | Live                                                                                 | Products filtered by `(service_id, category_id)`; Meet & Assist uses category tabs (Domestic 1 / International 2) via `GET /get_products`                                                                                                                                 |
| F9  | Passenger counters & price                              | client JS                                                                                               | Live                                                                                 | `total = adults × price + max(0, children − child_limit) × child_price + max(0, infants − infant_limit) × infant_price + guests × guest_price`. **Computed only in browser.**                                                                                             |
| F10 | Membership verification                                 | `GET /verify_membership`                                                                                | Live                                                                                 | Membership must be `status = 2` with matching `serial_no`; remaining = `visit_limit − count(bookings with membership_id)`; ≤ 0 → "limit exceeded". Stores membership id in session                                                                                        |
| F11 | Booking form                                            | `GET /bookingForm`                                                                                      | Live                                                                                 | Bank card select (from `cards`) required only when `service_id == 2` (Lounge). Flight number, date, time. Per adult: name, dob, CNIC/passport, expiry, contact, email, nationality, address. Per child/infant: name, dob, nationality (select), address, guardian contact |
| F12 | Submit booking                                          | `POST /addBookingDetail`                                                                                | Live with defects                                                                    | Code `ML` + 7-digit (last id + 1). `source_request_id = 1`. Creates booking + attendee rows (type 1/2/3). Emails staff + customer (`orderMail`). Clears session membership. **Guardian contact lost; no transaction; no idempotency**                                     |
| F13 | Thank-you page                                          | `/thankyou`                                                                                             | Live                                                                                 | Shows order number from flash session                                                                                                                                                                                                                                     |
| F14 | My bookings                                             | `/mybookings`, `/bookingDetail/{id}`                                                                    | Live                                                                                 | Only the logged-in customer's bookings (scoped by `customer_id`). Missing auth middleware → error for guests                                                                                                                                                              |
| F15 | Membership plans & application                          | `/membership`, `/membershipForm`, `POST /membershipCreate` (auth)                                       | **Broken** (insert fails: NOT NULL `product_id`/`visit_limit`) — fixed in new schema | Lists membership types; application saved with `status = 1` (pending); name = first + last; declaration checkbox required (client)                                                                                                                                        |

## 2. Admin panel

All under `/admin`, permission-gated per action. CRUD = index (DataTables server-side or full list), create, edit, show, delete, mass-delete.

| #   | Module                                                           | Status                | Notes                                                                                                                    |
| --- | ---------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| A1  | Dashboard                                                        | Live                  | Role 1 only. Total bookings, total sales (sum `total_amount`), total users, latest 50 bookings                           |
| A2  | Users                                                            | Live                  | CRUD + role assignment; `storeCustomer` (AJAX quick-create from booking form)                                            |
| A3  | Roles / Permissions                                              | Live                  | CRUD; roles ↔ permissions                                                                                                |
| A4  | Services (lounge_services)                                       | Live                  | CRUD (show action renders wrong view — minor)                                                                            |
| A5  | Product categories                                               | Live                  | CRUD (+ media upload, unused)                                                                                            |
| A6  | Products                                                         | Live                  | CRUD; filtered lists "Lounge service products", "Membership products"                                                    |
| A7  | Bookings – list / show / delete                                  | Live                  | DataTable with customer, service, product, category, amount, created                                                     |
| A8  | Bookings – create / edit                                         | **Broken**            | References non-existent relations/pivot (see architecture D3)                                                            |
| A9  | Booking details (attendees)                                      | Partial               | CRUD; uses non-existent pivot for linking                                                                                |
| A10 | Memberships                                                      | Live                  | CRUD; **Approve** action: assigns next 8-digit `serial_no` (max + 1), product (category 3), `visit_limit`, sets status 2 |
| A11 | Membership types                                                 | Live                  | CRUD                                                                                                                     |
| A12 | Cards (bank cards)                                               | Live (model mismatch) | CRUD; model fields don't match table columns                                                                             |
| A13 | Nationalities, Statuses, Source requests                         | Live                  | Simple lookup CRUD                                                                                                       |
| A14 | Booking types, Movements, Vouchers, Majestic cards, Product tags | Unused                | CRUD screens exist, tables empty or unused by bookings                                                                   |
| A15 | FAQ categories / questions                                       | Live                  | CRUD                                                                                                                     |
| A16 | Audit logs                                                       | Live                  | Read-only list/show; populated by `Auditable` trait on most models                                                       |
| A17 | Global search                                                    | Live                  | Admin search box                                                                                                         |
| A18 | Profile / change password                                        | Live                  | `/profile/password`                                                                                                      |

## 3. Mobile API (`/api/v1`)

| #   | Endpoint                                                                 | Status                  | Notes                                                    |
| --- | ------------------------------------------------------------------------ | ----------------------- | -------------------------------------------------------- |
| M1  | `POST auth/login`                                                        | Live                    | Returns `{user, token}`                                  |
| M2  | `POST auth/register`                                                     | Live                    | Validated; role 2; staff email                           |
| M3  | `POST auth/logout`                                                       | Live                    | Revokes **all** tokens of user                           |
| M4  | `POST auth/requestOtp`                                                   | Live                    | 4-digit OTP, 5-min expiry, emailed                       |
| M5  | `POST auth/verifyOtp`                                                    | Live                    | Clears OTP on success; issues nothing                    |
| M6  | `POST auth/resetPassword`                                                | **Critically insecure** | No OTP proof required                                    |
| M7  | `GET lounge_service/list`                                                | Live                    | All services incl. app icon/route                        |
| M8  | `GET products/list?service_id&category_id`                               | Live                    |                                                          |
| M9  | `GET booking/store`                                                      | Live, insecure          | GET + mass-assign; `source_request_id = 2`; no attendees |
| M10 | `GET booking/getBookingsByCustomer?customer_id`                          | Live, IDOR              |                                                          |
| M11 | `POST booking/whatsappBookingStore`                                      | Partial                 | Target table missing in prod                             |
| M12 | Generated `apiResource` CRUD (bookings, statuses, cards, memberships, …) | Unknown use             | Probably scaffold; authorization unclear                 |

Response envelope for M1–M11: `{"status": "0000", "message": "Success", "data": …}`; codes in `App\Enums\Responses`. HTTP status is always 200.

## 4. Email notifications

| Mailable                                    | Trigger                  | Recipients             | Template                     |
| ------------------------------------------- | ------------------------ | ---------------------- | ---------------------------- |
| `orderMail`                                 | Booking submitted (web)  | staff list + customer  | `emails/order`               |
| `InquiryMail`                               | Contact form             | staff list + submitter | `emails/inquiry`             |
| `welcomeMail`                               | Registration (web + API) | staff list             | `emails/register`            |
| `OtpMail`                                   | API OTP request          | user                   | `emails/Otp`                 |
| `orderNotification`, `RegisterNotification` | —                        | —                      | Unused (calls commented out) |

Staff list comes from `config/emails.php` (currently a single address; others commented out).

## 5. Features that do **not** exist (checked)

- Online payment / payment gateway / refunds
- Booking status workflow, booking cancellation, booking modification by customer
- Availability, capacity, slots, scheduling, blackout dates
- Reports beyond the 3 dashboard numbers + latest list (DataTables offers CSV/Excel/PDF/print export buttons client-side)
- Scheduled jobs
- File uploads in active use
- Email verification enforcement
- Multi-language (English only)

These will not be built unless you ask for them.
