# Clickatell SMS delivery callback setup

Updated: 31 August 2026

Status: application protection is **DONE and merged**; provider and Cloudflare
configuration remain pending.

This guide configures delivery-status updates only. It does not change the API
key used to send SMS messages.

## Why credentials are required

The public callback changes operational delivery records. An unverified caller
must not be able to mark a message delivered or failed. RedFlagDaddy therefore
fails closed unless callback credentials are configured and every request uses
matching HTTP Basic authentication.

Clickatell's published callback documentation describes optional callback
username/password protection for supported SMS API products. Confirm that the
specific One API integration exposes this option before enabling the callback.
If it does not, leave the callback disabled and ask Clickatell support for its
current authenticated-callback method; do not remove the application check.

Reference:
[Clickatell callback specification](https://6194477.fs1.hubspotusercontent-na1.net/hubfs/6194477/XML%20API%20Specification%20V2.6-1.pdf).

## Staging setup

1. Generate a unique random username and a long random password in the
   owner-controlled password manager. Do not reuse the Clickatell login or API
   key.
2. Add these encrypted staging Worker secrets:
   - `CLICKATELL_CALLBACK_USERNAME`
   - `CLICKATELL_CALLBACK_PASSWORD`

3. In the Clickatell integration, configure the same callback username and
   password.
4. Set the HTTPS callback URL to:
   `https://<staging-host>/api/public/sms/status`.
5. Do not put either credential in the URL, repository, screenshots, support
   tickets or browser storage.
6. Send a synthetic staging SMS and confirm the matching `sms_log` record moves
   from `accepted` to the provider's final delivery status.

## Required negative tests

- Missing credentials in the Worker environment return `503`.
- A request without Basic authentication returns `401`.
- Incorrect credentials return `401` and do not change `sms_log`.
- Invalid JSON returns `400` without echoing or logging the submitted body.
- A body larger than 64 KiB returns `413`.
- More than 100 events in one callback are ignored after the first 100.
- A temporary database failure returns `503` so the provider can retry.
- Every response sends `Cache-Control: no-store`.

## Production activation

Repeat the setup with different production-only credentials after staging has
passed. Record the credential owner, MFA, recovery method, creation date and
rotation date in the private production account inventory. Rotate immediately
if a credential appears in a URL, log, screenshot or support exchange.

If Clickatell cannot authenticate One API delivery callbacks, keep delivery
status callbacks disabled. SMS sending and the application flow can continue;
the dashboard must treat `accepted` as provider acceptance, not proof of handset
delivery.
