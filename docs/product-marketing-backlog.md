# RedFlagDaddy product and marketing backlog

Updated: 31 August 2026

This is the living list of product features, launch work and marketing ideas for
RedFlagDaddy. It combines the owner's marketing plan with findings from the app
audit. The Cloudflare migration is complete; hosting, DNS and other architecture
work remain outside this list.

The ordered delivery sequence lives in
[`implementation-roadmap.md`](implementation-roadmap.md). This file remains the
detailed catalogue and acceptance criteria for every recorded idea.

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
- [x] **DONE and merged:** apply the owner-supplied CI branding kit to the product.
  - Confirm the repository header logo and construction artwork exactly match
    the supplied approved assets.
  - Replace the squeezed wordmark favicon with the approved emblem and add ICO,
    Apple touch, 256 px and 512 px app icons plus a web app manifest.
  - Map application colours and fonts to the supplied tokens, remove the cyan
    ambient glow and reduce glass/glow intensity.
  - Replace ad-hoc status greens, ambers, reds and blues across results, demo,
    journeys, dashboard, upgrade and admin with the approved semantic tokens;
    retain text labels and icons so colour is never the only signal.
  - Protect the mapping, icon dimensions and manifest with automated tests; see
    `docs/brand-implementation.md` for remaining staging checks and guardrails.
- [ ] Publish an approved privacy notice and terms for the launch countries.
- [x] **DONE and merged:** add `support@redflagdaddy.com`, a first-party support
      form, emergency boundary and support links to the relevant public and
      signed-in surfaces. Cloudflare forwarding and Turnstile configuration
      remain deployment tasks.
- [x] **DONE and merged / owner approved:** add the owner-approved abuse, threat,
      stalking, self-harm and emergency escalation procedure.
  - [x] **DONE and merged:** prepare `docs/support-safety-runbook-draft.md` with
        minimal-data intake, triage levels, authority boundaries, dry-run scenarios
        and owner/counsel approval gates. Owner approval is recorded; counsel review,
        named roles and dry-run testing remain.
- [x] **DONE:** use the owner-approved local-emergency wording and Find A Helpline
      for the global beta rather than an unreviewed country-specific list.
- [ ] Complete end-to-end staging checks for registration, journeys,
      assessments, result sharing, export, deletion, invitations and provider
      failures using synthetic data.
  - [x] **DONE and merged:** add same-origin CSRF validation for every TanStack
        server-function RPC before authentication/request handling; focused tests
        and a local request confirm the framework warning is resolved.
- [ ] Complete keyboard, screen-reader, reduced-motion and responsive checks on
      every public conversion path, then fix the findings.
  - [x] **DONE and merged:** check the fail-closed construction surface at 390 px,
        confirm there is no horizontal overflow, and raise the About and footer
        links to a 44 px minimum touch target.
  - [x] **DONE and merged:** move the login form into its own lazy route chunk,
        remove the route code-splitting warning and reduce the shared client entry
        from 297.44 kB to 242.49 kB gzip (about 18.5%).
  - [ ] Complete the normal landing, registration, login and guest-path browser
        pass on deployed staging, where construction-mode settings are available.
  - [x] **DONE and merged:** raise compact header, landing, registration,
        consent/safety, analytics-choice and guest recovery actions to the 44 px
        minimum; source-level tests protect these public touch targets.
  - [x] **DONE and merged:** browser-check the branded About and consent/safety
        pages for horizontal overflow and undersized links/buttons; neither page had
        a remaining control below 44 px at the tested desktop viewport.
  - [x] **DONE and merged:** raise shared inputs/selects to 48 px, every shared
        button size and select option to at least 44 px, and strengthen focus rings;
        the invite-code browser check measures 56 px for the input and 48 px for its
        action.
- [x] **DONE — commercial hold:** paid mode remains disabled. At 1,000 accounts,
      compare Stripe and Peach, then approve pricing, currencies, refunds, tax and
      checkout before enabling any provider.
- [x] **DONE:** external AI analysis will not launch initially. Any later opt-in
      beta requires a new approved processor, disclosure, data categories,
      consent, retention and credential review first.
