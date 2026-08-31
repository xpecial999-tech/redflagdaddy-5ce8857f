# RedFlagDaddy owner action checklist

Updated: 31 August 2026

This is the ordered list of work that requires an owner-controlled account,
non-secret answer or external approval. Product code and documentation work that
Codex can complete alone is not listed here.

Never put passwords, recovery codes, API keys, OAuth secrets, MFA seeds or the
private support forwarding destination in Git or chat. Enter secrets directly in
the provider dashboard, Supabase or Cloudflare encrypted secret storage. Report
only completion and non-secret test results.

## Needed for the dry run

### 1. Public support routing

- [ ] In Cloudflare Email Routing, verify the private destination.
- [ ] Route only support@redflagdaddy.com to that destination; leave catch-all
      disabled.
- [ ] Send a normal test email and confirm arrival.
- [ ] Confirm replies use an acceptable public sender and do not unexpectedly
      expose the private destination.

### 2. Outbound transactional email

Cloudflare Email Routing receives and forwards email; it does not send the
support form notification.

- [ ] Confirm whether the migrated transactional-email queue can send a test
      message to support@redflagdaddy.com.
- [ ] If it cannot, create the recommended Resend account and sending subdomain
      using auth-provider-setup-guide.md.
- [ ] Use separate staging and production credentials.
- [ ] Report only: existing dispatcher works, Resend configured, or outbound
      email blocked.

### 3. Cloudflare Turnstile and staging origin

- [ ] Create a Managed Turnstile widget for the staging and production hostnames.
- [ ] Enter the public site key, encrypted secret and exact expected hostname in
      their respective environment configurations.
- [ ] Confirm the exact non-secret staging hostname.
- [ ] Set staging PUBLIC_SITE_URL to its exact HTTPS origin and production
      PUBLIC_SITE_URL to https://redflagdaddy.com.
- [ ] Do not send the Turnstile secret in chat.

### 4. Real SMS testing

- [ ] Confirm the official SMS provider and sender/integration label.
- [ ] Fund only a small, capped test balance.
- [ ] Ask whether the Clickatell integration can send authenticated delivery
      callbacks using separate HTTP Basic credentials.
- [ ] If supported, configure distinct staging callback credentials using
      clickatell-sms-callback-setup.md.
- [ ] If unsupported, leave callbacks disabled. SMS sending can still be tested.
- [ ] Report the provider, sender label and callbacks supported or callbacks
      unsupported; never send credentials.

### 5. Private operational roles

- [ ] Assign routine support operator.
- [ ] Assign backup support operator.
- [ ] Assign incident decision-maker.
- [ ] Assign recovery-code holder.
- [ ] Store assignments and recovery material privately, then report only roles
      assigned.

### 6. Response targets

- [ ] Approve or replace: ordinary support within two business days.
- [ ] Approve or replace: privacy or safety reports within one business day.
- [ ] Keep the public wording clear that RedFlagDaddy is not continuously
      monitored and is not an emergency service.

## Send these non-secret answers next

- [ ] Exact staging hostname.
- [ ] Support routing test result.
- [ ] Outbound transactional-email status.
- [ ] Turnstile configured: yes/no.
- [ ] SMS provider, sender label and callback support.
- [ ] Operational roles assigned: yes/no.
- [ ] Response targets approved or revised.

## Needed before public promotion

### Legal and policy review

- [ ] Send legal-policy-counsel-review-pack.md to a qualified privacy/technology
      lawyer for a quote and review.
- [ ] Ask counsel to resolve controller and contracting-party wording while
      RedFlagDaddy is not yet a registered legal entity.
- [ ] Obtain publishable privacy, terms, safety/acceptable-use and retention text.
- [ ] Confirm whether the global English-first launch needs geographic
      exclusions, representatives, registrations or transfer measures.
- [ ] Do not publish the draft counsel pack as final legal text.

### Ownership, analytics and presentation

- [ ] Complete the remaining non-secret fields in
      production-account-inventory.md and privately verify MFA/recovery.
