# RedFlagDaddy backlog and prioritization report

Updated: 31 August 2026

> Current working priorities now live in `docs/current-backlog.md`; current
> owner actions live in `docs/owner-input-checklist.md`. This longer report is
> retained as the detailed completion and decision history.

This is the detailed record of what RedFlagDaddy should ship, what needs
discussion, and what the RedFlagDaddy owner needs to provide. Public promotion
remains paused until the launch gates are approved and tested.

## Status at a glance

### Completed and merged

- Core account and guest assessment journeys.
- Role-aware questionnaires and compatibility, safety, red-flag, green-flag and
  experience scoring.
- Private results and deliberately enabled shared reports.
- SMS and email invitations with expiry and completion controls.
- Fixed header logo using a repository-owned asset.
- Restored visible SMS sending, success and error feedback.
- Replaced confusing public journey language such as `respondent` with
  `partner`.
- Payment and upgrade flow with server-side entitlement checks.
- User data export and account deletion controls.
- Safer assessment submission and scoring validation.
- Rate limits on public and messaging actions.
- Sensitive SMS bodies, access links and private routes removed from logs and
  telemetry.
- Synthetic demo report and more honest public safety and product claims.
- Privacy-safe funnel analytics implemented but disabled in production.
- External AI analysis placed behind a disabled-by-default approval switch.
- Canonical metadata, sitemap, robots controls and private-route `noindex`.
- Product, marketing, authentication and post-results ideas recorded and
  prioritised through merged PRs #14–#16.

### Merged core product foundations

These batches were integrated and merged through PR #15. Individual test counts
below are preserved as historical checkpoints; the final PR #16 integration
passed TypeScript, 149 tests across 32 files and the Cloudflare build.

1. **DONE — Construction mode and secure admin entry**
   - Admin toggle, audit record, dedicated `/admin` login and recovery path.
   - Blocks new public journeys while allowing existing private links to finish.
   - The production database fields exist, but construction mode is off.

2. **DONE — Dedicated administrator workspace**
   - Wider admin layout with overview, questions, categories, journeys,
     analytics and settings sections.
   - Clear admin-only entry and `Return to app` action.
   - Existing server and route-level administrator checks are preserved.

3. **DONE — International mobile-number inputs**
   - One consistent component across all seven mobile-number fields.
   - Silently uses Cloudflare's country hint, defaults to South Africa and
     allows manual country changes.
   - Converts valid numbers to international E.164 format without storing the
     browser IP or inferred country.

### Completed and merged; controlled staging release remains

**DONE — Anonymous owner-code journeys**

- No account, email address or phone number is required.
- The partner receives the ordinary journey link; the owner receives a separate
  high-entropy private lookup code.
- Only a secure hash of the owner code is stored.
- The code is not placed in URLs, browser storage, analytics or notifications.
- The owner can check waiting/in-progress status and view or print the completed
  report from the guest page.
- No-contact journeys do not create an SMS notification or public report link.
- A disclosed 30-day expiry and automatic deletion process are included.
- Full local validation passes: type checking, 73 automated tests, focused
  linting and the complete Cloudflare production build.
- The database migration is merged and remains unapplied until the matching
  application is released through controlled staging.

**DONE — Disabled-by-default email and social authentication preparation**

- Passwordless email, Google and Apple sign-in interfaces are implemented.
- Existing phone users can link approved methods from their authenticated
  profile before using them to sign in, protecting account ownership and
  journey history.
- The authentication callback uses an allow-listed destination and is marked
  `noindex` with a no-referrer policy.
- Administrator sign-in remains SMS-only.
- New email registration requires the checked 18+ and consent statement.
  Google and Apple callbacks now stop at a dedicated confirmation gate when the
  account lacks the current acknowledgement; a provider identity is explicitly
  not treated as proof of age, identity or safety.
- Each method and the linking screen require an explicit `enabled` feature flag;
  all remain invisible and inactive by default.
- A provider rollout and dry-run guide is included. The clean auth release
  workspace passes type checking, 16 test files / 73 tests, focused linting and
  the full Cloudflare production build.

