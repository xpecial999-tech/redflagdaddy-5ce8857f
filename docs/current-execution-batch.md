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

Status: next.

- Verify Cloudflare Turnstile is configured for staging.
  Owner confirmed on 7 September 2026 that Turnstile is not configured yet.
- Submit normal, privacy/safety and immediate-danger synthetic support requests.
- Confirm messages arrive at `support@redflagdaddy.com` and forward correctly.
  Owner reported no mailbox receipt yet; Codex has not completed a verified
  support-form delivery test in this batch.
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
- Review and approve `public/social-preview-20260907.png` as the 1200 x 630
  social-preview image, or request a revision.
- Record exact commit, migration set, tester/date, accepted limitations and a
  go/no-go decision.

## Owner inputs needed

- Configure Turnstile for staging.
- Confirm support form test messages arrive at the private inbox when sent to
  `support@redflagdaddy.com`.
- Decide when to start legal review of the counsel pack.
- Approve `public/social-preview-20260907.png` or request a revision.

## Suggested next Codex prompt

```text
Review docs/current-execution-batch.md. Start with Batch 2. Verify staging admin
Questions and Categories, then run the guest-first staging smoke test. Keep
production locked and do not change production.
```
