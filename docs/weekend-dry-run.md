# RedFlagDaddy weekend dry run

Updated: 29 August 2026

This runbook is for the first combined staging test. It does not authorize
public promotion or production provider activation. The Cloudflare migration is
complete; this runbook does not authorize further DNS/hosting changes.

## Before the dry run

- [ ] Authenticate GitHub CLI.
- [ ] Push and review the completed feature branches in the release order below.
- [ ] Keep construction mode off unless its behavior is the specific test.
- [ ] Keep email, Google, Apple, production analytics, AI analysis and paid mode
      disabled unless their individual provider test is approved.
- [ ] Confirm the staging deployment uses the new Supabase project and synthetic
      test accounts only.
- [ ] Set `PUBLIC_SITE_URL` to the exact HTTPS staging origin and confirm
      `PUBLIC_APP_URL` is unnecessary; no staging SMS or copied invite may point
      to production.
- [ ] Seed one journey with an old stored production `invite_url`; confirm the
      staging tracking page, copy action, resend SMS and completion SMS all use
      the current staging origin instead.
- [ ] Apply `20260829000000_expand_marketing_sources.sql` before testing approved
      FetLife, Reddit or X attribution; confirm the constraint remains an exact
      allowlist rather than free text.
- [ ] Configure staging Cloudflare Email Routing and Turnstile from
      `docs/support-form-deployment.md`; keep the private forwarding destination
      out of Git and screenshots.

## Release order

1. Construction mode and secure `/admin` entry.
2. Dedicated administrator workspace.
3. International phone-number inputs.
4. Anonymous owner-code journeys and their database migration.
5. Disabled-by-default email and social authentication preparation.
6. Launch-hardening follow-up: account-consent gate, public copy, private
   exports/calendar invite, accessibility fixes and server validation cleanup.
7. Public support form and operational support-email delivery.

Deploy and smoke-test each batch before moving to the next. Do not combine the
database migration with unrelated provider activation.

## Automated gate already completed

- [x] All five local feature batches combined without an application-code
      conflict.
- [x] Type checking passes.
- [x] 108 automated tests across 24 files pass.
- [x] Behavior and safety lint rules pass on all changed application files.
- [x] Full Cloudflare production build passes.
- [x] Landing, guest, login, registration, admin and authentication callback
      routes return successfully from the combined local application.
- [x] Alternative sign-in methods remain invisible when their flags are absent.
- [x] New alternative-auth identities cannot enter the authenticated app until
      they explicitly confirm 18+ status and the consent/safety guidelines;
      established phone users are not interrupted.
- [x] Complete Markdown, topics-only Markdown, versioned JSON and discreet
      calendar exports pass focused privacy tests and stay owner-only.
- [x] All deprecated server-function validator calls and unsafe explicit-`any`
      errors in the combined app are removed.
- [x] TanStack's same-origin CSRF middleware protects server-function RPCs and
      the local framework warning is resolved.
- [x] At a 390 px viewport, the construction page has no horizontal overflow;
      its About link and every footer link meet the 44 px touch-target minimum.
- [x] The login UI is isolated in its own lazy route chunk. This removes the
      route code-splitting warning and reduces the shared client entry from
      297.44 kB to 242.49 kB gzip (about 18.5%).
- [x] The owner-supplied CI kit is mapped to application tokens and typography;
      approved emblem favicons/app icons and the install manifest are present.
- [x] Compact actions on the header, landing, registration, consent/safety,
      analytics-choice and guest recovery surfaces use a 44 px minimum target;
      focused source tests and browser checks protect the change.
- [x] Shared form inputs and select triggers use 48 px controls; every shared
      button size and select option is at least 44 px.
- [x] Public support form, validation, Turnstile enforcement, rate limits and
      operational email template pass focused tests and the complete isolated
      Cloudflare build.
- [x] **DONE and merged:** support submissions reject private links/access codes,
      require the expected Turnstile action and accept only a journey UUID as
      an optional reference.
- [x] **DONE and merged:** OTP throttling uses the trusted Cloudflare client address
      before forwarded-header fallbacks.
