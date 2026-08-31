# RedFlagDaddy current backlog

Updated: 31 August 2026

This is the short, authoritative priority view. Detailed feature history remains
in product-marketing-backlog.md and backlog-prioritization-report.md.

## Status at a glance

### DONE and merged

- PR #15 merged the core dry-run features: construction mode, dedicated
  administration, international phone inputs, anonymous owner-code journeys and
  disabled-by-default email/social authentication preparation.
- PR #16 merged launch hardening: the public support form, security headers,
  privacy-safe exports, calendar invites, safer SMS/email processing, payment and
  AI activation gates, approved brand assets, accessibility improvements,
  runtime checks and the marketing-source database migration.
- The exact PR #16 branch passed the Cloudflare-compatible production build,
  TypeScript, 149 automated tests across 32 files and changed-file behavior lint
  with zero errors.
- GitHub access is isolated through the RedFlagDaddy Keychain token and does not
  alter the user's other GitHub CLI authentication.
- Cloudflare migration is complete and redflagdaddy.com is already served by
  Cloudflare. The newly merged application changes have not been deployed by
  this task.

### Current documentation release

- This branch updates the owner checklist, release manifest, deployment runbooks,
  marketing plan, counsel review pack and production-account inventory.
- Cloudflare ownership is recorded as owner-confirmed under the
  redflagdaddy-xpecial999 account namespace.
- No provider activation, Cloudflare deployment, DNS change or public promotion
  is included in the documentation release.

## P0 — dry run and release readiness

- Apply all newly merged Supabase migrations to staging, including the anonymous
  journey lifecycle, construction settings and marketing-source constraint.
- Deploy the exact merged main commit to Cloudflare staging before promoting the
  same artifact to production.
- Configure PUBLIC_SITE_URL and confirm staging and production generate links on
  their own HTTPS origins.
- Configure Turnstile and outbound transactional email, then run the normal,
  privacy, safety and immediate-danger support scenarios.
- Confirm Clickatell sending and its authenticated callback capability. Keep
  callbacks disabled if the provider cannot authenticate them.
- Test account creation, OTP login, partner invitations, SMS success/failure,
  anonymous owner codes, construction bypass resistance, administrator recovery,
  report revocation and account deletion.
- Run the mobile, keyboard, screen-reader, reduced-motion, metadata, icon and
  cross-browser checklist.
- Record the exact deployed commit and a go/no-go result in weekend-dry-run.md.

## P1 — before public promotion

- Obtain qualified legal review and publish approved privacy, terms,
  safety/acceptable-use and retention text.
- Complete support routing, outbound email, response ownership and escalation
  drills.
- Inspect staging analytics payloads and approve the final production consent
  wording; retain consented analytics for no more than 35 days.
- Complete the non-secret production account inventory and privately verify MFA,
  recovery and billing ownership.
- Create and review a dedicated 1200 × 630 social-preview image.
- Enable email magic links and then Google sign-in only after provider
  configuration and account-linking tests. Keep SMS fallback; defer Apple if it
  delays launch.
- Do not begin public promotion until the signed production go/no-go is complete.

## P2 — after a stable free launch

- Add per-share expiry/revocation and clearer selective-sharing controls.
- Finish redacted PDF/image export and contextual approved resource links.
- Add opt-in discreet status email notifications.
- Build private redacted vibe cards and custom journey themes.
- Review support volume, login/SMS success and consented funnel results weekly.

## P3 — commercial review

- At 1,000 accounts, compare Stripe and Peach for supported markets, adult-content
  rules, tax, refunds, payouts, disputes and total cost. Do not activate billing
  automatically.
- Workshop the private shared discussion workspace before data modelling:
  authorship, edit/delete rights, visibility, expiry, revocation and stale markers
  after changed or withdrawn consent.
- Follow later with living limits, aftercare and scene planning, working
  agreements, reflection journeys and owner-only history. Never infer or
  automatically link people across journeys.

## Holds and exclusions

- External AI analysis remains off until a processor, disclosure, consent,
  retention design and provider credential receive separate approval.
- Baileys, personal WhatsApp sessions and unofficial Signal automation are not
  acceptable for production authentication.
- No public scoreboards, reputation data, social-media analysis, location
  monitoring or third-party profiling.
- Paid mode, WhatsApp OTP, Apple sign-in and shared workspaces remain deferred.

## What is needed from the owner

The current owner-controlled actions are maintained in
owner-input-checklist.md. Product ideas can continue to be recorded without
interrupting P0 delivery.
