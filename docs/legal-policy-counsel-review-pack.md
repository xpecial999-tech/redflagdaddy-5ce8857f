# RedFlagDaddy legal and policy counsel review pack

Prepared: 28 August 2026
Status: Draft for qualified legal review — not approved public legal text

## Purpose

This document gives counsel one structured pack to review before RedFlagDaddy is
publicly promoted. It covers the proposed privacy notice, terms, acceptable-use
and safety policy, age approach, support procedure and retention schedule.

Please respond to every item marked **COUNSEL RESPONSE** with one of:

- **Approved**
- **Approved with the attached replacement wording**
- **Not approved**, with the required change and reason
- **Outside scope**, with the specialist or jurisdiction required

RedFlagDaddy will not describe this draft as legal advice or publish it as final
policy text until the review is complete.

## 1. Product facts counsel should rely on

- Service name: **RedFlagDaddy**. A separate legal entity has not yet been
  registered.
- Intended audience: adults aged 18+ in FetLife and wider kink communities.
- Intended availability: global, English-first, only where lawful and
  technically supportable.
- Core service: structured, role-aware questionnaires that help two people
  discuss consent, compatibility, safety practices, experience and potential
  warning signs.
- Primary path: account creation. A secondary guest path can create an anonymous
  journey without notification contact details.
- Account authentication: SMS currently; email magic link and Google are planned;
  Apple may follow. A phone or social login verifies control of that account, not
  legal identity, age, trustworthiness or safety.
- Journey invitations: private, expiring links or SMS messages. Anyone holding an
  active bearer link may be able to use it.
- Results: algorithmic scores and conversation prompts based only on submitted
  answers. The product does not perform background checks or risk prediction.
- Data sensitivity: responses may reveal sexual interests, roles, relationship
  preferences, boundaries, health-adjacent concerns or experiences of abuse.
- Analytics: first-party, consent-led funnel events; disabled by default;
  proposed and owner-approved retention is 35 days, pending payload verification.
- External AI analysis: disabled for the initial launch. No assessment content
  should be sent to an external AI provider.
- Payments: disabled. Reaching 1,000 registered accounts triggers a separate
  commercial and legal review; it does not activate charging.
- Hosting and core database/authentication: Cloudflare and Supabase.
- Communications: an official SMS provider; proposed Resend transactional email;
  `support@redflagdaddy.com` forwarded privately to an owner-controlled Gmail
  inbox through Cloudflare Email Routing.
- Public support is not continuously monitored and is not an emergency service.
- Journeys involving the same person are not linked across time.

**COUNSEL RESPONSE — Are any product facts incomplete or legally material facts
missing?**

Response:

## 2. Controller identity and launch geography

This is the first blocking issue. “RedFlagDaddy” is currently a brand/service
name rather than a registered legal entity. The repository must not publish the
founder's personal name. Counsel should advise what lawful interim controller,
contracting-party and contact wording can be used, or whether public launch must
wait for entity registration.

Please advise on:

1. The controller/service-provider identity required in the privacy notice and
   terms before a RedFlagDaddy entity exists.
2. Recommended country and entity of registration.
3. Whether the proposed “global where lawful” availability is defensible, or
   whether countries/regions should be blocked until reviewed.
4. South African POPIA obligations, Information Officer registration and PAIA
   documentation.
5. EU/EEA and UK applicability, representative requirements, lawful bases,
   special-category processing conditions and international-transfer measures.
6. Material US federal/state privacy, consumer, adult-content and platform-safety
   requirements, including treatment of users known or suspected to be minors.
7. Any other priority regimes based on likely initial users.

**COUNSEL RESPONSE — Required entity/controller wording and geographic limits**

Response:

## 3. Proposed public product boundary and prohibited claims

### Proposed public wording

> RedFlagDaddy is an adults-only structured conversation and reflection tool. It
> summarizes only the answers people choose to provide. It is not identity
> verification, a background check, risk prediction, diagnosis, proof of
> compatibility, safety or consent, or medical, legal or crisis advice. Consent
> is current, specific and revocable; no score, report or agreement replaces a
> direct conversation.

