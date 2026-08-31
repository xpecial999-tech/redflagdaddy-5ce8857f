# RedFlagDaddy support and safety runbook — counsel-review draft

**Status:** Owner approved the public contact, escalation approach, emergency
boundary and Find A Helpline on 28 August 2026. Service targets, named roles,
retention and legal wording remain pending; counsel should review the privacy,
abuse and emergency portions before public promotion.

RedFlagDaddy support is not an emergency service, crisis line, investigation
service or mediator. The objective is to protect accounts and private links,
give accurate product help, minimize sensitive data and direct urgent needs to
appropriate local services.

## Proposed public channel and service targets

- One first-party form and `support@redflagdaddy.com`, both feeding the same
  private ticket queue.
- Ordinary product/account support: acknowledge within two business days.
- Safety, stalking, exposed-link or privacy reports: acknowledge within one
  business day.
- The form and automatic reply must say the queue is not continuously monitored
  and must not be used for an emergency.
- Discord, social direct messages and personal accounts are not support channels.
  Move requests received there to the approved form without asking the person
  to repeat intimate details publicly.

## Minimum ticket fields

Required: reply email, category, short description, whether the request concerns
the reporter's own account or journey, and confirmation that the form is not
being used for an immediate emergency.

Optional only when needed: journey ID, ticket-safe screenshot and the URL of an
exposed RedFlagDaddy link. Tell users not to submit passwords, OTPs, intimate
photos, identity documents, full assessment answers, another person's phone
number, medical history or graphic descriptions.

Every ticket receives a reference number. Never put private link tokens, phone
numbers or message bodies into a ticket title, analytics event or public reply.

## Triage categories

### S0 — Immediate danger or active crisis

Examples: the reporter says someone is in immediate physical danger, an act of
self-harm is underway, or urgent medical help is needed.

1. Display or send the emergency boundary immediately; do not wait for a human
   ticket response.
2. Tell the person to contact the emergency service appropriate to their current
   location. Do not guess or publish one supposedly global emergency number.
3. Offer [Find A Helpline](https://findahelpline.com/) for verified local crisis
   and emotional-support options. It is a third-party directory with its own
   privacy practices, not a RedFlagDaddy service.
4. Do not provide counselling, attempt a risk score, promise rescue, contact an
   alleged subject, or ask the reporter to gather evidence.
5. Escalate internally to the designated RedFlagDaddy incident owner immediately
   if a human sees the ticket. Any
   disclosure to emergency services or law enforcement must follow the approved
   legal process and reliable available information; this draft does not
   authorize disclosure.

Suggested automatic wording:

> RedFlagDaddy support is not continuously monitored and cannot provide
> emergency or crisis help. If anyone may be in immediate danger, contact the
> emergency service where they are now. For verified local helplines, visit
> https://findahelpline.com/. You do not need to wait for a reply from us.

### S1 — Credible threat, stalking, coercion or exposed private access

1. Acknowledge within one business day and repeat the emergency boundary when
   relevant.
2. Verify control through the existing authenticated session or approved
   recovery process; never request an OTP.
3. Revoke the affected RedFlagDaddy share/invite link or secure the account when
   the reporter is authorized to request that action.
4. Preserve only the minimum existing service evidence permitted by the
   approved retention policy. Do not ask for intimate media or investigate the
   relationship.
5. Record the action, decision owner and reason. Escalate suspected unlawful
   conduct or disclosure requests to counsel; do not promise a ban, finding,
   mediation or police report.

### S2 — Privacy, account access or data-rights request

1. Secure the account or revoke the affected link first when authorization is
   clear.
2. Use the formal privacy-request workflow for access, correction or deletion;
   do not fulfill a data request from an unverified email alone.
3. Log a possible incident separately if data reached the wrong person. Notify
   the privacy/legal owner and follow the approved breach-assessment timeline.
4. Do not send report contents, phone numbers, tokens or raw provider payloads
   in ordinary email.

### S3 — Product support

1. Use a synthetic account to reproduce where possible.
2. Ask for the smallest diagnostic detail needed: browser/device class, rough
   time, ticket reference and non-secret journey ID.
3. Never ask for a password, OTP, bearer link, raw answers or another person's
   contact details.
4. Close with the action taken and a link to the relevant help article.

## Authority and dual-control proposal

- Designated RedFlagDaddy incident owner: the accountable role and only role
  authorized to approve exceptional disclosure or production-wide construction
  mode, subject to law and counsel.
- Support operator: may answer ordinary tickets, revoke a link at its verified
  owner's request and escalate; may not inspect private report contents by
  default or disclose user data.
- Technical operator: may secure an account, rotate a compromised credential,
  preserve approved logs and deploy an authorized fix; may not use production
  data for testing.
- Counsel/privacy reviewer: decides legal requests, breach notification and any
  disclosure outside ordinary user-directed service actions.

Until roles are assigned, the RedFlagDaddy account owner holds all four
responsibilities and should not delegate through shared credentials.

## Ticket handling and evidence rules

- Use least-privilege access and individual accounts with MFA.
- Keep an audit trail of ticket access, link revocation, account action, export
  and disclosure.
- Redact secrets from screenshots and notes. Store a reference to an existing
  server event where possible instead of copying a sensitive payload.
- Apply the owner-approved support and security retention periods. A safety
  label is not permission to keep a ticket forever.
- A legal hold must be narrow, documented, access-controlled and approved by
  counsel; ordinary support staff cannot create one informally.
- Never use support content for marketing, testimonials, model training or
  product analytics.

## Dry-run scenarios before launch

- A user reports a public shared-report link; verify ownership, revoke it and
  confirm that the old URL no longer works.
- An SMS goes to the wrong number; stop further delivery, revoke the invite,
  open a privacy incident and avoid repeating the number in ticket notes.
- A user cannot receive an OTP; recover without asking for the code or weakening
  account-linking protections.
- A person submits an immediate-danger message; confirm the automatic boundary
  and local-resource link appear before any support response.
- A deletion request arrives from an unverified address; confirm no data is
  disclosed or deleted until identity/control is verified.
- A social-media DM includes sensitive details; move the conversation to the
  private channel and remove local copies where platform controls allow.

Record the scenario, operator, time, result, defect and corrective action. Use
synthetic identities and content only.

## Remaining activation and review checklist

- [ ] **PARTIAL:** first-party form DONE and merged; configure and test Cloudflare
      forwarding to the private destination plus Turnstile before deployment.
- [ ] Approve or amend the two-business-day and one-business-day targets.
- [ ] Name the human roles and after-hours decision path.
- [ ] Approve ticket, incident and security-log retention with counsel.
- [x] **DONE:** owner approved the emergency boundary and Find A Helpline link
      for a global beta.
- [ ] Define the legal-request and exceptional-disclosure procedure.
- [ ] Test every dry-run scenario and publish only the user-facing portions.

## Reference reviewed 27 August 2026

[Find A Helpline](https://findahelpline.com/about/) says it is a ThroughLine
public service with verified helplines in more than 175 countries. Its linked
services are independent third parties, and users should review their privacy
practices before sharing personal information. Recheck the directory and legal
terms before launch and periodically thereafter.