- [ ] Approve production analytics only after the documented staging payload
      inspection passes.
- [ ] Create and approve a dedicated 1200 x 630 social-sharing image and verify
      link previews. The supplied kit contains square and portrait social
      artwork, but no image at the required preview ratio.
- [ ] Record final go/no-go approval against the exact deployed commit.

## Launch positioning and conversion decisions

- [x] Adopt a plain-language product glossary and update all user-facing copy.
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
  - [x] **DONE and merged:** extend the regression check to partner SMS and email
        notifications; replace the remaining assessment-heavy invite language and
        remove the stale promise of an `AI summary` from the completion email.
- [x] **DONE:** primary audience is adults from FetLife and wider kink
      communities; the product is 18+ everywhere.
- [x] **DONE:** launch is global and English-first, where lawful and technically
      supported; this is not a claim of jurisdiction-wide legal coverage.
- [x] **DONE:** brand voice is fun but clear, non-political and serious around
      consent, coercion, abuse, privacy and emergencies.
- [x] **DONE:** the primary conversion action is `Create an account`; guest use
      remains secondary.
- [x] **DONE:** the canonical landing page is `https://redflagdaddy.com/`.
- [x] **DONE:** owner approved the recommended public claims and
      product-limitations wording in `backlog-prioritization-report.md`, subject
      to counsel's final legal wording.
- [ ] Review the landing, registration, demo and upgrade paths against the
      approved audience and CTA; improve copy or friction where evidence supports
      it.
  - [x] **DONE and merged:** confirm account creation remains the primary landing
        action, guest mode is secondary, registration states 18+ and requires the
        consent/safety acknowledgement, and the demo is prominently synthetic and
        non-diagnostic.
  - [x] **DONE and merged:** confirm the upgrade route fails closed when commercial
        mode is disabled and presents no purchase action. Real staging behavior and
        owner copy review remain open.

## Marketing foundation

- [x] **DONE by owner confirmation:** public social/email accounts have
      owner-controlled MFA and recovery. Non-secret account inventory fields and
      backup operational roles still need completion.
- [x] **DONE as a safe template:** create `docs/production-account-inventory.md`
      with accountable owner, recovery contact, MFA, secret-location reference,
      billing and review fields. It deliberately contains no credentials and
      still needs the owner's account details.
- [x] **DONE:** owner supplied the CI branding kit with approved logo variants,
      colours, typography, social guidance, accessibility rules and tokens; the
      implementation notes and remaining gaps are in `docs/brand-implementation.md`.
- [x] **DONE and merged / owner approved:** safety and escalation runbook prepared;
      counsel review, named roles, Cloudflare support activation and synthetic
      scenario tests remain.
- [x] **DONE and merged:** create `docs/organic-content-tracker.md` with the first
      twelve content items plus approval, consent/privacy, accessibility, UTM,
      publishing, stop-condition and privacy-safe results fields.
- [ ] Record baseline followers, reach, visits, sign-ups and activations.
- [x] **DONE and merged:** create `docs/weekly-launch-scorecard.md` for aggregate
      funnel, reliability, support and organic-channel results, with small-cell
      suppression and explicit sensitive-data exclusions.

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

- [x] **DONE and merged:** four-week policy-aware organic content calendar in
      `docs/prelaunch-organic-content-plan.md`; publication remains blocked until
      the go-live decision and channel-by-channel rule recheck.
- [x] **DONE as approval drafts:** founder/mission introduction.
- [x] **DONE as approval drafts:** educational boundary, limits and safeword
      posts; expand the green-flag series after owner review.
- [x] **DONE as approval drafts:** weekly community questions that explicitly
      avoid private disclosures.
- [x] **DONE as approval drafts:** privacy and product-expectations post.
- [x] **DONE as approval drafts:** product walkthrough using synthetic data only.
- [x] **DONE as approval drafts:** hook and CTA experiments that change one
      variable at a time.
- [x] **DONE as approval drafts:** scripts, accessibility notes and initial alt
      text in `docs/organic-launch-copy-drafts.md`; final channel-native assets,
      captions, shot lists and thumbnails still need to be produced from the
      now-supplied brand kit and approved individually.