**DONE — Combined weekend dry-run gate**

- Construction mode, administrator workspace, international phone inputs,
  anonymous journeys and authentication preparation were integrated and merged
  through PR #15.
- The combined application passes type checking, the automated suite, behavior
  and safety linting, and the full Cloudflare production build.
- Main public and protected entry routes responded successfully in the validated
  application build.
- A dedicated `weekend-dry-run.md` runbook records the staging sequence,
  expected behavior, stop conditions and completion record.
- Production-like visual and provider checks remain for Cloudflare staging.

**DONE — Confirmed launch-position copy preparation**

- The public landing and About-page primary actions now say `Create an account`;
  guest use remains the secondary choice.
- The landing safety boundary now explicitly excludes identity verification,
  background checks, diagnosis, proof of consent, emergency response and safety
  guarantees.
- A regression test protects CTA order and the key limitations from accidental
  removal.
- Partner SMS and email templates are now covered by the plain-language
  regression guard. Invite copy uses `check-in`, and completion copy no longer
  promises an `AI summary` while external AI is disabled.
- The change passed the combined type, test, lint and Cloudflare build gates and
  merged through PR #16.

**DONE — Privacy-first Markdown export foundation**

- Owners can download a complete private Markdown report directly to their
  device when report downloads are available.
- A second `Topics only` preset deliberately excludes all scores, readiness
  labels and the overall report, retaining only open conversation topics.
- Exports omit contact details, bearer links, raw answers and generation
  timestamps, use filesystem-safe names and repeat the product's consent and
  safety boundary.
- Export generation is entirely client-side; RedFlagDaddy does not upload or
  retain the generated file, and public shared-report pages do not expose the
  owner export controls.
- Pure export tests cover redaction, score bounding, disclaimers and filenames.
  The combined app passes type checking and focused linting.

**DONE — Versioned private JSON export foundation**

- Owners with report-download access can save the full private report as a
  structured `redflagdaddy.private-report.v1` JSON file for personal knowledge
  tools and private archives.
- Scores are bounded and the documented export omits contact details, raw
  answers, bearer links, access tokens and generation timestamps.
- JSON creation and download happen entirely in the browser; no provider,
  upload, credential or new server-side retention is introduced.
- Focused tests cover the schema marker, score normalization, section mapping,
  disclaimer, safe filename and omission of operational/access fields.
- PDF, complete Markdown, topics-only Markdown and JSON now live behind one
  keyboard-accessible `Export` menu instead of crowding the mobile results
  action bar with four separate controls.

**DONE — Combined launch-hardening cleanup**

- Replaced all 35 deprecated TanStack server-function validator calls with the
  supported API without changing their validation rules.
- Removed the 16 remaining unsafe explicit-`any` lint errors from administrator,
  email-queue, auth-webhook and SMS-status paths.
- The SMS delivery callback now validates unknown JSON shapes, bounds stored
  provider values and ignores malformed events instead of trusting the payload.
- The email webhook validates its verified payload shape, and malformed queue
  messages move to the dead-letter queue rather than reaching the provider.
- Added TanStack's same-origin CSRF middleware ahead of request handling for all
  server-function RPCs. A focused regression test protects the filter/order,
  and a local request returns successfully without the framework warning.
- Final integrated validation is green: TypeScript, 149 tests across 32 files,
  changed-file behavior lint with zero errors and the complete Cloudflare build.
  Four non-blocking Fast Refresh warnings remain in shared UI/template files.

**DONE — Privacy-first calendar invite foundation**

- Owners with report-download access can create a standard `.ics` calendar
  file for a follow-up conversation without connecting Google, Outlook or any
  other external account.
- The default event title is the discreet `Private conversation`; no journey
  name, scores, report text, contact details or access tokens are included.
- Conversation topics are excluded by default and added only after an explicit
  owner opt-in. Topic extraction is bounded and omits overall notes, readiness
  rationale and raw answers.