- [x] **DONE and merged:** disabling report sharing permanently revokes that URL;
      re-enabling sharing generates a new private token.
- [x] **DONE and merged:** public guest, invite and assessment database failures use
      generic responses, while bounded error codes remain in server logs; failed
      guest invite creation also attempts to remove the incomplete journey.
- [x] **DONE and merged:** root search/social metadata states the approved product
      boundary and avoids a country-specific locale; guest and registration
      intake forms are marked `noindex`.
- [x] **DONE and merged:** approved FetLife, Reddit and X attribution values pass
      browser parsing, server validation and a matching pending database
      constraint through one shared allowlist.
- [x] **DONE and merged:** phone identities are found through the indexed unique
      profile phone rather than a fixed-size Auth user listing; account journey
      creation cleans up if its invite insert fails.
- [x] **DONE and merged:** public invite/report boundaries are rate-limited using
      hashed caller addresses, and SMS provider failures do not expose provider
      messages or configuration names.
- [x] **DONE and merged:** every response receives baseline anti-framing,
      MIME-sniff, no-referrer and permissions protection; private pages and
      server actions also receive `Cache-Control: no-store` and `X-Robots-Tag`.
- [ ] Verify the brand-token update across all major routes and the supplied
      icons on real browsers/devices after the combined branch reaches staging.
- [ ] Normal landing, registration, login and guest paths still need the full
      mobile browser pass on staging; local development correctly failed closed
      into construction mode without a service-role credential.

## Staging smoke test

### Public and construction mode

- [ ] Landing page shows the repository-owned logo on desktop and mobile.
- [ ] Sign in, Create an account and Continue as guest work while construction
      mode is off.
- [ ] Enabling construction mode replaces public conversion controls with the
      approved construction page.
- [ ] A direct attempt to create a new guest or account journey is rejected
      while construction mode is on.
- [ ] An existing private assessment link and an existing report link still
      work while construction mode is on.
- [ ] `/admin` remains reachable and an administrator can turn construction
      mode off again.
- [ ] Public pages send anti-framing, no-referrer, MIME-sniff and permissions
      headers without breaking Turnstile, fonts or navigation.
- [ ] Private journey/report pages and server actions send
      `Cache-Control: no-store` and `X-Robots-Tag: noindex, nofollow, noarchive`.

### Administrator workspace

- [ ] Non-admin users cannot see the Admin button or access admin data.
- [ ] Administrator overview cards load.
- [ ] Questions, Categories, Journeys, Analytics and Settings navigation works
      on desktop and mobile.
- [ ] Return to app works.
- [ ] Protected or destructive actions still require their existing
      confirmation and authorization.

### International phone inputs and SMS

- [ ] A South African request defaults to South Africa without a visible delay.
- [ ] At least one non-South-African request selects the correct country.
- [ ] Manual country override works.
- [ ] Login, registration, account journey, account resend, guest journey, guest
      resend and partner-invite fields all accept and display the number
      consistently.
- [ ] A real test SMS succeeds, and a deliberately failed provider request shows
      a useful error without exposing secrets or raw provider details.
- [ ] Configure separate staging callback credentials using
      `docs/clickatell-sms-callback-setup.md`; verify valid delivery updates and
      the missing, incorrect, oversized and malformed request cases.

### Anonymous owner-code journey

- [ ] Choose No notifications and create a journey without a phone or email.
- [ ] Save the owner code separately from the partner link.
- [ ] Confirm the owner code is absent from the address bar, analytics and logs.
- [ ] An invalid code returns the same generic response as an expired code.
- [ ] The valid code shows waiting, then in-progress, then the completed report.
- [ ] No completion SMS or public report link is created for this journey.
- [ ] Report print/save works.
- [ ] Confirm the displayed 30-day expiry and database cleanup schedule.

### Alternative authentication preparation

- [ ] With every new authentication flag absent, login and registration remain
      SMS-only.
- [ ] `/admin` remains SMS-only even when ordinary alternative methods are
      enabled in staging.
- [ ] The invalid callback page is generic, no-indexed and cannot redirect to an
      arbitrary destination.
- [ ] A newly created email, Google or Apple identity is sent to the 18+ and
      consent confirmation page and cannot bypass it with a direct dashboard URL.
