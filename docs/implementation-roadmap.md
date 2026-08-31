# RedFlagDaddy implementation roadmap

Last prioritised: 31 August 2026.

For the current short execution queue, use `docs/current-backlog.md`.

This is the ordered execution view of the detailed
[`product-marketing-backlog.md`](product-marketing-backlog.md). It deliberately
separates launch blockers, near-term engineering and later product ideas. Moving
an item into this roadmap does not bypass owner approval for legal wording,
credentials, providers, user contact, spending, analytics or public promotion.

## Now: launch control and core usability

The audience, 18+ rule, global English-first positioning, voice, product claims,
primary CTA, canonical URL, support direction, crisis-resource approach, 35-day
analytics direction, paid-mode hold, AI hold and brand kit are decided. Before
public promotion, obtain counsel-approved legal/privacy text, activate and test
support, inspect analytics on staging, complete the account inventory and
approve the dedicated 1200 × 630 social-preview image.

Engineering order:

1. **DONE and merged — Construction mode and secure admin entry.** Add the administrator toggle,
   accessible maintenance surface, `/admin` sign-in and server-side enforcement.
   Preserve current data and provide a tested admin recovery path. Existing
   private assessment and report links remain usable while new public journeys
   are blocked; the owner confirmed this policy on 28 August 2026.
2. **DONE and merged — Dedicated admin workspace.** Separate administration from the personal
   profile, add an admin-only entry button and reorganise the current monolith
   into clear overview, questions, categories, journeys, analytics and settings
   sections.
3. **DONE and merged — International phone inputs.** Standardise every mobile field, silently
   select the likely country from Cloudflare's country hint, allow overrides and
   normalise to E.164 before validation or delivery.
4. **DONE and merged, disabled — Authentication alternatives.** Extend Supabase Auth with passwordless
   email, Google and Apple, production SMTP, safe callbacks and explicit account
   linking for existing phone users. Keep SMS available, then add WhatsApp OTP
   as the first alternative phone delivery channel if its Twilio requirement is
   approved. Hold Telegram as a demand-led custom identity and exclude
   unofficial Signal automation.
5. **DONE and merged — Anonymous owner-code journeys.** Add the no-contact creation path, separate
   private owner lookup code, rate-limited status lookup and automatic expiry.
6. **IN PROGRESS — Go-live verification and fixes.** Complete synthetic end-to-end, provider
   failure, accessibility, responsive, reduced-motion, metadata and analytics
   checks. Fix findings, then record go/no-go approval against the exact commit.

Items 1–5 were integrated and merged through PR #15; broader launch hardening
merged through PR #16. Item 6 remains the controlled staging and release gate.

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

## Completed first engineering epic: construction mode

The following is retained as the implementation and verification record. The
feature is complete locally; staging and release checks remain in
`docs/weekend-dry-run.md`.

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
  routes, so already-issued private links remain usable without allowing new
  journeys. The owner confirmed this policy on 28 August 2026.
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