- The file is generated entirely on the device. Calendar escaping prevents
  user-controlled text from injecting extra event fields, and automated tests
  cover privacy defaults, opt-in content and duration limits.
- The dialog previews the exact optional topics before download so the owner
  can review what will enter a possibly shared calendar.
- Owners can deselect individual topics and choose from discreet title presets
  before generating the file.
- The combined app passes type checking, focused tests, linting and patch
  checks.

**DONE — Private conversation-plan export**

- Owners can download a Markdown negotiation checklist derived from the open
  concerns, risks and missing-information topics in their report.
- It includes preparation, pause/stop, topic-by-topic and close-out prompts,
  while excluding scores, overall notes, generation timestamps and raw answers.
- The file is generated on-device and clearly says it is not an agreement or
  proof of consent; consent remains specific, current and revocable.
- Focused tests protect the safety wording and privacy exclusions.

**DONE — Owner-reviewed selective dimension export**

- Owners can choose any combination of Safety, Consent, Communication,
  Compatibility, Green flags and Potential red flags for a private Markdown
  file; nothing is selected by default.
- Only selected sections and their applicable scores are included. Readiness,
  overall notes, raw answers, contacts, bearer links and timestamps are omitted.
- Selective, topics-only and conversation-plan files also omit the free-text
  journey title and partner role and use generic filenames, because a title or
  filename could itself contain identifying information.
- The exact selection and count are visible before the on-device download, and
  focused tests verify that unselected dimensions do not leak into the file.

**DONE — First static accessibility hardening pass**

- Added a reduced-motion fallback that effectively removes CSS and Framer
  Motion transitions when the operating system requests less motion.
- The public invite-code field now has an explicit accessible label, invalid
  state and linked error message.
- Login, registration, guest creation and alternative-auth errors are announced
  as alerts; successful email-link status is announced without interrupting the
  user.
- This is code-level hardening only. Manual keyboard, screen-reader, zoom and
  mobile checks on the deployed staging build remain a go-live requirement.
- A local 390 px browser pass found no construction-page horizontal overflow
  and confirmed the repository logo and construction artwork load. The About
  and footer links now meet the 44 px minimum touch-target size.
- Extracting the login form into its own lazy route chunk removes TanStack's
  route code-splitting warning and cuts the shared client entry from 297.44 kB
  to 242.49 kB gzip (about 18.5%). Normal conversion paths still need the
  deployed staging pass because local development correctly failed closed into
  construction mode without a service-role credential.

**DONE — CI branding-kit implementation foundation**

- Treated the owner-supplied CI kit as the current visual source of truth while
  keeping its documents subordinate to the approved product and safety plan.
- Confirmed the existing header logo and construction artwork exactly match the
  supplied masters; replaced the squeezed wordmark favicon with the approved
  emblem and added browser, Apple touch and install icon sizes.
- Mapped the application to the supplied palette and DM Serif Display, removed
  the off-brand cyan glow, and reduced glass/glow intensity.
- Consolidated results, demo, journey, dashboard, upgrade and admin states onto
  the approved Success, Caution, Danger and Info tokens without removing their
  labels or icons.
- Raised the responsive header lockup to the kit's 180 px minimum (240 px on
  wider screens) and aligned the 404 state with the approved emblem, direct
  recovery copy and touch-target guidance.
- Standardized shared inputs and select triggers at 48 px, all shared button
  sizes and select options at a 44 px minimum, and visible two-pixel focus
  rings. The rendered invite-code input/action measure 56 px and 48 px.
- Added regression tests for tokens, typography, icon dimensions and the web
  app manifest. A dedicated 1200 x 630 social preview, real-device icon checks
  and staging-wide contrast review remain open.

**DONE — Four-week organic launch content plan**

- Prepared a community-first calendar for FetLife, Reddit, X and reusable
  non-explicit social content, with three substantive themes per week.
- The plan prioritizes helpful participation, moderator permission and native
  educational content over repetitive product links or unsolicited messages.
- It includes the agreed audience, CTA, product boundary, privacy restrictions,
  first-party measurement rules and channel stop conditions.
