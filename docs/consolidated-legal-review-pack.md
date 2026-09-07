# RedFlagDaddy consolidated legal review pack

Prepared: 7 September 2026
Status: consolidated draft for qualified legal/privacy review; not approved
public legal text

This document replaces the older split counsel-review notes for the next review
round. It reflects the current product direction: guest-first journeys, email
OTP authentication, staging-only testing, production under construction, and no
active SMS/Clickatell path.

## Requested counsel output

Please return:

1. Publishable Privacy Notice.
2. Publishable Terms of Service.
3. Publishable Acceptable Use and Safety Policy.
4. Approved retention and deletion schedule.
5. Confirmed controller/contracting-party wording and allowed initial
   territories.
6. Required registrations, representatives, processor terms, transfer wording
   and launch-blocking legal work.

For each section below, please respond with one of:

- Approved.
- Approved with replacement wording.
- Not approved, with the required change and reason.
- Outside scope, with the specialist or jurisdiction required.

RedFlagDaddy will not treat this document as legal advice and will not publish it
as final policy text until review is complete.

## Current product facts

- Service name: RedFlagDaddy.
- A separate RedFlagDaddy legal entity has not yet been registered.
- Intended audience: adults aged 18+ in FetLife and wider kink communities.
- Intended availability: global, English-first, only where lawful and
  technically supportable.
- Current staging URL: <https://staging.redflagdaddy.com>.
- Current production URL: <https://redflagdaddy.com>.
- Production is fully locked behind a Cloudflare Worker construction wall until
  staging, policy and launch gates pass.
- Core service: structured, role-aware questionnaires that help people discuss
  consent, compatibility, safety practices, experience and warning signs.
- Product position: a structured conversation aid, not identity verification,
  a background check, diagnosis, proof of consent, emergency response,
  relationship mediation or guarantee of safety.
- Primary journey: guest-first. A visitor can start a private journey, share the
  partner link, then optionally create/sign in to an account to save and track
  that journey.
- Authentication: email-only for the current staging path. Supabase sends a
  six-digit email OTP through Resend SMTP.
- SMS/Clickatell: removed from the current staging and initial-launch path.
  Historical SMS code and tables remain inactive only as legacy support.
- Journey invitations: private, expiring bearer links or copied invite codes.
  Anyone holding an active bearer link may be able to use it.
- Guest journeys: no email or phone number is required by default. Guest owners
  receive a private owner code for status/results access.
- Results: algorithmic scores and conversation prompts based only on submitted
  answers. Results must not be described as risk prediction or a decision about
  another person.
- Data sensitivity: responses may reveal sexual interests, roles, relationship
  preferences, boundaries, health-adjacent concerns or experiences of abuse.
- Analytics: first-party, consent-led funnel events only; disabled by default;
  proposed retention is 35 days, pending staging payload verification.
- External AI analysis: disabled for initial launch. No assessment content should
  be sent to an external AI provider.
- Payments: disabled. Reaching 1,000 accounts triggers separate commercial and
  legal review; it does not activate charging.
- Hosting and core database/authentication: Cloudflare and Supabase.
- Authentication email: Resend SMTP configured in Supabase.
- Support contact: `support@redflagdaddy.com`, forwarded privately through
  Cloudflare Email Routing.
- Support operations: RedFlagDaddy-Support currently holds routine support,
  backup support, incident decision-maker and recovery-code-holder roles.
- Support is not continuously monitored and is not an emergency service.
- Owner-approved service targets: ordinary support within two business days;
  privacy/safety reports within one business day. Public wording must not call
  these South African business days.
- Journeys involving the same person are not linked across time.

Counsel response:

## Controller identity and launch geography

This is a launch blocker. RedFlagDaddy is currently a brand/service name rather
than a registered legal entity. The repository and public product should not
publish the founder's personal name unless counsel says this is legally required
and unavoidable.

Please advise on:

1. Controller/service-provider identity required in the privacy notice and
   terms before a RedFlagDaddy entity exists.
2. Recommended country and entity of registration.
3. Whether “global where lawful and technically supported” is defensible, or
   whether countries/regions should be blocked until reviewed.
4. South African POPIA obligations, Information Officer registration and PAIA
   documentation.
5. EU/EEA and UK applicability, representative requirements, lawful bases,
   special-category processing conditions and international-transfer measures.