### Claims the business will not make

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

Owner approval: **APPROVED**, subject to counsel's final wording.

**COUNSEL RESPONSE — Claims boundary**

Response:

## 4. Privacy notice review specification

Counsel should return publishable plain-English text covering the following.

### A. Identity, scope and contacts

- Legal controller identity and address.
- Privacy and support contact route.
- Applicable representative and Data Protection Officer/Information Officer
  details, if required.
- Effective date, version and change-notice approach.

### B. Data map, purpose and proposed treatment

| Data group                 | Examples                                                                          | Purpose                                                           | Proposed basis/condition for counsel to determine                                  |
| -------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Account and authentication | Email or phone, provider subject ID, display name, role, session/security records | Create, secure and recover an account                             | Contract, legitimate interests and/or legal obligation; counsel to determine       |
| Journey setup              | Title, selected role/archetype, categories, optional partner name/phone/notes     | Create and deliver the requested journey                          | Contract/service delivery; assess third-party data implications                    |
| Assessment answers         | Answers about consent, limits, experiences, preferences and safety                | Generate private results and prompts                              | Explicit consent and any required special-category condition; counsel to determine |
| Results and sharing        | Scores, prompts, report state, private share token                                | Deliver results and optional sharing                              | Contract and user instruction; counsel to determine                                |
| Guest journeys             | Owner retrieval code, journey data and answers without an account                 | Provide anonymous-use mode                                        | User request/contract and consent; counsel to determine                            |
| Communications             | SMS/email destination and delivery status                                         | OTP, invitations and operational notices                          | Contract, user request and legitimate interests; counsel to determine              |
| Support                    | Reply email, category, message, optional non-secret journey ID                    | Answer requests, secure accounts and handle rights/safety reports | Legitimate interests, legal obligation and/or consent; counsel to determine        |
| Consent-led analytics      | Random session ID, approved funnel event, broad campaign attribution, environment | Measure launch usability                                          | Consent; disabled until accepted                                                   |
| Security and operations    | Rate-limit hashes, audit events, redacted errors and provider delivery metadata   | Prevent abuse, diagnose faults and protect the service            | Legitimate interests/legal obligation; counsel to determine                        |
| Payments, later only       | Entitlement and minimum provider transaction reference                            | Paid service and accounting                                       | Contract/legal obligation; out of initial launch scope                             |
| External AI                | None at initial launch                                                            | Disabled                                                          | A new review is required before activation                                         |

### C. Required disclosures and controls

- Exact purposes and lawful bases, including the condition for data revealing
  sexual life/orientation or other special-category/sensitive information.
- Whether one participant may lawfully provide another person's name, phone or
  information, and the notice/consent mechanism required.
- Recipients/processors and purposes: Cloudflare, Supabase, SMS provider,
  transactional-email provider, Google/Apple if enabled, Gmail support inbox and
  any operational monitoring provider.
- Processing countries, transfer mechanism and how safeguards can be obtained.
- Retention periods or criteria.
- Access, correction, deletion, restriction, objection, portability, consent
  withdrawal and complaint rights, with identity-verification safeguards.
- Automated processing explanation and whether the scoring has any legal or
  similarly significant effect. The intended answer is no.
- Cookies/local storage and the consent-led analytics mechanism.
- Security described accurately without absolute guarantees.
- How deletion affects active invitations, shared reports, provider logs and
  backups.
- How a person can report an exposed bearer link without disclosing the token in
  an email subject or analytics event.

**COUNSEL RESPONSE — Privacy notice**

Response or attached redline:

## 5. Terms of service review specification

Counsel should return publishable terms addressing:

1. Legal contracting party and acceptance.
2. Adults 18+ only; capacity to contract; territories where use is prohibited.
3. Accurate account/contact information and account security.
4. User responsibility for private invite/report links and recipient permission.
5. The product boundary in section 3 and the limits of scores/prompts.
6. Consent is specific, current and revocable; app content never substitutes for
   direct agreement.