- [ ] Inspect staging analytics payloads and approve final consent wording before
      enabling the approved 35-day production retention policy.
- [ ] Approve a dedicated 1200 × 630 social-preview image derived from the brand
      kit.
- [ ] Confirm official social-account handles, MFA and recovery privately.

## Needed only when optional authentication is activated

- [ ] Email magic links: verify a RedFlagDaddy sending subdomain with Resend or
      the selected SMTP provider and configure Supabase Auth. SMTP credentials
      come from that sender, not Cloudflare Email Routing.
- [ ] Google sign-in: create an owner-controlled Google Cloud project and OAuth
      web client, then enter its client ID and secret in Supabase.
- [ ] Apple sign-in: enroll in the Apple Developer Program and create the
      identifier and key. Defer until email, Google and SMS are stable.
- [ ] WhatsApp OTP: use official Meta or Twilio assets only. Do not use Baileys,
      unofficial Signal automation or a personal WhatsApp session for auth.

## Needed only when later features are prioritised

- [ ] Payments: at the 1,000-account review, compare Stripe and Peach for
      supported markets, adult-content policies, tax, refunds, disputes, payouts
      and cost.
- [ ] Contextual resources: approve the exact URLs and assign an editorial owner
      and review date.
- [ ] Music: provide the actual playlist URLs, titles and licensed or owned
      artwork.
- [ ] Shared workspace and living tools: workshop authorship, edit/delete rights,
      visibility, expiry, revocation and consent-withdrawal stale markers before
      data modelling.

## Decisions and access already complete

- [x] GitHub repository access is working through an isolated fine-grained token;
      it does not replace other GitHub CLI authentication.
- [x] PR #15 and PR #16 are merged.
- [x] Cloudflare migration is complete; the owner confirmed the
      redflagdaddy-xpecial999 account.
- [x] Adults 18+ only; global English-first launch where lawful and supported.
- [x] Primary audience is FetLife and wider kink communities; voice is fun,
      clear, non-political and serious around safety.
- [x] Create an account is primary; guest mode is secondary; canonical URL is
      https://redflagdaddy.com.
- [x] RedFlagDaddy is a structured conversation aid, not identity verification,
      a background check, diagnosis, proof of consent, emergency response or a
      guarantee of safety.
- [x] Supabase Auth remains the identity platform; Clerk is not required.
- [x] Existing phone accounts are test users and need no linking migration.
- [x] Construction mode blocks new journeys while issued private links continue.
- [x] Anonymous journeys expire after 30 days.
- [x] Support escalation procedure, local-emergency wording and Find A Helpline
      direction are approved.
- [x] Public-account MFA and recovery ownership are owner-confirmed.
- [x] Analytics retention direction is approved at 35 days; production still
      requires payload and consent review.
- [x] External AI is off for dry run and initial launch.
- [x] Paid mode is off; 1,000 accounts triggers review, not automatic billing.
- [x] Journeys involving the same person are not linked.
- [x] Vibe cards and custom themes are the first preferred delight features.
- [x] Shared workspace is deferred until paid mode.
- [x] Repository and public material use RedFlagDaddy or role names, never the
      owner's personal name.

## Free-to-paid tool order

1. Existing GitHub, Cloudflare and Supabase accounts.
2. Manual FetLife/social participation and Find A Helpline.
3. Cloudflare Email Routing and Turnstile free services.
4. Resend free tier for transactional and authentication email.
5. Google OAuth through Supabase; no separate identity platform.
6. Existing official SMS provider with a capped test balance.
7. Optional Buffer free tier after manual publishing establishes a baseline.
8. Twilio Verify only if current global OTP delivery or fraud controls are weak.
9. Apple Developer membership when Apple sign-in is scheduled.
10. Paid mailbox, helpdesk, analytics or infrastructure tiers only when measured
    volume justifies them.
11. Qualified legal/privacy review before public promotion.
12. Stripe-versus-Peach review only when commercial launch is scheduled.
