# RedFlagDaddy product and marketing backlog

This is the living list of product features, launch work and marketing ideas for
RedFlagDaddy. It combines the owner's marketing plan with findings from the app
audit. Hosting, DNS, Cloudflare and other architecture work remain outside this
list.

## How this list is used

- `Built` means the capability exists in the application. It may still need
  staging or production verification.
- `Go-live` means it should be completed or explicitly accepted before public
  promotion.
- `Next` means it is a strong post-launch candidate.
- `Later` means it should wait until the manual launch process has produced
  enough evidence.
- A backlog item may be included in a code batch when it directly fits the
  batch, is low-risk and does not broaden the approved scope.
- Anything involving claims, legal wording, public accounts, publishing,
  credentials, spending, production analytics or user contact still requires
  owner approval.

## Product capabilities already built

- [x] Account registration and sign-in.
- [x] Account and guest assessment journeys.
- [x] Role-aware questionnaires and compatibility/safety scoring.
- [x] Email and SMS invitations with expiry and completion controls.
- [x] Private owner results and explicitly enabled shared reports.
- [x] A clearly labelled synthetic demo report.
- [x] Profile preferences, help and safety surfaces.
- [x] Payment/upgrade flow with server-side entitlement checks.
- [x] Admin management surfaces.
- [x] User data export and account deletion controls.
- [x] Consent-led, first-party funnel analytics, disabled by default.
- [x] External AI analysis behind a disabled-by-default approval gate.
- [x] Public metadata, canonical URLs, sitemap and robots controls.

## Go-live product and trust work

- [x] Restore visible SMS action feedback: sending state plus global success and
      error notifications for journey invite requests.
- [x] Fix the broken header logo after the Cloudflare migration.
  - Replace the Lovable-only `/__l5e/assets-v1/...` reference with a real,
    full-resolution logo stored in the repository's public assets.
  - Keep the existing 64 x 64 favicon for browser icons rather than stretching
    it into the header.
  - Verify the header logo on public, authenticated and mobile layouts, and
    confirm a missing image never leaves an unlabelled control.
- [ ] Publish an approved privacy notice and terms for the launch countries.
- [ ] Add the approved public support contact throughout the relevant help,
      safety and account surfaces.
- [ ] Add the owner-approved abuse, threat, stalking, self-harm and emergency
      escalation procedure.
- [ ] Add approved country-specific crisis and emergency resources; keep the
      current guidance generic until those resources are approved.
- [ ] Complete end-to-end staging checks for registration, journeys,
      assessments, result sharing, export, deletion, invitations and provider
      failures using synthetic data.
- [ ] Complete keyboard, screen-reader, reduced-motion and responsive checks on
      every public conversion path, then fix the findings.
- [ ] Approve and verify pricing, currency, refunds and production checkout
      before enabling paid mode.
- [ ] Decide whether external AI analysis will launch; if so, approve the
      processor, disclosure, data categories, consent and retention first.
- [ ] Approve production analytics only after the documented staging payload
      inspection passes.
- [ ] Replace the obsolete social preview with an approved 1200 x 630 brand
      image and verify link previews.
- [ ] Record final go/no-go approval against the exact deployed commit.

## Launch positioning and conversion decisions

- [ ] Adopt a plain-language product glossary and update all user-facing copy.
  - Use `partner` instead of `respondent`, `recipient` or `participant` in the
    normal journey flow: for example, `Send the assessment link to your
partner` and `Your partner has started`.
  - Prefer `you`, `your partner`, `their role` and `partner progress`; use
    `person` when relationship-neutral safety or privacy wording is clearer.
  - Apply the language consistently across the creation wizard, journey
    tracker, dashboard, About page, reports, demo content, empty states, SMS
    dialogs, messages and relevant email copy.
  - Keep technical database fields, APIs, delivery infrastructure and internal
    admin terminology unchanged unless a rename provides a concrete benefit;
    this is primarily a clarity improvement, not a data migration.
  - Add a public-copy regression check so jargon does not drift back into the
    main user journey.