- [ ] Exact human approval for every final asset, caption, link, account and
      scheduled time.
- [ ] Results recorded after 24 hours and seven days.
- [ ] Pilot report covering winning pillars, formats, conversion quality,
      workload, moderation risks and next experiments.

## Measurement and attribution

- [x] Canonical organic-social UTM allow-list implemented for FetLife, Reddit,
      X, TikTok, Instagram, Threads and YouTube.
- [x] First-touch attribution limited to the current browser tab.
- [x] Anonymous funnel events implemented without user IDs or product content.
- [x] Opt-out clears stored attribution and once-only markers.
- [ ] Verify every UTM and event in staging with synthetic users.
- [x] **DONE:** approve the 35-day analytics retention period and consent copy,
      subject to the staging payload and consent-behaviour inspection.
- [ ] Enable production analytics only after explicit owner approval.
- [ ] Use activation quality, not clicks alone, to judge campaigns.

## Next product and marketing improvements

- [x] **DONE and merged:** add an administrator-controlled construction mode using
      the existing app settings system.
  - Add a clearly labelled, confirmed toggle in Admin Settings, record who
    changed it and when, and make changes take effect without a deployment.
  - While enabled, replace the normal public landing conversion area with the
    supplied `Under Construction — We'll be back soon` artwork and equivalent
    HTML text for accessibility; remove Sign in, Start a journey and Continue
    as guest entry points.
  - Enforce the mode on the server as well as the interface so direct visits to
    public login, registration, guest creation and journey-creation endpoints
    cannot bypass hidden buttons.
  - [x] **DONE:** block new journeys without destroying or modifying existing
        data; issued partner assessment and completed-report links remain usable.
  - Make `/admin` the private administrator entry. When signed out it should
    present a dedicated admin login, then verify server-side admin membership
    before showing any controls; the unlisted URL is not itself a security
    boundary.
  - Allow authenticated administrators to bypass construction mode and provide
    a prominent `Return to construction page` action.
  - Prevent accidental lockout with a confirmation step, a verified admin
    bypass, a tested recovery procedure and a fail-safe for settings lookup
    errors.
  - Return appropriate no-index and maintenance responses, keep private paths
    out of analytics, and test cached pages so mode changes are reflected
    promptly on Cloudflare.
- [x] **DONE and merged, disabled pending provider setup:** re-enable email and
      selected social sign-in directly through Supabase Auth; do not introduce
      Clerk for the current product.
  - [x] **DONE and merged:** disabled-by-default email, Google and Apple interfaces,
        safe callback handling, consent gating and authenticated method-linking.
  - [x] **DONE:** provider credential origins and activation steps documented in
        `docs/auth-provider-setup-guide.md`.
  - Activate passwordless email first and Google second. Add Apple only after
    the paid developer membership and secret-rotation process are ready.
    Consider Facebook only after audience evidence justifies its additional
    provider setup and review burden.
  - Keep phone sign-in available and present all methods on one clear sign-in
    surface. Treat delivery channels and login identities separately so the
    same phone account is not accidentally duplicated.
  - Add WhatsApp OTP as the first messaging alternative to SMS if provider cost
    and availability are acceptable. Supabase currently supports WhatsApp phone
    auth through Twilio and Twilio Verify; keep SMS as a fallback and do not
    reveal whether a phone number has an account. The current Clickatell help
    documentation says its WhatsApp authentication-template category is not
    supported, so budget and approve a suitable provider before implementation.
  - [x] **DONE:** official Meta account, sender, template, webhook and pilot setup
        documented in `docs/meta-whatsapp-business-setup-guide.md`; production
        integration remains held pending provider/legal identity decisions.
  - Treat Telegram as a separate optional identity, not an OTP channel. Its
    official website login uses a Telegram bot and signed authorization data,
    so it requires a reviewed identity bridge and explicit linking to the
    existing Supabase user. Schedule it only if audience research shows demand.
  - Do not implement Signal login or OTP delivery through unofficial clients,
    command-line bridges or device automation. Reconsider only if Signal
    publishes a supported service authentication API suitable for this use.
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
  - The existing phone records are test users and may be deleted before launch.
    Keep the explicit account-linking flow for future real phone users; never
    assume an OAuth login is the same person based only on an email or display
    name.
  - Let a signed-in user add and review login methods from Profile, prevent
    removal of their final usable method, and verify deletion removes the Auth
    user and all linked identities.
  - Preserve the existing Supabase user ID, RLS ownership, admin membership,
    journeys and payments when linking a new identity.
  - Cover new signup, returning login, cancellation, denied consent, duplicate
    email, existing phone-account linking, admin login, logout and account
    deletion with staging tests before release.