- Current official FetLife, Reddit and X policy sources are linked for a final
  recheck immediately before publication. Publishing remains paused.

**DONE — First organic launch copy pack**

- Drafted the founder introduction, five-question check-in, limits framework,
  safeword/non-verbal safety post, privacy explainer, synthetic walkthrough,
  export feature and controlled launch announcement.
- Added four non-disclosure community questions, single-variable hook/CTA
  experiments, visual accessibility rules, draft alt text and an approval
  record for each eventual post.
- The pack lives in `docs/organic-launch-copy-drafts.md`; it is not approved,
  scheduled or published and contains no production user content.

**DONE — Support and safety runbook and intake foundation**

- Prepared a minimal-data intake and triage procedure for product support,
  privacy/account issues, exposed links or stalking, credible threats and
  immediate danger/crisis messages.
- The draft defines actions support may take, actions it must not take, proposed
  decision authority, audit/evidence rules and six synthetic dry-run scenarios.
- It uses a generic local-emergency boundary and the verified global Find A
  Helpline directory rather than guessing a universal emergency number.
- The owner approved the procedure, product boundary and global resource
  approach on 28 August 2026. The public form is DONE and merged. Cloudflare
  routing/Turnstile setup, named roles, retention approval and legal review
  remain.

**Final merged validation checkpoint:** TypeScript, 149 tests across 32 files,
changed-file behavior lint with zero errors and the complete Cloudflare-compatible
production build all pass.

## Proposed priorities

The concise remaining owner decisions and provider inputs are maintained in
`docs/owner-input-checklist.md`; it deliberately contains no secrets.

| Priority | Work                                                                     | Current state                                                                   | What blocks it                                                                                                                   |
| -------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| P0       | Deploy and test construction mode                                        | Merged in PR #15                                                                | Staging deployment, administrator test and production smoke test                                                                 |
| P0       | Deploy and test admin workspace                                          | Merged in PR #15                                                                | Staging deployment and admin-user testing                                                                                        |
| P0       | Deploy and test international phone inputs                               | Merged in PR #15                                                                | Staging deployment and real SMS tests                                                                                            |
| P0       | Deploy and test anonymous owner-code journeys                            | Merged in PR #15                                                                | Migration application and staging/production smoke test                                                                          |
| P0       | Complete launch regression and accessibility testing                     | Static pass DONE; deployed manual pass remains                                  | The above releases must be deployed first                                                                                        |
| P0       | Finalise legal, safety, support and launch positioning                   | Decisions recorded; policy approval remains                                     | Legal review, support inbox and approval of recommendations below                                                                |
| P1       | Configure and dry-run email, Google and Apple sign-in through Supabase   | DONE and merged, disabled                                                       | SMTP, OAuth credentials, Supabase provider setup and account-linking dry run                                                     |
| P1       | Official WhatsApp OTP with SMS fallback                                  | Account setup guide ready; feature held                                         | Legal business identity, provider choice, pricing, sender approval and a limited pilot; unofficial Baileys sessions are excluded |
| P1       | Per-journey expiry and time-limited sharing                              | Backlog                                                                         | Retention choices and warning policy                                                                                             |
| P1       | Selective/redacted sharing and Markdown/JSON exports                     | Local-file presets, selective Markdown and JSON DONE                            | Public link redaction and sharing-expiry policy remain                                                                           |
| P1       | Post-results negotiation checklist and private calendar file             | Calendar and checklist foundations DONE and merged; resource direction approved | Exact resource URLs, editorial review and staging QA                                                                             |
| P2       | Private shared discussion workspace                                      | Direction approved; deferred until paid mode                                    | Workshop sharing, authorship, editing, expiry and deletion rules                                                                 |
| P2       | Safeword/pause library and aftercare builder                             | Backlog                                                                         | Content and safety review                                                                                                        |
| P2       | Scene/negotiation planner and working agreements                         | Backlog                                                                         | Workshop consent model, stale-plan rules and disclaimers                                                                         |
| P2       | Reflection and progressive multi-stage journeys                          | Backlog                                                                         | Workshop ownership, carry-forward and retention rules                                                                            |
| P2       | Living limits map                                                        | Backlog                                                                         | Workshop sharing and deletion rules; no cross-journey identity linking                                                           |
| Hold     | Cross-journey history and owner insights                                 | Do not build yet                                                                | The owner has chosen not to link journeys involving the same person                                                              |
| P2       | Custom themes and private/redacted vibe cards                            | Preferred delight direction                                                     | Brand kit, privacy defaults and content design                                                                                   |
| P3       | Curated music and conversation starters                                  | Later                                                                           | Editorial review and proof that the core product is useful                                                                       |
| P3       | Scenarios, mood checks, milestones and passkeys                          | Later                                                                           | Post-launch evidence and separate design/security review                                                                         |
| Hold     | Offline/local-first mode and anonymous community insights                | Research only                                                                   | Dedicated architecture, threat model and privacy review                                                                          |
| Excluded | Monitoring, reputation data, location/social analysis and public scoring | Do not build                                                                    | Outside the agreed product boundary                                                                                              |

