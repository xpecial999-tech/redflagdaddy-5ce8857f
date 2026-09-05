# Codex Cloud staging handover

Updated: 5 September 2026

This document records the staging work and findings from the Codex Cloud
session so it can be continued safely from a local project. It intentionally
contains no API keys, passwords, generated magic links, private forwarding
addresses, or other secrets.

## Scope and safety boundary

- Repository workspace: `redflagdaddy-5ce8857f`
- Cloud workspace branch: `work`
- Revision inspected: `c6e1872361fd50bc60c5e249bdadef6d353aff8c`
- Staging URL: <https://staging.redflagdaddy.com>
- Staging Supabase project: `redflagdaddy-staging`
  (`lshnoprhmnmnhbhblcaw`)
- Production Supabase project: `redflagdaddy` (`bevniqflxhsqstfnviwz`)
- Cloudflare staging Worker: `redflagdaddy-staging`

No production configuration, production data, production deployment, DNS, or
production provider was changed during this session.

The Cloud workspace had working Supabase and Cloudflare account tokens. Local
Git repository access worked, but this checkout had no Git remote configured.

## Staging administrator status

The requested staging administrator email is `xpecial999@gmail.com`.

Completed in the staging Supabase project only:

1. A staging Auth user was created for the exact email address through the
   Supabase admin API. No password was created and no password-reset flow was
   used.
2. The documented idempotent promotion SQL was applied:

   ```sql
   insert into public.admin_users (user_id)
   select id
   from auth.users
   where email = 'xpecial999@gmail.com'
   on conflict (user_id) do nothing;
   ```

3. A verification query confirmed exactly one `public.admin_users` row joined
   to the staging `auth.users` record for that email.

Not completed:

- No passwordless access email was successfully delivered.
- The owner has therefore not consumed a magic link in this workflow.
- Authenticated access to <https://staging.redflagdaddy.com/admin> has not been
  verified and must not be reported as passing yet.

## Important staging SMTP incident

The initial standard Supabase invitation was attempted twice. Both requests
failed with HTTP 500 and `Error sending invite email`. The failed invitation
requests did not create an Auth user.

Before remediation, the Auth configuration readback showed:

- Site URL: `https://staging.redflagdaddy.com`
- Allowed redirect URL:
  `https://staging.redflagdaddy.com/auth/callback`
- Custom SMTP host: `smtp.resend.com`
- Custom SMTP port: `465`
- Sender: `Red Flag Daddy <support@redflagdaddy.com>`
- SMTP username and password fields were populated
- Email authentication was enabled

A Supabase-generated passwordless link was subsequently created through the
admin API, creating the staging Auth user. Attempts to deliver it outside the
standard mailer did not succeed:

- Codex Cloud could not connect to outbound SMTP ports (`Network is
unreachable`).
- The Supabase management API returned a masked/non-reusable SMTP password, so
  it could not authenticate to the Resend HTTPS API.
- Generated links were never printed, committed, or retained.

With owner approval, a staging-only request attempted to change the SMTP port
from `465` to `587`. Supabase's management API unexpectedly treated the partial
Auth configuration PATCH as replacement semantics and cleared all omitted SMTP
fields. A numeric-port correction was rejected because the API requires the
port value to be a string. Work stopped immediately rather than attempting to
reconstruct or replace credentials.

### Current SMTP state and required owner action

The staging project's custom SMTP fields were observed as `null` after that
PATCH. New staging Auth emails cannot be expected to work until the owner
restores the complete custom SMTP configuration.

Restore it in **Supabase staging -> Authentication -> Email/SMTP settings**
using the credential held in the owner's password manager or Resend account.
Do not paste the credential into chat or commit it.

Known non-secret values:

- Host: `smtp.resend.com`
- Port: `587`
- Sender name: `Red Flag Daddy`
- Sender address: `support@redflagdaddy.com`
- Username and password: restore from the owner's secure credential source

Keep the Site URL and allowed redirect URL listed above. After restoration,
send a fresh standard Supabase passwordless magic link for
`xpecial999@gmail.com`. Do not create a password or use password recovery.

## Migration verification

The three partially confirmed migration areas named in
`docs/remote-session-handover.md` were checked directly against the staging
database. No migration was blindly rerun.

### `20260821114715_561f6f26-584f-45cc-ba61-756a0a5961cc.sql`

Verified:

- `public.sms_log` exists with all nine expected columns.
- `sms_log_created_at_idx` exists.
- `sms_log_provider_message_id_idx` exists.
- Row-level security is enabled.
- The `Admins can read sms log` SELECT policy exists.

### `20260821190000_go_live_safety.sql`

Verified:

- Anonymous SELECT access to `public.results` is revoked.
- The unsafe `Public can read shared results` policy is absent.
- No existing `sms_log.content_preview` value is non-null.
- `public.rate_limit_events` exists.
- `rate_limit_events_lookup_idx` and `rate_limit_events_created_at_idx` exist.
- Row-level security is enabled on `rate_limit_events`.
- `public.consume_rate_limit(text, text, integer, integer)` exists.
- `service_role` can execute the function and `anon` cannot.