- [ ] Confirm the primary audience and minimum age.
- [ ] Confirm launch countries.
- [ ] Confirm brand voice and prohibited topics.
- [ ] Confirm the primary conversion action and CTA.
- [ ] Confirm the canonical landing-page URL.
- [ ] Confirm public claims and honest product limitations.
- [ ] Review the landing, registration, demo and upgrade paths against the
      approved audience and CTA; improve copy or friction where evidence supports
      it.

## Marketing foundation

- [ ] Secure Gmail, TikTok, Instagram and Threads with MFA and recovery codes.
- [ ] Create an ownership and credential inventory.
- [ ] Build the brand kit: logo variants, colours, typography, caption style,
      disclosure language and accessibility guidance.
- [ ] Create moderation rules and the safety-escalation playbook.
- [ ] Create the content tracker with idea, approval, consent, accessibility,
      UTM, publishing and results fields from the marketing plan.
- [ ] Record baseline followers, reach, visits, sign-ups and activations.
- [ ] Create the weekly privacy-safe scorecard.

## Four-week manual content pilot

Target cadence: three strong posts and one community question per week, plus a
weekly product demonstration once the product is launch-ready. Adapt ideas for
each platform instead of publishing identical versions.

Content mix:

- 40% red-flag education: patterns, context and healthier alternatives.
- 20% green flags and boundaries.
- 15% interactive, non-diagnostic scenarios.
- 15% product demonstrations, privacy controls and honest limitations.
- 10% founder journey and community safety.

Pilot deliverables:

- [ ] Four-week content calendar.
- [ ] Founder/mission introduction.
- [ ] Educational red-flag and green-flag posts.
- [ ] Weekly community questions that do not solicit private disclosures.
- [ ] Privacy and product-expectations post.
- [ ] Product walkthrough made only with synthetic data.
- [ ] Hook and CTA experiments that change one variable at a time.
- [ ] Platform-native scripts, captions, shot lists, alt text and thumbnails.
- [ ] Exact human approval for every final asset, caption, link, account and
      scheduled time.
- [ ] Results recorded after 24 hours and seven days.
- [ ] Pilot report covering winning pillars, formats, conversion quality,
      workload, moderation risks and next experiments.

## Measurement and attribution

- [x] Canonical organic-social UTM allow-list implemented.
- [x] First-touch attribution limited to the current browser tab.
- [x] Anonymous funnel events implemented without user IDs or product content.
- [x] Opt-out clears stored attribution and once-only markers.
- [ ] Verify every UTM and event in staging with synthetic users.
- [ ] Approve the 35-day analytics retention period and exact consent copy.
- [ ] Enable production analytics only after explicit owner approval.
- [ ] Use activation quality, not clicks alone, to judge campaigns.

## Next product and marketing improvements

- [ ] Re-enable email and selected social sign-in directly through Supabase Auth;
      do not introduce Clerk for the current product.
  - Start with passwordless email OTP plus Google and Apple. Consider Facebook
    only after audience evidence justifies its additional provider setup and
    review burden.
  - Keep phone sign-in available and present all methods on one clear sign-in
    surface.
  - Add a dedicated OAuth callback with an allow-listed post-auth destination,
    separate staging/production provider credentials and exact approved
    redirect URLs.
  - Configure production custom SMTP before enabling email OTP; do not rely on
    Supabase's restricted default mail service.
  - Request only the minimum OAuth scopes needed for authentication and basic
    profile display; never request contacts, posts, messages or social graphs.
  - Require the 18+ and consent confirmation plus role onboarding after a new
    email/social identity returns; a provider login does not prove age,
    identity, safety or trustworthiness.
  - Build an explicit account-linking flow for current phone users. Their Auth
    records use synthetic email addresses, so never assume an OAuth login is
    the same person based only on a profile email or display name.
  - Let a signed-in user add and review login methods from Profile, prevent
    removal of their final usable method, and verify deletion removes the Auth
    user and all linked identities.
  - Preserve the existing Supabase user ID, RLS ownership, admin membership,
    journeys and payments when linking a new identity.
  - Cover new signup, returning login, cancellation, denied consent, duplicate
    email, existing phone-account linking, admin login, logout and account
    deletion with staging tests before release.