## Owner decisions received — 26 August 2026

### DONE — launch position

- Primary audience: adults from FetLife and wider kink communities.
- Launch model: global, English-first beta, available only where lawful and
  technically supported. This is not a claim of legal or crisis-service
  coverage in every jurisdiction.
- Minimum age: 18 everywhere. Age wording and enforcement remain a launch gate.
- Brand voice: fun but clear, non-political and never flippant about consent,
  coercion, abuse, privacy or emergencies.
- Primary public action: **Create an account**. Guest use remains a quieter
  secondary option.
- Canonical public URL: `https://redflagdaddy.com/`.
- Marketing starts organically in relevant communities and social channels.
  No unsolicited direct messages, scraping or paid promotion before the product
  and safety gates pass.

### DONE — product and platform decisions

- Use Supabase Auth rather than Clerk.
- Prepare passwordless email plus Google and Apple, while retaining SMS.
- Existing phone accounts are test accounts and may be deleted before the auth
  rollout; verify their exact IDs and export any needed test evidence first.
- The proposed 35-day privacy-safe analytics retention and consent wording are
  approved, subject to the staging consent test.
- Shared discussion workspaces move behind the future paid-product milestone.
- Journeys involving the same person will **not** be linked. Cross-journey
  history and insights therefore remain out of scope.
- Optional delight should start with custom journey themes and private or
  redacted vibe cards, not music.
- Paid mode must remain off. Reaching 1,000 registered accounts starts a pricing,
  refunds and payment-readiness review; it must not automatically begin charging
  users.

## Owner-approved policies pending implementation, testing or counsel review

### Product promise and limitations

Recommended public wording:

> RedFlagDaddy is an adults-only structured conversation and reflection tool.
> It summarizes only the answers people choose to provide. It is not identity
> verification, a background check, risk prediction, diagnosis, proof of
> compatibility, safety or consent, or medical, legal or crisis advice. Consent
> is current, specific and revocable; no score, report or agreement replaces a
> direct conversation.

**APPROVED by the RedFlagDaddy owner on 28 August 2026**, subject to counsel's
final wording. The prohibited claims below are also approved.

Do not market the product as detecting abusers, proving that a person is safe,
guaranteeing compatibility, or creating legally binding consent.

### Support and safety operations

- Launch with `support@redflagdaddy.com` and a first-party support form feeding
  one private ticket queue. Show a ticket/reference number. Do not use Discord
  for account, abuse or sensitive support because it exposes identity and
  conversation metadata to a community platform.
- Suggested target: acknowledge ordinary support within two business days and
  safety/abuse reports within one business day. Clearly say support is not
  continuously monitored and is not an emergency service.
- Triage reports as account/privacy, link abuse or stalking, credible threat,
  self-harm/crisis, and ordinary support. Revoke exposed links, block abusive
  actions/accounts and preserve only the minimum evidence allowed by the
  published policy. Do not promise investigation, mediation or a guaranteed
  outcome.
