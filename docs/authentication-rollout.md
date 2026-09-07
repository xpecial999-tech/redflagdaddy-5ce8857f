# Authentication rollout

Updated: 7 September 2026

Email OTP is the active staging authentication path. Google and Apple remain
implemented but disabled by default. SMS/Clickatell is not part of the current
staging or initial-launch path.

## Feature flags

Each method appears only when its exact value is `enabled`:

- `VITE_AUTH_ACCOUNT_LINKING_MODE=enabled`
- `VITE_AUTH_EMAIL_MODE=enabled`
- `VITE_AUTH_GOOGLE_MODE=enabled`
- `VITE_AUTH_APPLE_MODE=enabled`

Recommended rollout order:

1. Configure staging SMTP and the approved redirect URLs in Supabase.
2. Test six-digit email OTP signup, sign-in, sign-out and admin access.
3. Test the guest-to-account claim flow after a journey is shared.
4. Configure Google only after the email OTP path is stable.
5. Configure Apple only when membership and operational rotation are ready.
6. Revisit WhatsApp/SMS only as a separate approved provider pilot.

## Required Supabase settings

- Site URL: the approved canonical RedFlagDaddy URL.
- Allowed redirect URL: `/auth/callback` on staging and production.
- Manual identity linking enabled before exposing the linking controls.
- Production SMTP with an approved sender domain before email is enabled.
- Google and Apple OAuth applications with only basic authentication/profile
  scopes.

## Dry-run checks

- Existing user links each approved method from Profile and keeps the same
  Supabase user ID, journeys, admin membership and entitlements.
- The linked method signs back into that same account after sign-out.
- A provider identity already attached to another account fails without leaking
  account details.
- Invalid and expired callbacks show a generic error and never redirect to an
  arbitrary URL.
- Administrator `/admin` login uses the same enabled email OTP method and still
  verifies admin membership server-side.
- Construction mode hides ordinary login and registration while preserving the
  administrator entry.
- No provider is enabled in production until its individual dry run passes.

Telegram remains a demand-led custom identity project. Unofficial Signal
automation is excluded. WhatsApp OTP is a separate official-provider decision
and is not part of this batch.