- [ ] Add a purely anonymous guest-journey option with no phone number, email or
      account.
  - Let the creator choose `No notifications — I'll return with a code`, then
    create the journey without storing communication details.
  - Show a clear completion card containing the partner assessment link and a
    separate private owner lookup code; never reuse the partner's invite code
    as the report-access credential.
  - Explain that the owner will receive no completion message, must save the
    private code and cannot recover it if it is lost. Offer copy and print/save
    actions without sending the code to third parties.
  - Add a `Check a journey code` input on the guest surface. Submit the code in
    a request body rather than a URL, return a generic response for invalid or
    expired codes, and show pending, in-progress or completed status.
  - When complete, allow the valid owner code to retrieve the report without
    exposing it to the respondent or creating an account.
  - Store only a strong hash of the owner code, use enough random entropy,
    rate-limit lookups, keep routes out of search indexes and never include the
    code in analytics, logs or referrers.
  - Define and display the anonymous journey/report expiry period before
    implementation, then delete expired anonymous records automatically.
- [ ] Redesign administration as a dedicated, readable workspace.
  - Show a clear `Admin` button only to authorised administrators after sign-in;
    keep their personal profile and ordinary user dashboard separate.
  - Give `/admin` its own wider responsive shell instead of squeezing admin
    tools into the normal user layout and bottom navigation.
  - Open on an overview dashboard with useful status cards and clear routes to
    Questions, Categories, Journeys, Analytics and Settings.
  - Use a desktop sidebar or section navigation and a compact mobile admin menu,
    with an obvious `Return to app` action.
  - Break the current five-tab monolith into focused, scannable sections with
    consistent headings, search/filter controls, loading/empty/error states and
    protected destructive actions.
  - Preserve both route-level and server-side admin authorization, and verify
    that non-admin users cannot see the entry point or access any admin data.
- [ ] Standardise all six mobile-number inputs on one international phone
      component (sign-in, registration, account journey, account resend, guest
      journey and guest resend).
  - Silently use Cloudflare's request country hint to preselect the likely
    country; do not call an external IP-geolocation service or store the IP or
    inferred country.
  - Fall back to South Africa when the country hint is absent or unsupported,
    and always let the user change the country.
  - Normalise valid numbers to E.164 before validation, storage, rate limiting
    or SMS delivery, while displaying a familiar national format during entry.
  - Keep detection failure invisible and non-blocking, and cover country
    selection, international input and E.164 output with regression tests.
- [ ] Turn recurring, non-sensitive support and community questions into an
      approved education backlog.
- [ ] Add product walkthrough material to the public site once the final flow
      and brand assets are approved.
- [ ] Review funnel results for avoidable landing-to-sign-up and
      sign-up-to-core-action friction.
- [ ] Review the usefulness and clarity of exports, deletion, sharing controls
      and safety guidance after launch feedback.
- [ ] Repurpose the strongest pilot concepts into new platform-native formats.
- [ ] Consider YouTube only after ownership of the intended handle and the
      ongoing production workload are confirmed.

## Later: guarded automation

Do not begin this phase until the manual content workflow and tracker statuses
have operated reliably for at least four weeks.

- [ ] Decide whether n8n and Buffer automation is justified by pilot workload.
- [ ] Limit the first workflow to owner-approved content rows and Buffer drafts.
- [ ] Require approver identity, approval time and a content hash.
- [ ] Add least-privilege credentials, signed webhooks, idempotency, failure
      alerts, an audit log and a manual kill switch.
- [ ] Keep automatic publishing, replies and DMs disabled initially.
- [ ] Prevent production data, private messages and support conversations from
      reaching AI prompts.
- [ ] Complete duplicate, failure, credential and kill-switch tests before use.

## Non-negotiable content rules

- Human approval is required for every post, campaign, reply, link and paid
  action.
- Do not diagnose people, guarantee safety or present content as medical,
  legal, crisis or emergency advice.
- Do not publish identifiable stories, screenshots, testimonials or DMs without
  written consent.
- Do not infer or target sensitive traits.
- Do not send production data, profiles, answers, credentials, email lists,
  private messages or support conversations to an AI model.
- Collect only the analytics needed for the approved funnel.

## Source documents

- Owner-provided `writing-block.md` marketing plan.
- `docs/go-live-checklist.md`.
- `docs/marketing-analytics.md`.
- Current repository product audit.
