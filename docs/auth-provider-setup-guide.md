# RedFlagDaddy email, Google and Apple authentication setup

Updated: 28 August 2026

This guide explains where the required credentials originate. Supabase remains
the authentication system; these providers supply delivery or identity
credentials to Supabase. Never paste secrets into Git, tickets or chat.

## Transactional email / SMTP

Cloudflare Email Routing only forwards incoming mail such as
`support@redflagdaddy.com` to a private inbox. It does not send Supabase magic
links or authentication emails.

Recommended setup:

1. Create an owner-controlled Resend account.
2. Add a dedicated sending subdomain, for example `auth.redflagdaddy.com`.
3. Add the DNS records Resend provides in Cloudflare and wait for verification.
4. Configure SPF, DKIM and DMARC; keep authentication mail separate from future
   marketing mail.
5. In Resend, create a restricted SMTP/API credential for Supabase production
   and a different credential for staging.
6. In Supabase Dashboard, open Authentication → SMTP Settings and enter the
   Resend host, port, username, password, sender address and sender name.
7. Use a real monitored reply-to/support address; do not expose the private
   forwarding destination.
8. Test signup, magic link, expiry, resend, abuse throttling, delivery failure
   and spam placement on several mailbox providers.

Supabase's built-in sender is for testing and is rate-limited; it should not be
the production sender. Resend is the recommended starting point, but Postmark,
Amazon SES, SendGrid, Brevo or another reputable SMTP provider can be substituted
without adding Clerk.

## Google sign-in

The client ID and secret come from an owner-controlled Google Cloud project:

1. Create or select a Google Cloud project for RedFlagDaddy.
2. Configure the OAuth consent/branding screen and the minimum scopes: `openid`,
   `email` and `profile`.
3. Add the verified `redflagdaddy.com` domain and the approved privacy/terms
   links when Google requires them.
4. Create an OAuth client of type Web application.
5. Add the production and staging site origins and the exact Supabase callback
   URL shown in Supabase's Google provider settings. Do not add wildcard redirect
   destinations.
6. Enter the client ID and secret in Supabase Auth's Google provider settings;
   store the secret only in the provider/Supabase configuration.
7. Keep the application in test mode until the consent screen, 18+ gate, account
   ownership and callback tests pass. Google verification can take time, so do
   not make launch depend on an unapproved consent screen.

## Sign in with Apple

Apple credentials come from an owner-controlled Apple Developer Program
membership, not Supabase or Cloudflare:

1. Enroll the future RedFlagDaddy legal entity when available; until then,
   confirm with Apple and counsel what public seller/developer identity would be
   displayed.
2. Create the required App ID/Services ID for web authentication.
3. Register the RedFlagDaddy web domain and the exact Supabase return URL.
4. Create a Sign in with Apple key and record its key ID and Team ID privately.
5. Generate/configure the Apple client secret in Supabase and schedule rotation;
   Apple's web OAuth secret has a limited lifetime.
6. Test private-relay email, revoked authorization, repeat sign-in, 18+ consent
   gating and account deletion before exposing the Apple button.

Apple is deliberately after email and Google so the paid membership and secret
rotation do not hold up the first dry run.

## Activation order

1. Resend SMTP and email magic links in staging.
2. Google OAuth in staging.
3. Retain and regression-test SMS fallback.
4. Apple only when membership and operational rotation are ready.
5. Enable one method at a time through the existing feature flags; roll it back
   if account attachment, consent gating or generic error behavior fails.

## Official references

- [Supabase custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Supabase Google login](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase Apple login](https://supabase.com/docs/guides/auth/social-login/auth-apple)