### `20260821200000_privacy_safe_marketing_events.sql`

Verified:

- `public.marketing_events` exists.
- `marketing_events_occurred_at_idx` and `marketing_events_funnel_idx` exist.
- Row-level security is enabled.
- `service_role` has the expected SELECT, INSERT, and DELETE privileges.
- `anon` has no table DML privileges.
- `public.trim_marketing_events()` exists.
- `trim_marketing_events_after_insert` exists and is active.
- `anon` cannot execute the cleanup function.

All migration checks passed after correcting a verifier typo that initially
counted eight rather than the migration's nine `sms_log` columns.

## Automated checks

Dependencies were installed with the repository's `bun.lock` and Bun 1.2.14.

- `bun install --frozen-lockfile`: passed.
- `bun run typecheck`: passed.
- `bun run test`: passed, 149 tests across 32 files.
- `bun run build`: passed.
- `bun run lint`: failed on the existing repository-wide formatting backlog,
  reporting 2,120 Prettier errors and 9 warnings. No broad auto-format was run.

The successful build retained known non-blocking warnings about large chunks,
third-party module-level directives, and Cloudflare Wrangler config overrides.

## Deployed staging HTTP checks

Non-mutating route checks were made against the deployed staging origin.

- `/`, `/login`, `/register`, `/admin`, `/support`, `/auth/callback`,
  `/robots.txt`, and `/sitemap.xml` responded.
- Public application responses included anti-framing, no-referrer,
  MIME-sniffing, and permissions-policy headers.
- `/login`, `/register`, `/admin`, and `/auth/callback` included private/no-store
  and no-index headers where checked.
- An unauthenticated `/admin` HTTP response alone does not prove authorized
  admin workspace access; browser verification after magic-link login remains
  required.
- A direct POST to the retired
  `/lovable/email/transactional/send` endpoint returned HTTP 404 with
  `{"error":"Not found"}`. An earlier header-only display appeared to show 200
  because it printed the proxy CONNECT response; checking the final upstream
  response confirmed 404.
- Cloudflare staging deployment history was readable with Wrangler. No deploy
  was performed.

## Remaining staged smoke tests

The full real-user staging smoke test is not complete. Continue in this order:

1. Restore staging custom SMTP securely.
2. Send a fresh Supabase passwordless magic link to
   `xpecial999@gmail.com` with redirect
   `https://staging.redflagdaddy.com/auth/callback`.
3. Have the owner consume the email link and open `/admin`.
4. Confirm administrator overview cards and Questions, Categories, Journeys,
   Analytics, and Settings navigation on desktop and mobile.
5. Confirm a non-admin cannot see administrator controls or read admin data.
6. Complete the remaining real staging cases in `docs/weekend-dry-run.md`:
   registration and login magic links, support form, anonymous journey,
   authenticated journey, invitation links, private reports, exports, deletion,
   mobile/accessibility review, and security boundaries.
7. Configure and test a distinct staging Turnstile key before treating the
   support form as launch-ready.

SMS/Clickatell, analytics, AI analysis, and payments should remain disabled
unless and until their separate approval and verification gates are satisfied.

## Production release status

**No-go. Do not propose or perform a production release yet.** Remaining hard
blockers include:

- Restore and verify staging passwordless email delivery.
- Complete authenticated administrator access verification.
- Complete the real staging smoke-test matrix.
- Complete staging Turnstile configuration and support delivery tests.
- Record mobile and desktop review results.
- Resolve or explicitly accept the repository-wide lint/formatting condition.
- Record the exact deployed commit, migration set, tester/date, accepted
  limitations, and formal go/no-go decision.

Any future Cloudflare deployment, DNS change, provider activation, staging
configuration change, or production change must be announced to the owner
before execution.

## 2026-09-05 continuation: production construction wall

The owner approved a production deployment that keeps the live site unavailable
while the staging review continues. The deployment adds a Worker-level
construction switch, rather than relying on the application's route-level
setting. This means all production paths (including API and authentication
paths) return the same static construction response before application code is
run. The response is HTTP 503, is not cached, and is marked no-index.

- Production Worker: `redflagdaddy-production`, `CONSTRUCTION_MODE=enabled`.
- Staging Worker: `redflagdaddy-staging`, `CONSTRUCTION_MODE=disabled`.
- Production verification: `/login` returned the construction page and HTTP 503.
- Staging verification: `/register` returned the real registration page and
  HTTP 200.

The earlier staging failure was a framework integration issue: Nitro invokes
the app entry without its Worker `env` argument. The Worker already contained
the required Supabase configuration; the entry now reads Nitro's runtime
binding context. No Supabase secret was changed for this correction.
