## 1. Database

New migration adds:

- `app_settings` (singleton, one row): `paid_mode_enabled boolean` (default `false`), `price_cents int` (default `100`), `currency text` (default `'USD'`). Service role read/write only; `authenticated` may `SELECT` so we can show banners.
- `users.is_paid boolean default false` and `users.paid_at timestamptz`.
- `journeys.category_ids uuid[]` (nullable — null = default mixed 100-question set).
- `journeys.question_limit int` (nullable — null = use entitlement default).
- `payments` table: `id`, `user_id`, `provider text` (`'peach'`), `provider_ref text`, `amount_cents`, `currency`, `status` (`pending|paid|failed`), `created_at`, `updated_at`. Service-role write; user can read own rows.

## 2. Question selection

`getAssessment` builds a deterministic question list using the journey id as a seed:

- Fetch active questions matching `applies_to`.
- If `journey.category_ids` set → restrict to those categories (deep-dive uses every question in the chosen categories).
- Else → trim to `effectiveLimit` proportional per category, sorted by `(weight desc, risk_level rank desc, id asc)` to be stable.
- `effectiveLimit` = `journey.question_limit ?? (paidMode && creator not paid ? 20 : 100)`.

Guest journeys (no creator) keep the 100 default; admin toggle only constrains signed-in free users.

## 3. Create flow

`src/routes/_authenticated/create.tsx` gains a new step between "role" and "respondent":

- "Full assessment (≈100 questions)" or "Category deep-dive" (multi-select categories with question counts).
- Free + paid-mode-on users see "20 question limit" notice and a disabled deep-dive (with upgrade link), and are blocked at 2 active journeys (server-enforced).

`createJourney` now accepts `categoryIds?: string[]` and enforces:
- 2-journey cap when free + paid mode on (counts non-deleted journeys per `creator_id`).
- Per-tier question limit is stamped onto the row at create time.

## 4. Entitlement + gating

New `getEntitlement` server fn returns `{ paidModeEnabled, isPaid, freeQuestionCap: 20, freeJourneyCap: 2 }`. UI uses it to:

- Hide "Download PDF" + "Enable share link" buttons on results.tsx for free users (replace with an Upgrade CTA → `/upgrade`).
- Show remaining-journey counter on dashboard / create.
- Surface "Upgrade" link in app shell when paid mode is on and user is not paid.

## 5. Peach Payments (sandbox)

- Add `/upgrade` route: shows $1 unlock CTA, calls `startPeachCheckout` which uses Peach's Copy-and-Pay flow:
  - `POST https://eu-test.oppwa.com/v1/checkouts` with `entityId`, `amount=1.00`, `currency=USD`, `paymentType=DB`, auth header `Bearer ${PEACH_ACCESS_TOKEN}`. Returns `checkoutId`.
  - Page loads Peach's `paymentWidgets.js?checkoutId=...` and submits to `/upgrade/return?id=...`.
- `/upgrade/return` server route polls Peach `GET /v1/checkouts/{id}/payment`, on success inserts `payments` row + sets `users.is_paid=true, paid_at=now()`, then redirects to `/dashboard?upgraded=1`.
- `/api/public/peach/webhook` accepts Peach server-to-server notifications (best-effort second confirmation). Verifies via a shared `PEACH_WEBHOOK_SECRET` header.
- Required secrets: `PEACH_ENTITY_ID`, `PEACH_ACCESS_TOKEN`, `PEACH_WEBHOOK_SECRET`, `PEACH_BASE_URL` (defaults to `https://eu-test.oppwa.com`).

## 6. Admin

`admin.tsx` gets a new "Settings" tab:
- Big switch: **Paid mode** (off = current behaviour, on = enforce 20-question + 2-journey + no-PDF limits for non-paid users).
- Read-only price ($1) + currency display.
- Server fns `getAppSettings` / `setAppSettings` (admin-guarded via existing `assertAdmin`).

## Technical notes

- Deterministic 100-question selection: implemented in `getAssessment` (pure TS) using mulberry32 seeded from `journey.id`. No DB sample call needed.
- Free + admin toggle is the only place a hard 20-cap is applied; existing journeys created before the toggle keep their stored `question_limit` (null = recompute at fetch).
- `category_ids` lives on `journeys`, not invites, so both creator and respondent see the same set.
- All Peach calls are server-only (`createServerFn` / `/api/public/...`). The widget is loaded client-side from Peach's CDN.
- I'll request the three Peach secrets via `add_secret` once you confirm — they need to be entered before checkout will work, but the rest (admin toggle, 20Q/2-journey caps, PDF gating, category deep-dives) works without them.