- If someone may be in immediate danger, direct them to local emergency services
  and a verified local helpline. Never assume a global emergency number. Use
  Find A Helpline as the global directory and add country-specific resources
  only after review.

### Privacy, terms and retention

- Before promotion, obtain privacy/technology counsel review of the Privacy
  Notice, Terms, Acceptable Use/Safety Policy, analytics notice, processor list,
  deletion process and age approach. AI-generated legal text is a drafting aid,
  not final legal approval.
- Proposed defaults: accounts remain until deletion or 24 months of inactivity;
  completed account journeys 12 months; anonymous journeys 30 days; revocable
  shared links 7 days; application logs 30 days; security/audit logs 90 days;
  analytics 35 days. Exports should be generated on demand and not retained by
  RedFlagDaddy. Legally required payment records are handled separately.
- Warn before automatic deletion where a verified contact method exists, and
  let an owner delete their account or journey sooner unless a narrow legal
  hold applies.

### Production account ownership

- RedFlagDaddy is the accountable service identity; every production service
  uses an individually assigned business login rather than a shared personal
  login.
- Use a password manager and phishing-resistant MFA/passkeys or hardware keys
  wherever supported. Keep two hardware keys for critical accounts when
  practical.
- Store recovery codes offline in an encrypted owner-controlled location. Keep
  a production-account register with owner, billing contact, MFA, recovery and
  least-privilege access; review it quarterly.
- Maintain one separately protected break-glass administrator and test recovery
  before launch without disabling normal MFA.

### Login, payments and external AI

- Do **not** use Baileys or another unofficial WhatsApp Web session for OTP. It
  adds session, account-ban and secret-handling risk to the login path. If
  WhatsApp OTP is trialled, use an official WhatsApp Business sender through
  Meta Cloud API or Twilio Verify, retain SMS fallback and start with a small
  monitored pilot.
- Keep external AI analysis disabled for the dry run and initial public launch.
  A later opt-in beta requires an approved processor and contract, explicit
  per-journey consent, exact disclosure of what leaves RedFlagDaddy, no contact
  details, no provider training, minimal retention, deletion controls and
  clearly non-diagnostic output. Replace the old Lovable AI gateway before any
  activation.

### Authorship and withdrawn consent

- Each person owns and may edit or delete only their own limits, notes and
  acknowledgements.
- Keep an append-only version record showing author and time; never silently
  overwrite the other person's contribution.
- Any changed or withdrawn limit immediately marks every dependent plan or
  agreement **stale — review required**. Both people must actively review a new
  version. Historic material is never evidence of current consent.

## Remaining workshops

1. **DONE:** product-limitations wording and prohibited claims approved.
2. **PARTIAL:** support address and safety procedure approved; form DONE and merged.
   Configure Cloudflare Email Routing and Turnstile, confirm response targets,
   deploy and test delivery.
3. Send `docs/legal-policy-counsel-review-pack.md` for review of the retention
   table, legal notices and global launch model.
4. **DONE:** owner-controlled MFA and recovery confirmed; finish the non-secret
   production account inventory.
5. Decide pricing, currency and refunds at the 1,000-account review; paid mode
   stays off before then.
6. Revisit official WhatsApp OTP only after email and social sign-in are stable.
7. Revisit external AI only after the non-AI launch is stable.
8. Later, workshop privacy controls and exports before the paid shared
   workspace.

## What RedFlagDaddy needs from its owner

### Needed before the next code releases

- Authenticate GitHub CLI so the five completed feature branches plus the
  launch-hardening/support batch can be packaged and pushed.
- Be available for short production checks after each deployment:
  administrator access, construction toggle, phone country selection and SMS.
- **DONE:** construction mode blocks new journeys while already-issued private
  journey and report links finish.
- **DONE:** anonymous journey expiry remains 30 days.

### Needed before public promotion

- **DONE:** primary audience, 18+ minimum, global English-first launch shape,
  brand voice, main CTA and canonical URL are recorded.