6. Material US federal/state privacy, consumer, adult-content and platform-safety
   requirements, including treatment of users known or suspected to be minors.
7. Any other priority regimes based on likely initial users.

Counsel response:

## Product boundary and prohibited claims

Proposed public wording:

> RedFlagDaddy is an adults-only structured conversation and reflection tool. It
> summarizes only the answers people choose to provide. It is not identity
> verification, a background check, risk prediction, diagnosis, proof of
> compatibility, safety or consent, or medical, legal or crisis advice. Consent
> is current, specific and revocable; no score, report or agreement replaces a
> direct conversation.

Claims the business will not make:

- Detects abusers, predators, deception or dangerous people.
- Verifies a person's identity, age, history, intentions or trustworthiness.
- Proves consent, safety, compatibility or legal agreement.
- Provides medical, psychological, legal, safeguarding or emergency advice.
- Is scientifically validated, clinically accurate or research-backed without
  specific substantiation and review.
- Guarantees confidentiality, anonymity, security, deletion or uninterrupted
  availability.
- Represents that a high score makes a person or activity safe, or that a low
  score establishes wrongdoing.

Counsel response:

## Privacy notice requirements

Please provide publishable plain-English privacy text covering:

- Legal controller identity and address.
- Privacy and support contact route.
- Applicable representative, Data Protection Officer or Information Officer
  details, if required.
- Effective date, version and change-notice approach.
- Purposes and lawful bases, including conditions for data revealing sexual
  life/orientation or other special-category/sensitive information.
- Whether one participant may lawfully provide another person's optional name or
  information, and what notice/consent mechanism is required.
- Processors and recipients: Cloudflare, Supabase, Resend, Gmail support inbox,
  Google/Apple if enabled later, future approved WhatsApp/SMS provider if any,
  and any operational monitoring provider.
- Processing countries, transfer mechanisms and how safeguards can be obtained.
- Access, correction, deletion, restriction, objection, portability, consent
  withdrawal and complaint rights, with identity/control-verification safeguards.
- Automated processing explanation and whether scoring has legal or similarly
  significant effect. The intended answer is no.
- Cookies/local storage and the consent-led analytics mechanism.
- Security wording that is accurate without absolute guarantees.
- How deletion affects active invitations, shared reports, provider logs and
  backups.
- How a person can report an exposed bearer link without disclosing the token in
  an email subject, analytics event or public channel.

### Data map for review

| Data group              | Examples                                                                 | Purpose                                                           | Proposed treatment for review                              |
| ----------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------- | ---------------------------------------------------------- |
| Account/authentication  | Email, provider subject ID, display name, role, session/security records | Create, secure and recover an account                             | Contract, legitimate interests and/or legal obligation     |
| Guest journey setup     | Title, selected role/archetype, categories, owner code                   | Create and recover a no-contact journey                           | User request/contract and consent                          |
| Account journey setup   | Title, selected role/archetype, categories, optional partner details     | Create and deliver requested journey                              | Contract/service delivery; assess third-party implications |
| Assessment answers      | Consent, limits, preferences, experience and safety answers              | Generate private results and prompts                              | Explicit consent and any special-category condition        |
| Results and sharing     | Scores, prompts, report state, private share token                       | Deliver results and optional sharing                              | Contract and user instruction                              |
| Communications          | Email destination and delivery status                                    | OTP, operational notices and future optional notifications        | Contract, user request and legitimate interests            |
| Support                 | Reply email, category, message, optional non-secret journey ID           | Answer requests, secure accounts and handle rights/safety reports | Legitimate interests, legal obligation and/or consent      |
| Consent-led analytics   | Random session ID, approved funnel event, broad campaign attribution     | Measure launch usability                                          | Consent; disabled until accepted                           |
| Security and operations | Rate-limit hashes, audit events, redacted errors, delivery metadata      | Prevent abuse, diagnose faults and protect service                | Legitimate interests/legal obligation                      |
| Payments, later only    | Entitlement and minimum provider transaction reference                   | Paid service and accounting                                       | Out of initial launch scope                                |
| External AI, later only | None at initial launch                                                   | Disabled                                                          | New review required before activation                      |

Counsel response:

## Terms of Service requirements

Please provide publishable terms addressing:

1. Legal contracting party and acceptance.
2. Adults 18+ only; capacity to contract; territories where use is prohibited.
3. Accurate account/contact information and account security.
4. User responsibility for private invite/report links and recipient permission.
5. Product boundaries and limits of scores/prompts.
6. Consent is specific, current and revocable; app content never substitutes for
   direct agreement.