- [x] **DONE and merged:** add a purely anonymous guest-journey option with no phone
      number, email or account.
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
    exposing it to the partner or creating an account.
  - Store only a strong hash of the owner code, use enough random entropy,
    rate-limit lookups, keep routes out of search indexes and never include the
    code in analytics, logs or referrers.
  - [x] **DONE:** display and enforce the owner-approved 30-day anonymous
        journey/report expiry and automatically delete expired records.
- [x] **DONE and merged:** redesign administration as a dedicated, readable
      workspace.
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
- [x] **DONE and merged:** standardise all seven mobile-number inputs on one
      international phone component (sign-in, registration, account journey,
      account resend, guest journey, guest resend and partner invitation).
  - Silently use Cloudflare's request country hint to preselect the likely
    country; do not call an external IP-geolocation service or store the IP or
    inferred country.
  - Fall back to South Africa when the country hint is absent or unsupported,
    and always let the user change the country.
  - Normalise valid numbers to E.164 before validation, storage, rate limiting
    or SMS delivery, while displaying a familiar national format during entry.
  - Keep detection failure invisible and non-blocking, and cover country
    selection, international input and E.164 output with regression tests.
- [ ] Add a private shared discussion workspace after results are available.
  - [x] **DIRECTION APPROVED:** keep this after paid mode. Detailed data rules
        below still require a workshop before implementation.
  - Generate an explicitly shared, expiring page with side-by-side or
    differential scores and the existing conversation prompts.
  - Let either person mark a topic as `Discussed`, `Still open` or `Parked`, and
    add short shared notes.
  - Make authorship and edit history clear, define whether either person may
    edit or delete the other's notes, and prevent private answers from leaking
    into the workspace.
  - Require a deliberate owner sharing action, revocation and expiry controls;
    keep the workspace out of search, analytics payloads and notifications.
  - Position this as a negotiation aid, not chat, surveillance, moderation or
    proof that a person or dynamic is safe.
- [ ] Support progressive, multi-stage journeys.
  - Offer a light first-contact assessment that can lead to a deeper or
    category-focused follow-up, immediately or after a chosen cooling-off
    period.
  - Let the owner compare stages and see how scores and recurring themes change
    without implying that a higher score guarantees safety.
  - Support renegotiation journeys after a limit was approached or an
    experience went badly, with contextual safety guidance rather than an
    automated verdict.
  - Define stage ownership, expiry, reminders, deletion and whether a partner
    must explicitly consent before prior answers are carried forward.
  - Include short post-conversation and post-scene reflection stages covering
    what landed well, what felt wrong and what each person wants to adjust.
  - Place reflections beside the original journey only with clear ownership and
    sharing controls; never treat one person's reflection as an objective fact
    about the other person.
- [ ] Add a results-assisted scene and negotiation planner.
  - Create an editable draft containing user-selected intensity, required
    check-ins, disclosed hard and soft limits, aftercare notes and a concise
    negotiation checklist.
  - Use answers to surface topics for confirmation, never to infer consent,
    prescribe intensity or recommend an activity. Require both people to review
    the current plan and make clear that consent can be changed or withdrawn at
    any time.
  - Let the owner remove fields, add context and preview a private, expiring or
    downloadable document before sharing it.
  - Keep version history and authorship clear, and visibly mark a plan as stale
    whenever a linked limit, pause protocol or aftercare preference changes.
