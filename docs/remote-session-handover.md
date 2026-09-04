# RedFlagDaddy remote-session handover

Updated: 5 September 2026

This is the continuation record for moving the RedFlagDaddy work into a remote
Codex session. It captures the decisions and external configuration made during
the local staging setup. It deliberately excludes API keys, passwords, access
tokens, private inboxes and other secret values. Those must remain in the
relevant provider's secret store or the owner's password manager.

## Current state

- Working branch: `codex/email-first-staging`
- Latest committed application revision before this handover: `84c0571`
  (`Configure email-first staging release`)
- Staging URL: <https://staging.redflagdaddy.com>
- Production URL remains: <https://redflagdaddy.com>
- Staging has been deployed to a dedicated Cloudflare Worker and was opened
  successfully in a browser.
- Staging uses email magic links. SMS/Clickatell is intentionally disabled for
  this release while a future WhatsApp-capable provider is evaluated.
- Production has not been changed as part of this staging work.

## External services and non-secret identifiers

| Area | Staging state | Notes |
| --- | --- | --- |
| Cloudflare Worker | `redflagdaddy-staging` | Custom domain `staging.redflagdaddy.com` is attached. |
| Cloudflare DNS | `redflagdaddy.com` zone | Resend DNS records are present; obsolete Lovable notify records were removed at the owner's request. |
| Supabase staging | `redflagdaddy-staging` | Project ref: `lshnoprhmnmnhbhblcaw`; URL: `https://lshnoprhmnmnhbhblcaw.supabase.co`. |
| Supabase production | Existing project | Project ref: `bevniqflxhsqstfnviwz`; do not use it for staging testing. |
| Resend | Verified sending domain | Supabase staging SMTP is configured to send as `support@redflagdaddy.com`. |
| Support inbox | Working | `support@redflagdaddy.com` forwarding was confirmed by the owner. |

### Staging Cloudflare runtime configuration

The following are configured in the staging Worker. Their values must never be
committed or pasted into chat:

- `SUPABASE_SERVICE_ROLE_KEY` (encrypted)
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `PUBLIC_SITE_URL` (`https://staging.redflagdaddy.com`)
- `OTP_SECRET` (encrypted)

The build also needs the non-secret/public Supabase configuration and the
email-first flags described in `docs/runtime-configuration-checklist.md`. Keep
`VITE_AUTH_EMAIL_MODE=enabled`; leave `VITE_AUTH_PHONE_MODE` disabled/absent
until a replacement SMS/WhatsApp provider has been approved and tested.

### Staging Supabase Auth configuration

- Site URL: `https://staging.redflagdaddy.com`
- Allowed redirect URL: `https://staging.redflagdaddy.com/auth/callback`
- Custom SMTP: Resend, sender name **Red Flag Daddy**, sender address
  `support@redflagdaddy.com`
- Authentication mode: passwordless email magic links (not passwords)

Because sign-in is passwordless, do not create a password-reset workflow for
staging. The correct recovery/access action is sending an invitation or magic
link email.

## Database status

The repository migrations are in `supabase/migrations/`. They were applied to
staging in timestamp order through the latest release migrations. The
management interface reported pre-existing objects while retrying two
multi-statement migrations, so the remote session should perform a brief schema
verification before treating the deployment as production-ready:

- `20260821114715_561f6f26-584f-45cc-ba61-756a0a5961cc.sql` (`sms_log` and
  related objects reported as already existing)
- `20260821190000_go_live_safety.sql` (`rate_limit_events` reported as already
  existing on a retry)
- `20260821200000_privacy_safe_marketing_events.sql` (retry result was not a
  full migration confirmation)

Later migrations `20260825090000_construction_mode.sql`,
`20260826120000_anonymous_owner_codes.sql` and
`20260829000000_expand_marketing_sources.sql` were applied successfully.

Verify the expected tables, policies, functions, indexes and columns from the
three noted migrations in the Supabase SQL editor before production promotion.
Do not blindly re-run an entire migration where part of it may already exist.

## In-progress admin request

The owner requested that `xpecial999@gmail.com` become a staging administrator
and receive account access. This was **not completed** because work was paused
to create this handover.

Finish it only in the staging project:

1. In Supabase Authentication → Users, invite/create `xpecial999@gmail.com`.
   This sends the passwordless access email through Resend.
2. In the Supabase SQL editor, promote that exact existing user idempotently:

   ```sql
   insert into public.admin_users (user_id)
   select id
   from auth.users
   where email = 'xpecial999@gmail.com'
   on conflict (user_id) do nothing;
   ```

3. Verify one `public.admin_users` row exists for that email's `auth.users.id`.
4. Have the owner use the emailed link, then open
   <https://staging.redflagdaddy.com/admin>.

Do not insert an invented UUID or create a plaintext password. The application
uses the row in `public.admin_users` as the administrator authorization check.

## Next release steps

1. Complete the in-progress staging admin invitation/promotion above.
2. Run a real staging smoke test: registration magic link, login magic link,
   admin access, support form, anonymous journey, authenticated journey and
   invitation links.
3. Verify the three partially-confirmed migration areas listed above.
4. Configure and test a separate Cloudflare Turnstile staging key before
   treating the support form as launch-ready.
5. Review the deployed staging experience on mobile and desktop, including
   redirect links and no accidental production references.
6. Keep analytics, AI analysis and payments disabled until their individual
   approval and verification gates are complete.
7. Promote to production only after the checklist in
   `docs/go-live-checklist.md` and the staged verification record are complete.

## Repository guidance for the remote session

- Use the existing GitHub remote: `origin` points to the RedFlagDaddy repository.
- Keep the current branch until staging verification is complete; do not merge
  it into production solely because staging is reachable.
- `wrangler.jsonc` contains the named `staging` and `production` environments.
- Build output and local provider files are excluded via `.gitignore`; do not
  add `.dev.vars`, `.wrangler/`, `supabase/.temp/`, API keys, tokens or provider
  export files to Git.
- The existing operational documents remain useful context, especially
  `docs/runtime-configuration-checklist.md`, `docs/weekend-dry-run.md`,
  `docs/go-live-checklist.md`, and `docs/auth-provider-setup-guide.md`.
