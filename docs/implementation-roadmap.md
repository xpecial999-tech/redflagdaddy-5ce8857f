# RedFlagDaddy implementation roadmap

Last prioritised: 25 August 2026.

This is the ordered execution view of the detailed
[`product-marketing-backlog.md`](product-marketing-backlog.md). It deliberately
separates launch blockers, near-term engineering and later product ideas. Moving
an item into this roadmap does not bypass owner approval for legal wording,
credentials, providers, user contact, spending, analytics or public promotion.

## Now: launch control and core usability

Owner decisions can progress in parallel with engineering, but must be complete
before public promotion:

1. Confirm the primary audience, minimum age, launch countries, brand voice,
   prohibited topics, main CTA and canonical landing URL.
2. Approve legal/privacy text, a public support contact, the escalation process
   and country-specific crisis resources.
3. Decide production pricing/refunds, analytics retention and enablement, and
   whether external AI analysis will launch.
4. Approve the brand kit and 1200 x 630 social-sharing image.

Engineering order:

1. **Construction mode and secure admin entry.** Add the administrator toggle,
   accessible maintenance surface, `/admin` sign-in and server-side enforcement.
   Preserve current data and provide a tested admin recovery path. Before merge,
   decide whether existing private assessment and report links remain usable;
   the recommended default is to block new public journeys while allowing
   already-issued private links to finish.
2. **Dedicated admin workspace.** Separate administration from the personal
   profile, add an admin-only entry button and reorganise the current monolith
   into clear overview, questions, categories, journeys, analytics and settings
   sections.
3. **International phone inputs.** Standardise every mobile field, silently
   select the likely country from Cloudflare's country hint, allow overrides and
   normalise to E.164 before validation or delivery.
4. **Authentication alternatives.** Extend Supabase Auth with passwordless
   email, Google and Apple, production SMTP, safe callbacks and explicit account
   linking for existing phone users. Keep SMS available, then add WhatsApp OTP
   as the first alternative phone delivery channel if its Twilio requirement is
   approved. Hold Telegram as a demand-led custom identity and exclude
   unofficial Signal automation.
5. **Anonymous owner-code journeys.** Add the no-contact creation path, separate
   private owner lookup code, rate-limited status lookup and automatic expiry.
6. **Go-live verification and fixes.** Complete synthetic end-to-end, provider
   failure, accessibility, responsive, reduced-motion, metadata and analytics
   checks. Fix findings, then record go/no-go approval against the exact commit.

Do not combine these six items into one pull request. Each should ship as a
reviewable batch with its own threat checks and regression coverage.

## Next: privacy controls and useful follow-through

1. Per-journey and shared-link expiry controls.
2. Redacted and selective result sharing.
3. Markdown, JSON and redacted image exports.
4. Practical post-results actions: negotiation checklist, discreet calendar
   invite and approved contextual resources.
5. Opt-in, non-sensitive journey-status notifications.
6. Private shared discussion workspace with explicit expiry and revocation.

This lane comes before richer planning tools because it establishes the sharing,
retention, export and notification primitives those tools need.

## Then: consent-led planning and reflection

1. Safeword and pause-protocol library.
2. Aftercare protocol builder.
3. Results-assisted scene and negotiation planner.
4. Post-conversation and post-scene reflection journeys.
5. Progressive multi-stage journeys and renegotiation stages.
6. Living limits map.
7. Editable working agreements with non-legal review markers.
8. Owner-only history followed by lightweight owner-only insights.

Generated plans must remain editable drafts. A result, acknowledgement, old
limit or completed checklist is never evidence of present consent or safety.

## Later: optional delight

1. Custom journey themes and owner-controlled conversation starters.
2. Private redacted archetype or vibe cards.
3. Curated soundtrack links; connected music accounts only after evidence of
   value and a separate privacy review.
4. Interactive educational scenarios.
5. Optional mood and energy check-ins.
6. Private, non-competitive milestones.
7. Passkeys after the expanded authentication system is stable.

These features must remain discreet and optional, with no public scoring,
leaderboards, streak pressure or social-data imports.

## Research hold

Do not schedule these until their prerequisites and dedicated reviews exist:

- Local-first/offline journeys: requires a separate architecture and threat
  model covering device loss, encryption, recovery, sync and deletion.
- Aggregate community education pulse: requires sufficient scale, cohort
  suppression rules and an independent privacy review.
- Marketing automation: requires at least four weeks of a reliable manual
  approval workflow and tested kill switches.
- Any monitoring, reputation, location, social-media or third-party profiling
  capability remains outside the product boundary.

## First engineering epic: construction mode

Current-state audit:

- `app_settings` already provides a public-readable singleton with admin-only
  writes. The existing paid-mode functions and Admin Settings card provide a
  reusable implementation pattern.
- `/admin` already verifies membership on both the route and server functions,
  but it sits under the normal authenticated layout. A signed-out visit is sent
  to the ordinary `/login` page rather than a dedicated administrator entry.
- The public shell always displays `Sign in`, and the landing page contains the
  `Start a journey` and `Continue as guest` conversion controls that must switch
  to the supplied construction artwork and accessible text.
- Guest creation is a public server function and account creation is an
  authenticated server function. Both require an authoritative settings check;
  hiding routes or buttons is insufficient.
- Existing assessment and shared-report routes are distinct from creation
  routes, so already-issued private links can remain usable without allowing new
  journeys. This is the recommended initial policy, pending owner confirmation.
- The settings read currently defaults paid mode off when no row is returned and
  does not expose lookup errors. Construction mode needs explicit error handling
  that never locks out the administrator and never silently permits a creation
  mutation when its state cannot be verified.
- No construction-mode audit fields exist yet. Add who changed the state and
  when, while keeping the setting itself readable without exposing unnecessary
  administrator profile data.

The first epic is split into four implementation batches:

1. **Current-state audit:** map the existing settings storage, admin
   authorisation, route guards, landing CTAs, caching behaviour and tests.
2. **Secure control plane:** add the typed setting, administrator-only mutation,
   confirmation, audit metadata and fail-safe read behaviour.
3. **Public enforcement:** add the accessible construction surface, hide public
   conversion controls, enforce blocked entry points on the server and allow the
   verified admin bypass.
4. **Verification:** test administrator recovery, non-admin denial, direct URL
   bypass attempts, setting failures, cache behaviour, mobile layout and
   no-index/maintenance responses.

Exit criteria: an administrator can safely enable and disable the mode without a
deployment; ordinary visitors cannot start a new journey through a hidden or
direct route; approved existing private links behave as decided; administrators
cannot be locked out; and the complete app test and production build pass.