- [ ] Add a living, shared limits map.
  - Let each person classify their own items as `Hard limit`, `Soft limit`,
    `Curious` or `No`, with an optional note and effective date.
  - Never allow one person to set or edit the other's limits. Highlight changes
    without exposing undisclosed private answers, and require fresh review
    before an updated map is used in a scene plan.
  - Offer a lightweight renegotiation journey when something changes, while
    avoiding reminders or interface language that pressures a person to soften
    a limit.
  - Provide version history, export, unlinking and deletion controls, and treat
    silence or an old status as no evidence of current consent.
- [ ] Add an aftercare protocol builder.
  - Use a short wizard for physical, emotional and practical preferences,
    timing, check-ins, accessibility needs and what to avoid.
  - Surface relevant assessment topics as questions rather than automatically
    filling preferences, then let each person confirm what may be shared.
  - Support private drafts, shared versions and version history, with a clear
    reminder that an aftercare plan is not medical or emergency advice.
- [ ] Add a safeword and pause-protocol library.
  - Provide editable traffic-light systems, `pause`, `check-in` and `stop`
    scripts, plus non-verbal and accessibility-friendly signals.
  - Let users attach a reviewed protocol to a journey or scene plan and keep a
    plain-language emergency-stop action prominent.
  - Do not imply that a safeword replaces ongoing consent, observation,
    preparation or an agreed response when someone cannot communicate.
- [ ] Add an editable working-agreement generator.
  - Turn owner-selected results and notes into a draft covering roles,
    boundaries, safewords, renegotiation cadence and aftercare expectations.
  - Support private drafts, redacted export, version history and optional
    `Reviewed by both` acknowledgements with timestamps.
  - Label the output as a conversation record rather than a legal contract,
    proof of consent or waiver; acknowledgements never override withdrawal of
    consent or changed circumstances.
- [ ] Add redacted and selective result-sharing controls.
  - [x] **DONE and merged:** add a complete private Markdown download and a
        `Topics only` preset that omits scores, readiness, overall notes, contact
        details, raw answers, bearer links and timestamps.
  - [x] **DONE and merged:** generate both Markdown files entirely in the browser;
        do not upload or retain the export and do not add owner export controls to
        public shared-report pages.
  - [x] **DONE and merged:** add a versioned private JSON report for personal
        archives and knowledge tools. It is generated on-device and omits contact
        details, raw answers, bearer links, access tokens and generation timestamps.
  - Provide one-click presets for conversation prompts only, selected score
    dimensions, and an owner-reviewed custom selection.
    - [x] **DONE and merged:** add an owner-reviewed selective Markdown export for
          Safety, Consent, Communication, Compatibility, Green flags and Potential
          red flags. Nothing is selected by default, and only reviewed dimensions
          are included.
  - Generate privacy-conscious PDF and Markdown exports that omit names,
    contact details, raw answers, hidden dimensions, private notes and bearer
    tokens unless each field is deliberately included.
  - Make all shared links time-limited, revocable and clearly labelled with
    their included content and expiry before the owner confirms sharing.
  - Test every preset for accidental disclosure and preserve a private owner
    report that is never altered by redaction choices.
- [ ] Add a practical post-results action layer.
  - [x] **DONE and merged:** offer `Schedule a conversation` with a downloadable
        `.ics` calendar invite generated entirely on the user's device; no calendar
        provider connection or external permission is required.
  - Offer direct Google and Outlook connections only when the additional
    permissions and provider setup are justified.
  - [x] **DONE and merged:** use the discreet default title `Private conversation`
        and allow the owner to edit it before download. No journey name, scores,
        report details, private answers or bearer tokens are included by default.
  - [x] **DONE and merged:** keep extracted discussion topics off by default and
        include them only after explicit owner opt-in; topic content is bounded and
        excludes readiness rationale, overall notes and raw answers.
  - [x] **DONE and merged:** preview the exact optional topics before export so the owner can review
        what will enter a possibly shared or lock-screen-visible calendar.
  - [x] **DONE and merged:** add warm but clear title presets such as `Consent Check-In`,
        `Aftercare Debrief` or `Negotiation Conversation`, while avoiding titles
        that expose sensitive details on a shared calendar or lock-screen preview.
  - [x] **DONE and merged:** let the owner select individual discussion topics rather than including the
        complete bounded topic set.
  - Generate short role-aware negotiation checklists or templates from the
    journey's approved prompts and answers, with clear non-diagnostic wording.
    - [x] **DONE and merged:** add an owner-only `Conversation plan` Markdown
          export built from open topics, with preparation, pause/stop, discussion
          and close-out prompts. It excludes scores, overall notes, timestamps and
          raw answers and states that it is not an agreement or proof of consent.
  - Show curated external resources contextually, using an approved source list
    and country-aware crisis information where appropriate.
    - [x] **DIRECTION APPROVED:** exact safety, consent and aftercare URLs still
          require editorial approval and review dates before publication.
