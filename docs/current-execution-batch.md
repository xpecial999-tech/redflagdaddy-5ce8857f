# RedFlagDaddy current execution batch

Updated: 7 September 2026

This is the active short batch for continuing the project from the local Codex
chat. It supersedes older phone-first, Clickatell and magic-link wording in the
handover docs where those notes describe the old launch path.

## Current truth

- Primary project: RedFlagDaddy only.
- Branch: `codex/email-first-staging`.
- Staging URL: <https://staging.redflagdaddy.com>.
- Production URL: <https://redflagdaddy.com>.
- Staging must stay open for owner testing.
- Production must stay fully locked behind the Worker-level construction wall.
- Authentication is email-only for the current path. Supabase sends a six-digit
  email OTP through Resend SMTP.
- Guest-first is the preferred journey: visitors start privately, share the
  partner link, then can optionally sign in and claim the journey.
- Clickatell and SMS are removed from the current staging and initial-launch
  path. Keep historical SMS tables and code only as inactive legacy support until
  a future approved WhatsApp/SMS provider is selected.
- Payments, external AI analysis and production analytics remain disabled.

## Completed since the older handovers

- Production construction was revised to run at the Cloudflare Worker level, so
  all production paths are blocked before app code runs.
- Staging was fixed to receive the correct Supabase runtime configuration and
  remain open.
- Resend/Supabase SMTP was restored for staging.
- The staging admin account `xpecial999@gmail.com` was promoted and owner login
  via email OTP was verified.
- The visible app moved away from mobile-number and SMS flows.
- Email sign-in now uses a six-digit code and submits automatically after the
  sixth digit.
- Guest journey claiming was implemented so a user can save and track after
  sharing.
- Questions and categories were imported from the Lovable database export and
  the owner confirmed they look correct in staging admin on 7 September 2026.
- A 1200 x 630 social-preview image was generated and saved at
  `public/social-preview-20260907.png`.
- The owner approved `public/social-preview-20260907.png` on 7 September 2026.
- A consolidated legal review pack was created at
  `docs/consolidated-legal-review-pack.md`.
- Staging Turnstile public configuration was added to the local build and
  Worker configuration on 7 September 2026. The encrypted
  `TURNSTILE_SECRET_KEY` must remain set in Cloudflare and must never be
  committed.

## Batch 1: documentation cleanup

Status: done locally on 7 September 2026.

- Update the main README to describe the current app, stack and environments.
- Update short operational docs to say email OTP rather than magic link where it
  describes the active staging path.
- Mark Clickatell/SMS as out of scope for the current release path.
- Keep WhatsApp as a future approved-provider decision, not a current blocker.
- Keep older detailed backlog files as historical context unless they actively
  mislead current execution.

## Batch 2: staging data verification

Status: partially done.

- Verify `/admin` loads for the staging admin account.
- Confirm Questions and Categories show imported content in the admin UI.
  Owner confirmed on 7 September 2026.
- Confirm at least one public guest journey uses those questions correctly.
- If content is missing, re-import only questions and categories from the
  sanitized Lovable SQL export, then verify counts and visible admin pages.

## Batch 3: guest-first staging smoke test

Status: next.

- Landing page primary action opens the private guest start.
- Guest can select their role and create a journey without email.
- Partner link opens and starts the assessment.
- Assessment completion rejects duplicate or incomplete submissions.
- Owner can view results.
- Owner can choose to save/track the journey.
- Email OTP signs the owner in without requiring a magic-link browser round trip.
- Claimed journey appears in the dashboard.

## Batch 4: support and safety activation

Status: in progress.

- Verify Cloudflare Turnstile is configured for staging.
  The staging site key and expected hostname are now in the local build and
  Worker configuration. Confirm the encrypted Cloudflare secret still exists in
  the staging Worker after deployment.
- A normal synthetic support request submitted successfully on staging on
  7 September 2026 with reference `RFD-20260907-9F995B`.
- Submit privacy/safety and immediate-danger synthetic support requests.
- Confirm messages arrive at `support@redflagdaddy.com` and forward correctly.
  Owner reported no mailbox receipt before the successful Turnstile test; mailbox
  delivery for `RFD-20260907-9F995B` still needs owner confirmation.
- On 7 September 2026, `RFD-20260907-9F995B` was confirmed in
  `email_send_log` as `pending` and present in `pgmq.q_transactional_emails`.
  Staging had no `process-email-queue` cron job. The queue processor was updated
  to use `RESEND_API_KEY` through Resend's HTTPS API instead of the old Lovable
  sender. The processor now supports a separate `QUEUE_PROCESSOR_SECRET` for
  Supabase cron/manual calls, rather than requiring the service-role key as the
  scheduler bearer token.
- A matching `QUEUE_PROCESSOR_SECRET` was generated and stored in
  `redflagdaddy-staging` plus Supabase Vault as `email_queue_processor_token`.
  A manual Vault-authenticated queue trigger reached the Worker and Resend on
  7 September 2026.
- Resend rejected the current staging `RESEND_API_KEY` with HTTP 401
  `API key is invalid`. Replace the encrypted Worker secret with a valid staging
  Resend API key before enabling cron or retrying delivery.
- Confirm no private destination, OTP, private link, access code, raw answer or
  secret appears in page source, logs, queued messages or screenshots.
- Record support role ownership and response targets without country-specific
  wording.

## Batch 5: production readiness

Status: blocked until staging passes.

- Complete the staging smoke-test record.
- Review desktop and mobile wording across public, auth, guest, dashboard,
  report, support and admin routes.
- Confirm there are no visible mobile-number prompts in the active flow.
- Verify production remains locked after every staging deploy.
- Obtain legal/privacy/safety text review before public promotion.
- Use `public/social-preview-20260907.png` as the approved 1200 x 630
  social-preview image.
- Record exact commit, migration set, tester/date, accepted limitations and a
  go/no-go decision.

## Owner inputs needed

- Confirm the encrypted `TURNSTILE_SECRET_KEY` is still present in the
  `redflagdaddy-staging` Worker variables/secrets screen.
- Confirm support form test `RFD-20260907-9F995B` arrives at the private inbox
  through `support@redflagdaddy.com`.
- Add encrypted Worker secret `RESEND_API_KEY` to `redflagdaddy-staging`, using a
  restricted Resend API key for staging transactional email. Owner reported this
  was added on 7 September 2026.
- Generate and store a shared `QUEUE_PROCESSOR_SECRET` in both
  `redflagdaddy-staging` and Supabase Vault for the staging scheduler. Completed
  on 7 September 2026.
- Replace the staging Worker `RESEND_API_KEY`; the current value was rejected by
  Resend as invalid during a manual queue run.
- Activate the staging email queue scheduler or manually trigger
  `/lovable/email/queue/process` with the configured queue-processor bearer
  token.
- Send `docs/consolidated-legal-review-pack.md` for legal/privacy feedback.

## Suggested next Codex prompt

```text
Review docs/current-execution-batch.md. Start with Batch 2. Verify staging admin
Questions and Categories, then run the guest-first staging smoke test. Keep
production locked and do not change production.
```
