# RedFlagDaddy go-live gates

Public promotion stays paused until every blocking item below is complete. This
list covers product and marketing readiness only; hosting architecture remains
in the separate migration task.

## Completed in code

- Anonymous shared-report table enumeration removed.
- SMS bodies and bearer links removed from delivery logs.
- Public and SMS-producing flows rate-limited.
- Private routes redacted from error telemetry and marked `noindex`.
- Consent-led, first-party funnel analytics implemented and disabled by default.
- Public sitemap and canonical metadata added.
- Unsupported product, research, identity-verification and privacy claims removed.
- The public demo is clearly labelled as synthetic and non-diagnostic.
- External AI analysis is disabled by default behind an explicit server-side
  approval switch.
- Assessment submissions are restricted to their assigned visible questions,
  and answer values are validated before scoring.
- Account exports fail safely if incomplete, omit active bearer secrets and raw
  payment payloads, and account deletion checks every cleanup step.

## Blocking owner decisions and artifacts

- [ ] Approve primary audience, launch countries, brand voice, prohibited topics and CTA.
- [ ] Obtain appropriate legal review and publish a privacy notice and terms for the approved jurisdictions.
- [ ] Approve a public support contact and an owner-run abuse, threat, stalking, self-harm and emergency escalation procedure.
- [ ] Approve named local crisis/emergency resources for each launch country; until then, keep guidance generic.
- [ ] Approve the production analytics flag after staging payload verification.
- [ ] Approve the AI processor, questionnaire data categories, disclosure,
  retention and user-consent requirements before setting
  `AI_ANALYSIS_MODE=enabled`; a `LOVABLE_API_KEY` is also required.
- [ ] Approve price, currency, refund terms and live Peach Payments credentials; keep paid mode off until the production checkout and signed webhook are verified.
- [ ] Approve a brand kit and 1200×630 social-sharing image; the obsolete Lovable preview image has been removed.
- [ ] Confirm all public account handles, MFA, recovery codes and credential ownership.

## Required staging verification

- [ ] Apply all Supabase migrations in timestamp order before deploying matching app code.
- [ ] Complete the analytics checklist in `docs/marketing-analytics.md` with synthetic users.
- [ ] With synthetic answers, verify disabled mode sends no AI request; after
  owner and legal approval, verify enabled mode sends only the documented
  score bundle and high-risk answer digest.
- [ ] Test account registration, sign-in, sign-out and account deletion.
- [ ] Verify the account export includes safe payment history, excludes invite
  codes/share tokens/raw provider payloads, and fails without downloading a
  partial file when any source query errors.
- [ ] Test guest and account journey creation, invite expiry and single-use completion.
- [ ] Verify an assessment cannot submit an unassigned question, an invalid
  answer value or a completion request while a visible answer is still unsaved.
- [ ] Test owner results, explicit report sharing, sharing disablement and unauthorized access.
- [ ] Test SMS provider failure, rate-limit messages and log redaction.
- [ ] Complete a Peach sandbox checkout and verify payment ownership, amount/currency matching, signed webhook delivery, duplicate delivery and wrong-user checkout rejection.
- [ ] Verify sitemap, robots directives, canonical tags and `noindex` output on the deployed staging site.
- [ ] Run keyboard, screen-reader, responsive-layout and reduced-motion checks on every public conversion path.
- [ ] Record go/no-go approval with the exact deployed commit and migration set.
