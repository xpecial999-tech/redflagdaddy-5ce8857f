# RedFlagDaddy go-live gates

Updated: 31 August 2026

Public promotion stays paused until every blocking item below is complete. This
list covers product and marketing readiness. The Cloudflare migration is
complete; further hosting architecture changes remain outside this task.

Current priorities and owner actions are maintained in
`docs/current-backlog.md` and `docs/owner-input-checklist.md`.

## Completed in code

- Anonymous shared-report table enumeration removed.
- SMS bodies and bearer links removed from delivery logs.
- Public and SMS-producing flows rate-limited.
- Public bearer-code/report lookups use endpoint-specific hashed-IP throttles.
- Clickatell delivery callbacks fail closed behind separate callback credentials
  and bounded request processing.
- Central response headers prevent framing and referrer leakage; private pages
  and server actions are non-cacheable and carry HTTP-level `noindex`.
- Phone sign-in uses indexed direct identity lookup rather than a fixed first
  page of Auth users.
- Private routes redacted from error telemetry and marked `noindex`.
- Consent-led, first-party funnel analytics implemented and disabled by default.
- Public sitemap and canonical metadata added.
- Unsupported product, research, identity-verification and privacy claims removed.
- The public demo is clearly labelled as synthetic and non-diagnostic.
- External AI analysis is disabled by default behind an explicit server-side
  approval switch.
- Assessment submissions are restricted to their assigned visible questions,
  and answer values are validated before scoring.
- TanStack's same-origin CSRF middleware now protects every server-function RPC
  before authentication and request handling; the framework warning is gone.
- Account exports fail safely if incomplete, omit active bearer secrets, raw
  payment payloads and partner-submitted raw answers, and account deletion checks
  every cleanup step.
- Public copy now states the agreed product boundary: a structured conversation
  aid, not identity verification, a background check, diagnosis, proof of
  consent, an emergency service or a guarantee of safety.
- Alternative account methods require an explicit 18+ and consent-guideline
  acknowledgement before a new email, Google or Apple account can continue.
- Private Markdown, topics-only Markdown, versioned JSON and discreet calendar
  exports are generated on-device without adding server-side retention.
- The first static accessibility hardening pass adds reduced-motion handling,
  accessible invite-code errors and assistive-technology announcements for key
  sign-in, registration and guest-creation outcomes.
- A local 390 px browser pass confirms the construction page has no horizontal
  overflow and upgrades its About link and all footer links to 44 px minimum
  touch targets. The normal public paths still require a deployed staging pass.
- Extracting the login form into a lazily loaded route chunk removes the route
  code-splitting warning and reduces the shared client entry from 297.44 kB to
  242.49 kB gzip (about 18.5%).
- The owner-supplied CI kit is merged: exact approved header and
  construction artwork, emblem favicons/app icons, install manifest, colour
  tokens and DM Serif Display. Real-device icon and route-wide contrast checks
  remain part of staging verification.
- Compact public actions now meet the 44 px touch-target minimum across the
  header, landing, registration, consent/safety, analytics and guest recovery
  surfaces. Browser checks found no undersized controls or horizontal overflow
  on the branded About and consent/safety pages at the tested desktop viewport.
- The final merged launch-hardening branch passes TypeScript, 149 automated
  tests across 32 files and a complete Cloudflare-compatible production build.

## Blocking owner decisions and artifacts

- [x] **DONE:** approve the adult kink-community audience, global English-first
      launch shape, fun-but-clear non-political voice and account-creation CTA.
- [ ] Obtain appropriate legal review using
      `docs/legal-policy-counsel-review-pack.md`, then publish the approved privacy
      notice, terms and safety policy for allowed jurisdictions.
- [ ] **OWNER APPROVED / CODE MERGED:** public support contact and escalation
      procedure. Configure Cloudflare Email Routing and Turnstile, deploy, then pass
      the synthetic delivery and escalation tests.
- [x] **DONE:** use approved local-emergency wording and Find A Helpline for the
      initial global beta; do not guess country from IP or publish an unreviewed
      country-number list.
- [ ] Enable production analytics only after the already approved 35-day policy
      passes staging payload and consent verification.
- [x] **DONE:** keep external AI disabled for the dry run and initial public
      launch. A future opt-in beta requires a new approved processor, disclosures,
      consent and retention policy; do not activate the old Lovable gateway.
- [x] **DONE:** keep paid mode off. Reaching 1,000 registered accounts triggers a
      commercial review; it does not automatically enable charging.
- [x] **DONE:** owner supplied the current CI branding kit and it is treated as
      the local visual source of truth.
- [ ] Create and approve a dedicated 1200×630 social-sharing image; the kit has
      square and portrait social artwork, but no image at this ratio.
- [ ] Confirm all public account handles. **DONE:** owner-controlled MFA and
      recovery details are confirmed; finish the non-secret account inventory.

## Required staging verification

- [ ] Apply all Supabase migrations in timestamp order before deploying matching app code.
- [ ] Confirm approved FetLife, Reddit and X campaign events insert successfully
      after `20260829000000_expand_marketing_sources.sql` is applied.
- [ ] Complete the analytics checklist in `docs/marketing-analytics.md` with synthetic users.
- [ ] With synthetic answers, verify disabled mode sends no external AI request.
      Enabled-mode testing belongs to a future separately approved AI beta and is
      not part of the initial launch.
- [ ] Test account registration, sign-in, sign-out and account deletion.
- [ ] Verify the account export includes safe payment history, excludes invite
      codes/share tokens/raw provider payloads/partner-submitted raw answers, and
      fails without downloading a partial file when any source query errors.
- [ ] Test guest and account journey creation, invite expiry and single-use completion.
- [ ] Verify an assessment cannot submit an unassigned question, an invalid
      answer value or a completion request while a visible answer is still unsaved.
- [ ] Test owner results, explicit report sharing, sharing disablement and unauthorized access.
- [ ] Test SMS provider failure, rate-limit messages and log redaction.
- [ ] Configure and verify authenticated SMS delivery callbacks using
      `docs/clickatell-sms-callback-setup.md`.
- [x] **NOT AN INITIAL-LAUNCH GATE:** paid mode stays disabled. At the later
      1,000-account commercial review, compare Stripe and Peach for supported
      countries, currencies, adult-content policies, tax, refunds, payouts and
      total cost before selecting a provider or starting sandbox work.
- [ ] Verify sitemap, robots directives, canonical tags and `noindex` output on the deployed staging site.
- [ ] Run keyboard, screen-reader, responsive-layout and reduced-motion checks on every public conversion path.
- [ ] Record go/no-go approval with the exact deployed commit and migration set.
