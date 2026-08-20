# Custom Clickatell phone OTP flow

Lovable Cloud’s Phone Auth settings only show built-in SMS providers (Twilio, Twilio Verify, TextLocal, Vonage, MessageBird). There is no visible “Custom webhook” option, so we cannot point Supabase Auth’s phone provider at the existing `/api/public/sms/clickatell` route. We will instead build our own OTP lifecycle and integrate with Supabase Auth via the service-role admin API.

## What will change

1. **New database table** — `public.phone_otps`
   - `phone` (E.164), `code_hash` (bcrypt/argon2 of the 6-digit code), `expires_at`, `attempts`, `used`, `created_at`, `updated_at`
   - Unique index on `(phone, code_hash)` or similar lookup pattern
   - RLS policies that deny all direct client access; server functions read/write through `supabaseAdmin`
   - Trigger or cron cleanup for expired rows

2. **New server functions** — `src/lib/phone-auth.functions.ts`
   - `requestPhoneOtp({ phone })`
     - Validate E.164 format
     - Rate-limit by phone number (e.g. max 3 requests per 10 minutes) and by IP
     - Generate a cryptographically random 6-digit code
     - Hash and store it with a short expiry (e.g. 5 minutes)
     - Send the plain code via Clickatell One API `POST /v1/message`
     - Return `{ sent: true }` or a typed error
   - `verifyPhoneOtp({ phone, code })`
     - Look up the latest unused code for the phone
     - Reject if missing, expired, already used, or attempts exceeded
     - Increment attempts; mark used on success
     - Find or create the auth user by phone via `supabaseAdmin.auth.admin`
     - Return a Supabase session to the client

3. **Session establishment**
   - Registration: create a phone-only user with a random server-generated password via `supabaseAdmin.auth.admin.createUser({ phone, phone_confirm: true, user_metadata: { name, role } })`, then immediately sign in with `supabase.auth.signInWithPassword({ phone, password })` inside the server function and return the `access_token`/`refresh_token` pair.
   - Login: locate the existing user by phone, set a new random password via `supabaseAdmin.auth.admin.updateUserById`, sign in with that password, and return the tokens.
   - Client-side: call `supabase.auth.setSession({ access_token, refresh_token })` after a successful verify, then navigate to `/dashboard` (or `/admin` if the user is an admin).
   - Note: the random password is never exposed to the user and is reset on every login; it exists only to bootstrap a Supabase session server-side.

4. **Update auth UI**
   - `src/routes/register.tsx`: replace `supabase.auth.signInWithOtp` with `requestPhoneOtp`, then call `verifyPhoneOtp` on the code step and set the returned session.
   - `src/routes/login.tsx`: same replacement for login.
   - Keep the existing mobile-number input, OTP input, and copy.

5. **Profile/admin compatibility**
   - Ensure `public.users` row creation/linking still works for phone-only accounts.
   - Keep the optional contact-email card for report notifications.
   - Add the admin user’s mobile number to their profile so they can continue signing in after the switch.

6. **Security hardening**
   - Brute-force protection: max 5 verification attempts per code, then invalidate.
   - Rate limiting on OTP requests.
   - Constant-time code comparison to avoid timing attacks.
   - Short expiry window.
   - Log provider errors server-side; return generic messages to users.

7. **Cleanup**
   - The existing `src/routes/api/public/sms.clickatell.ts` becomes unused because Supabase Auth will no longer trigger it. We can keep it as a fallback or remove it in a follow-up.

## Acceptance criteria

- [ ] New users can register with just a mobile number and receive a 6-digit SMS via Clickatell.
- [ ] Existing users can log in with their mobile number and SMS code.
- [ ] Invalid/expired codes show a clear error without leaking whether the phone exists.
- [ ] Rate limiting prevents SMS spam and brute-force code guessing.
- [ ] Admin account retains access after the switch.
- [ ] Build passes and the login/register flows work end-to-end.

## What I need from you

- Your mobile number in E.164 format (e.g. `+2782...`) so I can attach it to the existing admin account before the switch.
