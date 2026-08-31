# Support form activation checklist

Updated: 28 August 2026

The support form is implemented locally at `/support`. The public address is
`support@redflagdaddy.com`; the private Gmail destination supplied by the owner
must remain in Cloudflare configuration and must not be committed to the
repository or displayed publicly.

## 1. Cloudflare Email Routing

- [ ] In the `redflagdaddy.com` zone, enable Email Routing.
- [ ] Add and verify the private Gmail destination supplied by the owner.
- [ ] Create an exact custom-address rule:
  - Custom address: `support@redflagdaddy.com`
  - Action: send to the verified private destination
- [ ] Keep catch-all disabled unless there is a separate approved reason for it.
- [ ] Send a normal email to `support@redflagdaddy.com` and confirm it arrives.
- [ ] Reply from the private inbox and confirm the intended public From/Reply-To
      behavior. Do not accidentally reveal an unwanted address.

## 2. Cloudflare Turnstile

- [ ] Create a Managed Turnstile widget for `redflagdaddy.com` and the staging
      hostname.
- [ ] Set the public build variable `VITE_TURNSTILE_SITE_KEY` to the site key.
- [ ] Add `TURNSTILE_SECRET_KEY` as an encrypted Worker secret.
- [ ] Set `TURNSTILE_EXPECTED_HOSTNAME=redflagdaddy.com` in production. Use the
      exact staging hostname in staging.
- [ ] Confirm `OTP_SECRET` is present because the form uses the shared hashed
      rate-limit service.
- [ ] Never put the Turnstile secret or `OTP_SECRET` in a `VITE_` variable.

## 3. Notification delivery

The form queues a transactional notification to `support@redflagdaddy.com`.
Cloudflare then forwards the alias to the private Gmail destination.

- [ ] Confirm the production transactional-email dispatcher is working.
- [ ] Submit a synthetic product-support request and confirm the email contains
      the reference, category, reply email, ownership context and message.
- [ ] Confirm no private Gmail destination appears in HTML, JavaScript, page
      source, analytics, logs or the repository.
- [ ] Confirm failures tell the user to email the public support alias and do not
      show a false success reference.

## 4. Safety and abuse tests

- [ ] Submit without Turnstile: rejected.
- [ ] Submit with a wrong-host Turnstile token: rejected.
- [ ] Submit more than five requests from one test IP in an hour: rate-limited.
- [ ] Submit more than three requests for one reply address in an hour:
      rate-limited.
- [ ] Enter content in the hidden bot field: rejected.
- [ ] Confirm the form never asks for a password, OTP, private link, intimate
      image, identity document, raw answers or another person's contact details.
- [ ] Run every synthetic scenario in `docs/support-safety-runbook-draft.md`.

## 5. Remaining owner/counsel gates

- [ ] Assign the support operator, backup, incident owner and recovery-code roles.
- [ ] Confirm the proposed one/two-working-day response targets before publishing
      them as a service expectation.
- [ ] Obtain counsel's response using `docs/legal-policy-counsel-review-pack.md`.
- [ ] Decide whether temporary Gmail forwarding is acceptable for the approved
      launch scope and retention policy.
