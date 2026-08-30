# Authentication alternatives rollout

The email, Google and Apple interfaces are implemented but disabled by default.
SMS remains the supported sign-in and recovery method until the new providers
are configured and the account-linking dry run passes.

## Feature flags

Each method appears only when its exact value is `enabled`:

- `VITE_AUTH_ACCOUNT_LINKING_MODE=enabled`
- `VITE_AUTH_EMAIL_MODE=enabled`
- `VITE_AUTH_GOOGLE_MODE=enabled`
- `VITE_AUTH_APPLE_MODE=enabled`

Recommended rollout order:

1. Configure production SMTP and the approved redirect URLs in Supabase.
2. Enable account linking only and test from an existing phone account.
3. Configure Google, test linking, sign-out and sign-in, then enable Google.
4. Configure Apple, test linking, sign-out and sign-in, then enable Apple.
5. Test email linking and passwordless email sign-in, then enable email.
6. Keep SMS enabled throughout the first release and recovery observation
   period.

## Required Supabase settings

- Site URL: the approved canonical RedFlagDaddy URL.
- Allowed redirect URL: `/auth/callback` on staging and production.
- Manual identity linking enabled before exposing the linking controls.
- Production SMTP with an approved sender domain before email is enabled.
- Google and Apple OAuth applications with only basic authentication/profile
  scopes.

## Dry-run checks

- Existing phone user links each approved method from Profile and keeps the same
  Supabase user ID, journeys, admin membership and entitlements.
- The linked method signs back into that same account after sign-out.
- A provider identity already attached to another account fails without leaking
  account details.
- Invalid and expired callbacks show a generic error and never redirect to an
  arbitrary URL.
- Administrator `/admin` login remains SMS-only.
- Construction mode hides ordinary login and registration while preserving the
  administrator entry.
- No provider is enabled in production until its individual dry run passes.

Telegram remains a demand-led custom identity project. Unofficial Signal
automation is excluded. WhatsApp OTP is a separate Twilio/Verify decision and
is not part of this batch.