- [ ] Add an optional `Soundtrack for this dynamic` experience.
  - [x] **DIRECTION APPROVED:** implementation waits for actual playlist URLs,
        titles and rights-cleared artwork.
  - Launch with editorially curated Spotify, Apple Music and YouTube Music
    links organised by user-selected role, journey theme and mood; possible
    concepts include `Negotiation Night`, `Aftercare Soft Landing`, `Primal
Energy`, `Green Flag Glow` and `Pause & Renegotiate`.
  - Let the user choose or adjust the mood before showing a playlist. If scores
    influence suggestions, explain the mapping and keep it gentle; never frame
    music as a reward, diagnosis or safety verdict.
  - Use ordinary provider deep links first so no answers, scores, archetypes,
    journey names or listening history leave RedFlagDaddy.
  - Keep playlist titles and cover art tasteful, discreet and suitable for
    lock-screen or recently played surfaces; do not default to explicit or
    shock-value content.
  - Review playlist content regularly for removed tracks, regional availability
    and lyrics that conflict with the consent and safety tone.
  - Consider optional account-connected playlist creation only after the static
    experience proves useful. Request the minimum provider scopes, never request
    listening history, make the exact playlist contents visible first, and let
    the user disconnect and delete stored tokens.
  - Offer a shared-listening action through a provider-supported collaborative
    playlist or listening-session link without promising cross-provider support
    or exposing private journey data to the music service.
- [ ] Add private, redacted visual vibe cards for completed journeys.
  - Build cards from a soft score-informed colour palette, approved archetype
    icons or illustrations, and one or two owner-selected conversation prompts.
  - Let the owner add a short affirmation, preview the exact card, remove names
    and sensitive dimensions, and save an image locally.
  - Keep public sharing out of the default flow, omit raw answers, access codes
    and bearer links, and ensure colour is not the only way scores are conveyed.
  - Optionally include the selected soundtrack link, but no auto-playing media,
    provider tracking pixels or sensitive journey labels in link metadata.
- [ ] Add interactive, consent-focused scenario walkthroughs.
  - Build short branching `What would you do if…` exercises from an approved
    subset of the question library for solo or together use.
  - Feed choices into conversation prompts, not scores, diagnoses, winner/loser
    outcomes or claims about how someone will behave in real life.
  - Let either person stop, skip or keep their answers private, and distinguish
    educational scenarios from emergency or crisis guidance.
- [ ] Add a lightweight mood and energy check-in.
  - Offer an optional traffic-light or small-scale pulse before or after a
    conversation, journey or planned scene.
  - Let each person control whether their check-in is shared and retained;
    provide an immediate `Pause` path without demanding an explanation.
  - Never turn check-ins into performance metrics, streaks, compliance scores,
    notifications to pressure the other person or evidence of consent.
- [ ] Add optional owner-only journey milestones.
  - Use private, non-competitive milestones such as `First full assessment`,
    `Aftercare deep dive` and `Renegotiation complete` to acknowledge progress.
  - Never award badges for high scores, risk levels, sexual activity or another
    person's answers, and never show them to a partner without a deliberate
    sharing action.
  - Let the owner disable milestones entirely and avoid streaks, leaderboards,
    scarcity mechanics or prompts that pressure people to complete journeys.
- [ ] Add an owner-only journey history view for repeat journeys with the same
      person or dynamic.
  - Make grouping strictly opt-in instead of inferring identity from names,
    phone numbers, links, devices or response patterns.
  - Show a simple timeline of stage dates, score changes, limit revisions and
    recurring conversation themes, with controls to unlink, relabel, export or
    delete history.
  - Keep the view owner-only by default and require a separate deliberate
    sharing action for any history-derived content.