- **DONE:** recommended claims boundary and prohibited claims approved.
- Send `docs/legal-policy-counsel-review-pack.md` to counsel and obtain approved
  privacy notice, terms, safety policy and retention schedule.
- **PARTIAL:** support/escalation procedure approved and form DONE and merged;
  configure/test the Cloudflare forwarding rule and Turnstile.
- **DONE:** Find A Helpline and local-emergency wording approved.
- **DONE:** paid mode remains off until a 1,000-account commercial review.
- **DONE:** external AI remains disabled for initial launch.
- **DONE:** 35-day analytics retention is approved, pending staging verification.
- Brand kit and a 1200 x 630 social-sharing image.
- **DONE:** public social/email accounts have owner-controlled MFA and recovery
  details.

### Needed only when those features are prioritised

- **Guides ready:** production SMTP credentials come from the selected
  transactional email provider; Google and Apple credentials come from their
  developer consoles. Use `docs/auth-provider-setup-guide.md`.
- **Guide ready / held:** create only official Meta or Twilio WhatsApp assets and
  a capped pilot budget. Baileys credentials will not be accepted for production
  authentication. Use `docs/meta-whatsapp-business-setup-guide.md`.
- **Held:** Peach Payments credentials are not required. Compare Stripe and
  Peach at the later commercial review.
- **Direction approved:** contextual safety, consent and aftercare resources.
  The exact URLs still require an editorial owner, review date and final
  approval before they appear in the app.
- **Direction approved:** curated playlist links and artwork. Actual links,
  titles and rights-cleared artwork are still required before implementation.
- **Direction approved / workshop still required:** shared workspace, limits,
  planning and history features. Decide authorship, edit/delete rights,
  withdrawal/stale markers, revocation, expiry and visibility before modelling
  sensitive shared data.

## Recommended next execution sequence

1. Re-authenticate GitHub and release the completed code batches one at a time,
   with a staging check after each and production only after the recorded gate.
2. Apply the anonymous-journey migration only with its matching application
   release, then complete its production smoke test.
3. Approve the remaining policy recommendations, then turn them into public copy
   and configuration with legal review where required.
4. Prepare email, Google and Apple sign-in behind disabled provider controls,
   then test account linking before activation.
5. Complete the full synthetic regression, accessibility, provider-failure,
   privacy and metadata checklist.
6. Record a go/no-go decision against the exact production commit and migration
   set.
7. Start the P1 privacy and post-results work only after the launch-critical
   path is stable.

## GitHub delivery record

| Release                      | Pull request | Merged main commit                         | Status          |
| ---------------------------- | ------------ | ------------------------------------------ | --------------- |
| Core product integration     | #15          | `2668e9781b1835e02110bf7512574fbc16e140ef` | DONE and merged |
| Application launch hardening | #16          | `925ea41991a7cf73edb54c0fc9a608dc2dd771e1` | DONE and merged |
| Documentation and operations | #17          | Based on PR #16 main                       | In progress     |

The earlier feature branches remain historical recovery points only. New release
work starts from the current remote main; it must not rebase or republish those
obsolete integration branches.

## Approved delivery order

1. Construction mode.
2. Admin workspace.
3. International phone inputs.
4. Anonymous owner-code journeys.
5. Email, Google and Apple sign-in.
6. Go-live verification and owner approvals.
7. Per-journey expiry, redacted sharing and exports.
8. Custom themes and private/redacted vibe cards.
9. Post-results privacy/actions; defer the shared workspace until paid mode.

## Policy references

- [Find A Helpline](https://findahelpline.com/) maintains verified local crisis
  resources across more than 175 countries.
- [Twilio Verify WhatsApp](https://www.twilio.com/docs/verify/whatsapp) requires
  an approved WhatsApp Business sender and supports SMS as a separate fallback
  channel.
- [ICO privacy notice checklist](https://ico.org.uk/media/for-organisations/documents/1625126/privacy-notice-checklist.pdf)
  is a useful drafting checklist; jurisdiction-appropriate legal advice is still
  required for a global service.