7. User ownership/licence necessary to process submitted content.
8. Privacy notice incorporation and deletion/export controls.
9. Suspension/termination, appeals/support contact and data treatment after
   closure.
10. Availability, changes and discontinuation.
11. Warranty disclaimers, liability limits and indemnity only to the extent
    enforceable and fair under applicable consumer law.
12. Governing law, venue/disputes and mandatory local consumer rights.
13. Future payment terms excluded until commercial review.

Proposed prohibited use:

- Use by or directed at anyone under 18.
- Coercion, threats, stalking, harassment, impersonation or non-consensual use.
- Uploading or requesting intimate images, identity documents, passwords, OTPs
  or unnecessary third-party personal information.
- Sharing private links or results beyond the intended recipient.
- Doxxing, scraping, surveillance, reputation scoring or background checking.
- Illegal content or activity, exploitation, trafficking, or content involving
  minors.
- Circumventing access controls, rate limits, security, expiry or revocation.
- Malware, automated abuse, unsolicited promotion or interference with service.
- Treating an output as proof of consent, safety, diagnosis or wrongdoing.

Counsel response:

## Safety, abuse and emergency policy

Proposed operating direction:

- Support is not continuously monitored, an emergency service, crisis line,
  investigator or relationship mediator.
- Immediate danger: direct the person to emergency services where they are now
  and offer Find A Helpline for verified local resources.
- Do not guess location from IP or publish a supposedly global emergency number.
- Revoke an exposed private link or secure an account after appropriate control
  checks.
- Preserve only necessary existing service evidence; do not request intimate
  media or ask a reporter to investigate.
- Do not promise a finding, ban, police report, rescue or guaranteed result.
- Law-enforcement/emergency disclosures require a lawful approved process and
  reliable available information.
- Separate ordinary product support, privacy/account requests, exposed-link or
  stalking reports, credible threats and immediate-danger messages.

Suggested automatic emergency-boundary wording:

> RedFlagDaddy support is not continuously monitored and cannot provide
> emergency or crisis help. If anyone may be in immediate danger, contact the
> emergency service where they are now. For verified local helplines, visit
> https://findahelpline.com/. You do not need to wait for a reply from us.

Counsel should review mandatory reporting, lawful disclosure, preservation,
evidence handling and the public response-target wording.

Counsel response:

## Support handling

Current proposed setup:

- Public address: `support@redflagdaddy.com`.
- Cloudflare Email Routing forwards the alias to an owner-controlled Gmail
  inbox.
- The private destination address is not published in application code or UI.
- First-party support form is protected by Turnstile and rate limits once
  Turnstile is configured.
- Form asks for reply email, category, whether it concerns the reporter's own
  account/journey, optional non-secret journey ID and short description.
- Form warns against passwords, OTPs, bearer links, intimate images, identity
  documents, raw assessment answers and another person's contact details.
- Form submissions are operational support messages, not marketing/product
  analytics.
- Current operational role holder for support, backup, incident decision and
  recovery-code custody: `RedFlagDaddy-Support`.

Please decide whether a consumer Gmail inbox is acceptable temporarily for this
sensitivity and likely volume, including processor terms, access controls,
retention/deletion, data export, legal holds and breach response. A dedicated
helpdesk or business mailbox can replace it when required.

Counsel response:

## Proposed retention and deletion schedule

“Delete” means removal from active systems followed by expiry from backups under
the approved backup cycle, unless a narrow documented legal hold applies.