7. User ownership/licence necessary to process their submitted content.
8. Privacy notice incorporation and deletion/export controls.
9. Suspension/termination, appeals or support contact, and treatment of data
   after closure.
10. Availability, changes and discontinuation.
11. Warranty disclaimers, liability limits and indemnity only to the extent
    enforceable and fair under applicable consumer law.
12. Governing law, venue/disputes and mandatory local consumer rights.
13. Future payment terms excluded until the commercial review.

### Proposed prohibited use

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

**COUNSEL RESPONSE — Terms and prohibited-use policy**

Response or attached redline:

## 6. Safety, abuse and emergency policy

The detailed operational draft is `docs/support-safety-runbook-draft.md`.

### Approved operating direction

- Support is not continuously monitored, an emergency service, a crisis line,
  an investigator or a relationship mediator.
- Immediate danger: direct the person to emergency services where they are now
  and offer Find A Helpline for verified local resources.
- Do not guess location from IP or publish a supposedly global emergency number.
- Revoke an exposed private link or secure an account after appropriate control
  checks.
- Preserve only necessary existing service evidence; do not request intimate
  media or ask a reporter to investigate.
- Do not promise a finding, ban, police report, rescue or guaranteed result.
- Disclosures to law enforcement/emergency services require a lawful approved
  process and reliable available information.
- Separate ordinary product support, privacy/account requests, exposed-link or
  stalking reports, credible threats and immediate-danger messages.

Owner approval: **PROCEDURE AND FIND A HELPLINE APPROVED**, subject to legal
review, named operational roles and successful dry-run testing.

### Response targets still requiring explicit confirmation

- Ordinary product/account support: proposed acknowledgement within two South
  African working days.
- Safety, stalking, exposed-link or privacy reports: proposed acknowledgement
  within one South African working day.
- Every public surface states that the queue is not continuously monitored.

**COUNSEL RESPONSE — Safety policy, legal-request process, mandatory reporting,
evidence handling and response wording**

Response:

## 7. Proposed retention and deletion schedule

The following are product defaults for review, not yet a final legal schedule.
“Delete” means removal from active systems followed by expiry from backups under
the approved backup cycle, unless a narrow documented legal hold applies.

| Record                                   | Proposed default                                                              | Earlier deletion/control                                | Counsel response |
| ---------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------- | ---------------- |
| Active account/profile                   | Until user deletion or 24 months inactivity                                   | User can request/delete account                         |                  |
| Account journey, answers and results     | 12 months after completion; open journeys reviewed separately                 | Owner can delete journey sooner                         |                  |
| Anonymous journey and result             | **30 days — owner confirmed**                                                 | Owner retrieval flow may delete sooner when implemented |                  |
| Unused/unfinished invite                 | Expire after configured invitation window; remove with journey                | Owner can revoke/delete journey                         |                  |
| Enabled shared-report link               | 7 days by default                                                             | Owner can revoke immediately                            |                  |
| On-device exports                        | Not retained by RedFlagDaddy                                                  | User controls downloaded copy                           |                  |
| Consent-led analytics                    | **35 days — owner approved**, pending staging verification                    | Consent can be refused; no event collection then        |                  |
| Application/error logs                   | 30 days, with secrets/private content redacted                                | Security deletion process                               |                  |
| Security and administrative audit events | 90 days                                                                       | Restricted access; legal hold only when documented      |                  |
| SMS/email delivery metadata              | 30 days unless provider/regulatory need requires longer                       | No message bodies or bearer links in logs               |                  |
| Email queue payload                      | Delete after successful delivery; expire transactional items after 60 minutes | Automatic queue deletion/expiry                         |                  |
| Routine support email/request            | 90 days after closure                                                         | Delete sooner if no operational/legal need              |                  |
| Confirmed security/privacy incident file | 12 months after closure, then review/delete                                   | Narrow legal hold when required                         |                  |
| Account-deletion verification record     | Minimal proof for 90 days                                                     | No exported account contents                            |                  |
| Backups                                  | Proposed maximum 35-day rolling cycle                                         | Deleted active data disappears as backups expire        |                  |
| Payment/accounting records               | Not applicable initially; later statutory period                              | Determined at payment launch                            |                  |
| Legal hold                               | Only scoped records for documented legal reason                               | Review at least every 90 days and release promptly      |                  |

