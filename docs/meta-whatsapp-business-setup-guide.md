# RedFlagDaddy Meta WhatsApp Business setup guide

Updated: 28 August 2026

This creates official Meta assets suitable for a WhatsApp OTP pilot. It does not
approve production activation or replace the existing SMS login. Do not use
Baileys, browser-session automation, a personal WhatsApp account or copied
session credentials for authentication.

## Before starting

- Use an owner-controlled Meta login protected by MFA.
- Keep account ownership and recovery in the private password manager.
- Decide which legal identity Meta should verify. RedFlagDaddy is the public
  service name, but do not invent a registered company while the legal entity is
  still pending.
- Obtain a dedicated telephone number that can receive the verification SMS or
  call. Confirm Meta's current migration rules if it is already used by WhatsApp.
- Use Meta's supplied test number first; do not add a production sender merely
  to explore the API.

## Create the sandbox assets

1. Go to Meta Business and create a Business Portfolio for RedFlagDaddy.
2. Go to Meta for Developers, create a Business-type app and add the WhatsApp
   product.
3. Open WhatsApp → API Setup. Meta supplies a test WhatsApp Business Account,
   test phone number and temporary access token.
4. Add only owner-controlled recipient numbers to the test recipient list.
5. Send Meta's sample template and confirm message and delivery-status webhooks
   before creating custom authentication behavior.

The temporary token and test number are for sandbox work only.

## Prepare production ownership

1. Complete the real Business Portfolio details with accurate information.
   Business verification may require legal registration documents, address,
   domain control and a contact method. Pause this step until the legal identity
   can be represented truthfully.
2. Create or attach a WhatsApp Business Account and add the dedicated production
   number.
3. Verify the number by SMS or voice and submit the display name for review.
4. In Meta Business Settings, create a dedicated system user rather than using a
   person's temporary token in production.
5. Grant only the required app, WhatsApp account and phone-number assets. Create
   a production token with only the permissions the integration needs, normally
   `whatsapp_business_messaging` and `whatsapp_business_management`.
6. Store the token as an encrypted staging/production secret. Use separate
   credentials and rotate them after staff or ownership changes.
7. Add Meta billing, a conservative budget alert and an owner for quality/rate
   limit monitoring before the pilot.

## Authentication template and webhook

1. In WhatsApp Manager, create an Authentication message template specifically
   for one-time passwords. Do not disguise promotional copy as an OTP template.
2. Keep the message discreet: RedFlagDaddy name, short expiry, never ask the user
   to share the code, and no journey, role, score or partner information.
3. Submit the template and wait for approval before integration testing.
4. Create an HTTPS webhook callback with a random verification token, validate
   Meta request signatures and subscribe only to message/status events required
   for delivery handling.
5. Do not log OTPs, access tokens, phone numbers, full webhook bodies or message
   content. Bound and validate every provider status before storage.

## Choose the production integration path

Meta Cloud API is not automatically a drop-in delivery channel for Supabase
phone OTP. Before coding, choose one of these official paths:

- **Recommended first pilot:** Twilio Verify with its official WhatsApp channel.
  It provides a managed verification lifecycle and a simpler fallback to SMS,
  at usage-based cost.
- **Direct Meta Cloud API:** build and operate a custom OTP lifecycle around the
  official API only after a separate security design covers code creation,
  hashing, expiry, retries, replay prevention, fraud controls, account recovery,
  webhook validation and SMS fallback.

The Meta account setup above is useful for either evaluation, but the provider
decision must be made before credentials are connected to production.

## Pilot acceptance tests

- Explicit user opt-in and a clear SMS fallback.
- Generic errors that do not reveal whether an account exists.
- OTP expiry, one-time use, resend cooldown and attempt limits.
- Wrong-number, recycled-number and lost-number recovery behavior.
- Successful and failed delivery callbacks without sensitive logs.
- Rate limits and capped spend across several launch regions.
- Easy disable/rollback without locking out SMS users or administrators.
- Privacy notice names the actual provider and disclosed fields before launch.

## Official references

- [Meta WhatsApp Cloud API: get started](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
- [Meta WhatsApp phone numbers](https://developers.facebook.com/docs/whatsapp/cloud-api/phone-numbers)
- [Meta WhatsApp webhooks](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks)
- [Twilio Verify WhatsApp](https://www.twilio.com/docs/verify/whatsapp)