| Record                                   | Proposed default                                                              | Earlier deletion/control                                | Counsel response |
| ---------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------- | ---------------- |
| Active account/profile                   | Until user deletion or 24 months inactivity                                   | User can request/delete account                         |                  |
| Account journey, answers and results     | 12 months after completion; open journeys reviewed separately                 | Owner can delete journey sooner                         |                  |
| Anonymous journey and result             | 30 days                                                                       | Owner retrieval flow may delete sooner when implemented |                  |
| Unused/unfinished invite                 | Expire after configured invitation window; remove with journey                | Owner can revoke/delete journey                         |                  |
| Enabled shared-report link               | 7 days by default                                                             | Owner can revoke immediately                            |                  |
| On-device exports                        | Not retained by RedFlagDaddy                                                  | User controls downloaded copy                           |                  |
| Consent-led analytics                    | 35 days, pending staging verification                                         | Consent can be refused; no event collection then        |                  |
| Application/error logs                   | 30 days, with secrets/private content redacted                                | Security deletion process                               |                  |
| Security and administrative audit events | 90 days                                                                       | Restricted access; legal hold only when documented      |                  |
| Email delivery metadata                  | 30 days unless provider/regulatory need requires longer                       | No message bodies or bearer links in logs               |                  |
| Email queue payload                      | Delete after successful delivery; expire transactional items after 60 minutes | Automatic queue deletion/expiry                         |                  |
| Routine support email/request            | 90 days after closure                                                         | Delete sooner if no operational/legal need              |                  |
| Confirmed security/privacy incident file | 12 months after closure, then review/delete                                   | Narrow legal hold when required                         |                  |
| Account-deletion verification record     | Minimal proof for 90 days                                                     | No exported account contents                            |                  |
| Backups                                  | Proposed maximum 35-day rolling cycle                                         | Deleted active data disappears as backups expire        |                  |
| Payment/accounting records               | Not applicable initially; later statutory period                              | Determined at payment launch                            |                  |
| Legal hold                               | Only scoped records for documented legal reason                               | Review at least every 90 days and release promptly      |                  |

Counsel should identify any category that must be shorter, longer, separated by
jurisdiction or supported by a specific lawful basis. Please also confirm whether
warning before inactivity deletion is required or advisable.

Counsel response:

## Age and minors

Current proposal:

- Clear 18+ positioning on landing, registration, guest creation and terms.
- Affirmative 18+ acknowledgement before account or guest journey creation.
- No collection of full date of birth unless counsel establishes a need and a
  proportionate privacy-preserving method.
- No marketing directed at minors.
- Suspend access and follow an approved deletion/escalation procedure when the
  service obtains credible knowledge that a user is under 18.
- Never request or accept sexual content involving minors.

Please determine whether self-declaration is sufficient in each allowed launch
territory, whether neutral age assurance is required, and what minimum evidence
may be processed without creating a disproportionate identity-data risk.

Counsel response:

## Security incident and rights-request decisions

Please provide or approve:

- Definition and assessment threshold for a suspected personal-data breach.
- Notification decision owner and jurisdiction-specific deadlines.
- Information Regulator/supervisory authority and affected-person notification
  procedure.
- Law-enforcement and emergency disclosure validation process.
- Identity/control verification standard for access, deletion and correction.
- Procedure where one participant requests deletion of material authored by the
  other person.
- Procedure for subpoenas, preservation requests and legal holds.
- Record of processing, processor agreements and subprocessor review cadence.

Counsel response:

## Final approval matrix

| Deliverable                              | Approved version/date | Conditions or required changes | Reviewer |
| ---------------------------------------- | --------------------- | ------------------------------ | -------- |
| Controller/entity and launch territories |                       |                                |          |
| Privacy notice                           |                       |                                |          |
| Terms of service                         |                       |                                |          |
| Acceptable-use policy                    |                       |                                |          |
| Safety/emergency public policy           |                       |                                |          |
| Internal support/safety runbook          |                       |                                |          |
| Retention and deletion schedule          |                       |                                |          |
| Age assurance/minor-data procedure       |                       |                                |          |
| Cookie/analytics notice and consent      |                       |                                |          |
| Processor list and transfer disclosures  |                       |                                |          |
| Incident and breach procedure            |                       |                                |          |
| Support inbox/form processing            |                       |                                |          |

## Reference starting points

These are issue-spotting references, not a substitute for jurisdiction-specific
advice:

- UK ICO privacy notice guidance:
  <https://ico.org.uk/for-organisations/advice-for-small-organisations/privacy-notices-and-cookies/how-to-write-a-privacy-notice-and-what-goes-in-it/>
- EU General Data Protection Regulation:
  <https://eur-lex.europa.eu/eli/reg/2016/679/oj>
- European Data Protection Board data protection by design/default guidance:
  <https://www.edpb.europa.eu/sites/default/files/files/file1/edpb_guidelines_201904_dataprotection_by_design_and_by_default_v2.0_en.pdf>
- South African Information Regulator POPIA information:
  <https://inforegulator.org.za/popia/>
- US FTC COPPA rule:
  <https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa>
- Find A Helpline:
  <https://findahelpline.com/about/>