Counsel should identify any category that must be shorter, longer, separated by
jurisdiction or supported by a specific lawful basis. Also confirm whether
warning before inactivity deletion is required or advisable.

**COUNSEL RESPONSE — Retention schedule**

Response or corrected table:

## 8. Age and minors

Current proposal:

- Clear 18+ positioning on landing, registration, guest creation and terms.
- An affirmative 18+ acknowledgement before account or guest journey creation.
- No collection of full date of birth unless counsel establishes a need and a
  proportionate privacy-preserving method.
- No marketing directed at minors.
- Suspend access and follow an approved deletion/escalation procedure when the
  service obtains credible knowledge that a user is under 18.
- Never request or accept sexual content involving minors.

Counsel should determine whether self-declaration is sufficient in each allowed
launch territory, whether neutral age assurance is required, and what minimum
evidence may be processed without creating a disproportionate identity-data
risk.

**COUNSEL RESPONSE — Age assurance and minor-data procedure**

Response:

## 9. Support inbox, privacy and security

Proposed setup:

- Public address: `support@redflagdaddy.com`.
- Cloudflare Email Routing forwards the alias to an owner-controlled Gmail inbox.
- The destination Gmail address is not published in application code or UI.
- First-party form is protected by Turnstile and rate limits.
- Form asks only for reply email, category, whether it concerns the reporter's
  account/journey, an optional non-secret journey ID and a short description.
- Form warns against passwords, OTPs, bearer links, intimate images, identity
  documents, raw assessment answers and another person's contact details.
- Form submission is delivered as operational email and is excluded from
  marketing/product analytics.
- MFA and recovery details are owner-controlled and confirmed.

Counsel/security reviewer should decide whether a consumer Gmail inbox is an
acceptable temporary support system for this sensitivity and volume, including
processor terms, access controls, retention/deletion, data export, legal holds
and breach response. A dedicated helpdesk or business mailbox should replace it
when required by volume, staffing or compliance.

**COUNSEL RESPONSE — Support processing and temporary Gmail forwarding**

Response:

## 10. Security incident and rights-request decisions

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

**COUNSEL RESPONSE — Incident, disclosure and data-rights procedure**

Response:

## 11. Final counsel approval matrix

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

## 12. Requested output from counsel

1. A redline of this pack or written responses to every response field.
2. Publishable Privacy Notice, Terms and Acceptable Use/Safety Policy.
3. Approved retention table.
4. Confirmed controller identity and allowed initial territories.
5. Required registrations, representatives, contracts and processor terms.
6. A short list of launch-blocking legal work versus post-launch improvements.

## Reference starting points

These are issue-spotting references, not a substitute for jurisdiction-specific
advice:

- [UK ICO: what privacy information should be provided](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/the-right-to-be-informed/what-privacy-information-should-we-provide/)
- [UK ICO: writing a privacy notice](https://ico.org.uk/for-organisations/advice-for-small-organisations/privacy-notices-and-cookies/how-to-write-a-privacy-notice-and-what-goes-in-it/)
- [EU General Data Protection Regulation](https://eur-lex.europa.eu/eli/reg/2016/679/oj)
- [European Data Protection Board: data protection by design and default](https://www.edpb.europa.eu/sites/default/files/files/file1/edpb_guidelines_201904_dataprotection_by_design_and_by_default_v2.0_en.pdf)
- [South African Information Regulator](https://inforegulator.org.za/popia/)
- [US FTC: Children's Online Privacy Protection Rule](https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa)
- [Find A Helpline](https://findahelpline.com/about/)