- [ ] Add lightweight, owner-only insights across the owner's completed
      journeys.
  - Summarise recurring high and low dimensions and common response patterns
    using only that owner's data.
  - Require enough completed journeys to avoid misleading conclusions, explain
    how each insight was produced and provide a way to hide or reset it.
  - Never benchmark against other users, build reputation scores or reuse this
    data for advertising, targeting or model training.
- [ ] Add secure journey-status notifications as an opt-in convenience.
  - Support non-sensitive email notifications first and consider encrypted push
    only if the value justifies the operational complexity.
  - Keep subject lines and notification previews discreet, include no answers
    or scores, and let users choose events and disable notifications easily.
- [ ] Add portable Markdown, JSON and redacted image exports for personal
      knowledge and creative tools.
  - Provide a documented, versioned structure that works with tools such as
    Notion, Obsidian and encrypted notes applications, including an optional
    dynamics-journal layout for the owner's reflections.
  - Let the owner review and selectively exclude identifying or sensitive
    fields before download; never transmit exports directly to third parties.
- [ ] Add per-journey and per-share data-expiry controls.
  - Let owners choose a clear automatic deletion date such as 7, 30 or 90 days,
    show what will be deleted and warn before expiry without exposing sensitive
    details in the notification.
  - Separate shared-link revocation from deletion of the private owner record,
    honour the earliest applicable retention promise and record deletion jobs
    without retaining deleted content.
  - Explain any records that cannot be deleted immediately for security,
    payment or legal reasons before the user confirms the timer.
- [ ] Evaluate a local-first or offline mode for especially sensitive journeys.
  - Treat this as a separate architecture and threat-model project, not an
    incidental interface feature.
  - Define device loss, shared-device exposure, encrypted storage, key recovery,
    conflict resolution and explicit encrypted sync before implementation.
  - Keep offline data off analytics, crash reports, backups and notifications,
    and let the user permanently delete the local copy.
- [ ] Add optional custom journey themes and conversation starters.
  - Offer subtle colour accents and approved icon sets based on user-selected
    roles or categories without changing score meaning or accessibility.
  - Provide an owner-controlled `Conversation starter` drawn from an approved
    high-value question set, with hide, refresh and disable controls.
- [ ] Evaluate passkeys as an optional higher-security sign-in method after the
      email and social authentication work is stable.
  - Keep a tested recovery path, support multiple registered passkeys and
    prevent removal of the final usable login method.
  - Preserve phone OTP as a supported option until adoption and recovery data
    justify a change.
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

## Product boundary: do not pursue by default

- [ ] Do not add ongoing partner monitoring, social-media analysis, device or
      location tracking, third-party reputation data, public ratings, covert
      risk scoring or background profiling.
  - Keep RedFlagDaddy focused on consent-led structured conversation,
    negotiation and user-controlled sharing.
  - Any future proposal that crosses this boundary requires a new explicit
    owner decision plus privacy, safety, abuse and legal review before design or
    implementation begins.
- [ ] Do not turn results into a shared scoreboard, public profile, competitive
      game, streak mechanic or social-media content feed.
  - Fun elements must remain optional, discreet and subordinate to consent,
    reflection and conversation.
  - Do not import follower data, social activity, location, contacts or
    listening history for personalisation.

## Later: privacy research candidates

- [ ] Research an opt-in aggregate community education pulse only after the app
      has sufficient scale and an independent privacy review.
  - Do not promise `fully anonymous` data. Define minimum cohort sizes,
    suppression rules, contribution limits, retention and whether formal
    privacy techniques are required before collecting anything.
  - Exclude free text, rare archetype combinations, locations, journey titles,
    contact details, precise dates and any result that could single out a person
    or small group.
  - Make participation separate, explicit and reversible; do not condition app
    features on consent or reuse product analytics consent.
  - Publish only approved educational patterns such as broadly useful
    conversation prompts, never leaderboards, partner comparisons, reputation
    data or claims about community safety.

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