- [ ] An established phone user still signs in without a new confirmation gate.
- [ ] Do not activate a provider until the corresponding steps in
      `authentication-rollout.md` are complete.

### Private post-results tools

- [ ] The Export menu works by keyboard and on a narrow mobile viewport.
- [ ] Complete Markdown and JSON include the private report but omit contact
      details, raw answers, bearer links and generation timestamps.
- [ ] Topics-only Markdown omits scores, readiness and the overall note.
- [ ] The calendar file defaults to `Private conversation`, contains no journey
      details, and includes only the individually selected topics after opt-in.
- [ ] None of these owner controls appear on a public shared-report page.

### Core regression

- [ ] Register, sign in, sign out and sign back in.
- [ ] Create an account journey, send the partner invite and resend it.
- [ ] Complete an assessment once; confirm duplicate completion is rejected.
- [ ] View owner results, enable sharing, open the shared report, disable
      sharing and confirm the old link stops working.
- [ ] Download account data and confirm no invite codes, share tokens, raw
      provider payloads, partner-submitted raw answers or incomplete export are
      included.
- [ ] Delete a synthetic account and confirm its owned data is removed.
- [ ] Check keyboard navigation, focus visibility, screen-reader labels,
      reduced-motion behavior and narrow mobile layouts on every conversion
      path.

### Support and safety intake

- [ ] `/support` is reachable signed in and signed out and appears in the public
      footer/sitemap.
- [ ] A normal synthetic request reaches `support@redflagdaddy.com` and forwards
      to the private destination without exposing that address to the browser.
- [ ] Invalid Turnstile, repeated submissions and malformed email/details fail
      with clear generic messages and do not queue mail.
- [ ] An immediate-danger selection displays the local-emergency boundary and
      Find A Helpline before the human response.
- [ ] A successful submission returns a reference; the queued message contains
      only the reviewed minimum fields and no password, OTP or private link.
- [ ] Run the six synthetic scenarios in
      `docs/support-safety-runbook-draft.md` and record operator/action results.
- [ ] Confirm direct POST requests to the retired
      `/lovable/email/transactional/send` route return `404`, while support and
      approved Auth email still queue through their trusted server paths.

## Known local-tooling findings

- The repository's `npm run preview` currently looks for the obsolete
  `dist/server/server.js` path; the current Cloudflare build correctly emits
  `.output/server`. Use the Cloudflare staging deployment for the production-like
  dry run.
- The available local Node 20 runtime does not provide the native WebSocket
  support expected by the installed Supabase client. Cloudflare is unaffected;
  use Node 22 if a fully connected local Supabase test is needed.
- The deprecated TanStack validator warnings have been removed. The build still
  reports third-party module-directive, Cloudflare config-override and large
  client-chunk warnings; they are non-blocking but the large entry chunk should
  be profiled after the launch path is stable.
- The full formatting rule reports style-only differences in previously
  completed files. Type safety, tests and behavior lint rules pass.
- [x] **RESOLVED locally:** refresh and freeze the compatible TanStack framework
      family used by the CSRF-protected app. A clean temporary install from the
      updated lock passes type checking, all 79 current tests through Vitest and
      the full Cloudflare build. CI must repeat the frozen-install proof on the
      launch-hardening PR.

## Stop conditions

Stop the release and keep the previous Cloudflare deployment if any of these
occur:

- Administrator lockout or non-admin access to administrator data.
- Construction mode can be bypassed to create a journey.
- Owner codes, invitation links, report tokens, phone numbers or private answers
  appear in logs, analytics or unintended URLs.
- A journey or result is attached to the wrong account.
- SMS, authentication or payment errors expose whether another person's account
  exists.
- Database migration failure or count mismatch.
- A provider is active without the matching owner approval and dry run.
- A private page or server action is cacheable, indexable or sends its bearer
  URL as a referrer.

## Completion record

Record before go-live:

- Exact Git commit:
- Applied database migrations:
- Cloudflare staging deployment:
- Tester and date:
- Passed checks:
- Accepted limitations:
- Remaining blockers:
- Go / no-go decision:
