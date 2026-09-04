# RedFlagDaddy runtime configuration checklist

Updated: 29 August 2026

This is the non-secret inventory for Cloudflare staging and production. It does
not authorize deployment or provider activation. Use separate values for staging
and production, and store every secret through the encrypted platform secret
control rather than a plaintext variable or repository file.

## Handling labels

- **Public build value:** is intentionally included in browser code. It must never
  contain a private credential.
- **Plain server value:** is not a credential, but should still be controlled per
  environment.
- **Encrypted secret:** must be entered directly in the provider or Cloudflare
  secret store and must not be placed in Git, chat, screenshots or `VITE_`
  variables.

## Core application — required in staging and production

| Name                            | Handling           | Purpose                                            | Required check                                           |
| ------------------------------- | ------------------ | -------------------------------------------------- | -------------------------------------------------------- |
| `VITE_SUPABASE_URL`             | Public build value | Browser connection to the correct Supabase project | Staging and production point to different projects       |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public build value | Browser's restricted Supabase key                  | Must be the publishable/anon key, never service role     |
| `SUPABASE_URL`                  | Plain server value | Server connection to the correct Supabase project  | Must match the environment's browser project             |
| `SUPABASE_PUBLISHABLE_KEY`      | Plain server value | Auth middleware's restricted Supabase key          | Must be the publishable/anon key                         |
| `SUPABASE_SERVICE_ROLE_KEY`     | Encrypted secret   | Trusted server-only database operations            | Never expose to browser code or logs                     |
| `OTP_SECRET`                    | Encrypted secret   | OTP hashing and hashed abuse/rate-limit keys       | Unique, long and different per environment               |
| `PUBLIC_SITE_URL`               | Plain server value | Origin used in SMS/email invitation links          | Exact HTTPS origin only; staging must not use production |

`PUBLIC_APP_URL` is a temporary compatibility fallback only. Leave it unset once
`PUBLIC_SITE_URL` is configured and remove it from platform configuration after
the first successful staged release. If neither value is present, invitation
creation fails closed rather than silently generating a production-domain link.

## SMS — required for current login and notified journeys

SMS is suspended for the staging email-first release. Leave every `CLICKATELL_*`
value absent and set `VITE_AUTH_PHONE_MODE` to any value other than `enabled`.
Do not remove the historical SMS data tables or callbacks; they remain inactive
until an approved provider (such as WhatsApp through a supported provider) is
configured and tested.

| Name                           | Handling         | Purpose                                 | Activation rule                                 |
| ------------------------------ | ---------------- | --------------------------------------- | ----------------------------------------------- |
| `CLICKATELL_API_KEY`           | Encrypted secret | Sends OTP and journey SMS               | Required for real SMS tests                     |
| `CLICKATELL_CALLBACK_USERNAME` | Encrypted secret | Authenticates delivery-status callbacks | Set only if the integration supports Basic auth |
| `CLICKATELL_CALLBACK_PASSWORD` | Encrypted secret | Authenticates delivery-status callbacks | Must be set together with the callback username |

If either callback credential is absent, the callback deliberately returns
`503` and must remain disabled at the provider. SMS sending can still operate.

## Interim email-first authentication

| Name | Handling | Required staging value |
| --- | --- | --- |
| `VITE_AUTH_PHONE_MODE` | Public build value | Absent or `disabled` while Clickatell is not used |
| `VITE_AUTH_EMAIL_MODE` | Public build value | `enabled` after Resend SMTP is verified in Supabase |

With phone sign-in disabled, the app uses Supabase email magic links. Anonymous
owner-code journeys and copied private invite links remain available without a
messaging provider. Configure an administrator email identity before publishing:
the administrator entry accepts the same enabled email method and still checks
the existing administrator role after sign-in.

## Public support form

| Name                          | Handling           | Purpose                                    | Activation rule                              |
| ----------------------------- | ------------------ | ------------------------------------------ | -------------------------------------------- |
| `VITE_TURNSTILE_SITE_KEY`     | Public build value | Renders the browser security challenge     | Required when the support form is enabled    |
| `TURNSTILE_SECRET_KEY`        | Encrypted secret   | Verifies submitted Turnstile tokens        | Required; never use a `VITE_` name           |
| `TURNSTILE_EXPECTED_HOSTNAME` | Plain server value | Rejects tokens issued for another hostname | Exact environment hostname, without protocol |

The form also depends on `OTP_SECRET`, Supabase and a working outbound
transactional-email dispatcher. Cloudflare Email Routing alone is not an outbound
mail service.

## Email queue and authentication email

The current queue/webhook implementation still uses the existing email-provider
integration while Resend is evaluated for SMTP and magic links.

| Name               | Handling           | Purpose                                           | Activation rule                              |
| ------------------ | ------------------ | ------------------------------------------------- | -------------------------------------------- |
| `LOVABLE_API_KEY`  | Encrypted secret   | Existing protected email queue/webhook dispatcher | Confirm it still works after migration       |
| `LOVABLE_SEND_URL` | Plain server value | Optional provider send endpoint override          | Leave absent unless the provider requires it |

If the existing dispatcher is retired, replace this integration deliberately;
do not silently point these names at an unrelated provider credential. Resend
SMTP credentials belong in Supabase Auth/provider configuration and encrypted
platform storage, not in browser variables.

## Analytics — disabled unless explicitly configured

| Name                  | Handling           | Allowed value                     | Rule                                                                  |
| --------------------- | ------------------ | --------------------------------- | --------------------------------------------------------------------- |
| `VITE_ANALYTICS_MODE` | Public build value | absent, `staging` or `production` | Leave absent until the environment's consent/payload test is approved |

Production analytics also requires the approved consent wording and the 35-day
retention controls. A browser build marked `production` must never be used for a
staging deployment.

## External AI — disabled for initial launch

| Name               | Required launch state                    |
| ------------------ | ---------------------------------------- |
| `AI_ANALYSIS_MODE` | Absent or any value other than `enabled` |

The application requires both `AI_ANALYSIS_MODE=enabled` and a provider key
before assessment analysis can run. Do not set the enable flag for the dry run
or initial launch. Email use of the existing provider key does not by itself
enable AI analysis.

## Payments — hold; leave unconfigured

Keep `PAYMENTS_MODE`, `PEACH_BASE_URL`, `PEACH_ENTITY_ID`, `PEACH_ACCESS_TOKEN`
and `PEACH_WEBHOOK_SECRET` absent while paid mode is on hold. The database
paid-mode setting must also remain off. Even if that database setting is changed,
checkout and webhooks remain locked unless `PAYMENTS_MODE=peach` is set explicitly.
The future Stripe-versus-Peach review must create a new activation and privacy
checklist before any payment credential or activation mode is added.

## Environment-by-environment verification

For staging and then production, record only pass/fail—not values—for each item:

- [ ] Core public Supabase values point to the intended project.
- [ ] Core server Supabase values point to the same intended project.
- [ ] Service-role and OTP secrets are present only in encrypted server storage.
- [ ] `PUBLIC_SITE_URL` creates an invitation on the correct environment origin.
- [ ] Real SMS sending passes; callback credentials are either both configured or
      both absent.
- [ ] Turnstile succeeds on the intended hostname and fails on the wrong hostname.
- [ ] A support-form notification reaches the public support route and forwarding
      destination without exposing the private address.
- [ ] Analytics is absent unless that environment's review is complete.
- [ ] AI analysis and paid mode are disabled.
- [ ] No secret appears in client assets, page source, logs or screenshots.

Record the date, deployed commit and operator role in the private release record.
Do not copy secret values into that record.
