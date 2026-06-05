## 1. Email OTP registration (replace email-link verification)

**Auth config**
- Keep email confirmation ON (so OTP is required), but rely on `verifyOtp` to mint the session — no link click needed.

**Register flow (`src/routes/register.tsx`)**
- Step 1 (existing form): collect name, email, password, role, 18+ check.
  - On submit: call `supabase.auth.signUp({ email, password, options: { data: { name, role } } })`.
  - Supabase sends the confirmation email containing a 6-digit OTP token.
- Step 2 (new in same page): show a 6-input OTP field (use existing `input-otp` UI).
  - On submit: `supabase.auth.verifyOtp({ email, token, type: 'email' })` → session → navigate to `/dashboard`.
  - "Resend code" button → `supabase.auth.resend({ type: 'signup', email })`.

**Login flow** — unchanged (password).

**Email template** — default Supabase template already includes the 6-digit token (`{{ .Token }}`). No custom auth email scaffolding needed unless you want it branded later.

## 2. Phone (SMS/WhatsApp) — deferred

Documented only. To add later: Supabase Auth → enable Phone provider → connect Twilio (SMS) or Twilio WhatsApp Business sender → swap `signUp` for `signInWithOtp({ phone })`. No code now.

## 3. Guest mode

**Landing page** — add a third CTA "Continue as guest".

**New route `/guest`** (public):
- Form: journey title, participant type, guest's own email (where report goes), partner's email (optional).
- Submits to a new public server route `POST /api/public/guest-journey` that:
  1. Validates input (Zod).
  2. Creates a `journeys` row with `creator_id = NULL` (requires DB change — make `creator_id` nullable, add `guest_email` + `is_guest` columns).
  3. Creates an `invites` row for the partner if email provided.
  4. Returns `{ guestToken, partnerInviteCode, guestAssessmentUrl }`.
- Guest sees: their own assessment link + partner invite link (copyable).

**Guest assessment**
- New public route `/guest/assessment/$token` that loads the journey by guest token and lets the guest answer without auth.
- Responses written via a new public server fn using the admin client (RLS bypass is safe because the token gates access).
- On submit, queue an email to `guest_email` with the report (uses scaffolded transactional email infra — needs domain).

**DB migration**
- `journeys`: `creator_id` → nullable; add `guest_email text`, `guest_token text unique`, `is_guest boolean default false`.
- Update RLS: existing creator policy still works (since `creator_id = auth.uid()` filters out guest rows from authed users); add admin read; no public RLS — guest access goes through server fns with admin client + token validation.

**Report email**
- Requires email domain + `setup_email_infra` + `scaffold_transactional_email`. I'll surface the email-setup dialog if no domain exists, then wire the send.

## Open questions before I start
- The report email needs Lovable Cloud email infra; if no domain is configured yet I'll prompt the setup dialog mid-flow. OK?
- Should the guest-created journey also produce a partner invite, or is the guest the only respondent in guest mode? (Your answer said guest takes the assessment themselves — I'll make the partner invite **optional** in the guest form.)

If this looks right I'll implement in this order: DB migration → OTP register flow → guest server fns + routes → landing CTA → email wiring.
