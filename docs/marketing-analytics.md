# Privacy-safe marketing analytics

Updated: 31 August 2026

This staging implementation is disabled unless `VITE_ANALYTICS_MODE` is set to
`staging` or `production`. It requires an explicit device-level opt-in and does
not load a third-party analytics SDK.

The choice can be changed on `/consent-safety`. Opting out removes the current
tab's stored attribution, analytics session UUID, and once-only markers.

## UTM map

Only the marketing plan's canonical values are accepted. Attribution is kept
for the current browser tab session and is first-touch: later navigation cannot
overwrite it.

| Field          | Allowed value                                                         |
| -------------- | --------------------------------------------------------------------- |
| `utm_source`   | `fetlife`, `reddit`, `x`, `tiktok`, `instagram`, `threads`, `youtube` |
| `utm_medium`   | `organic_social`                                                      |
| `utm_campaign` | lowercase letters, numbers, `_`, `-`; max 80                          |
| `utm_content`  | lowercase letters, numbers, `_`, `-`; max 80                          |

Unknown parameters, referrers, destination URLs, and dynamic route segments are
never stored.

## Event map and data dictionary

| Event                   | Trigger                             | Flow                 | Stored fields                |
| ----------------------- | ----------------------------------- | -------------------- | ---------------------------- |
| `landing_viewed`        | First consented app load per tab    | `landing`            | session UUID + approved UTMs |
| `signup_started`        | Registration OTP sent, once per tab | `account`            | session UUID + approved UTMs |
| `signup_completed`      | Registration session established    | `account`            | session UUID + approved UTMs |
| `core_action_completed` | Account or guest journey created    | `account` or `guest` | session UUID + approved UTMs |

`session_id` is a random browser-tab UUID. It is not tied to a user account.
`environment` separates staging from production. The database adds
`occurred_at`; rows older than 35 days are removed on insert.
The database uniqueness constraint makes each event/flow idempotent per tab.

Explicitly prohibited: user IDs, names, phone numbers, email addresses, IP
addresses, assessment answers, roles, journey titles, notes, messages, report
contents, invite codes, report tokens, full URLs, and free-form properties.

## Verification checklist

1. Apply `20260829000000_expand_marketing_sources.sql` to staging and verify the
   source constraint remains the exact seven-value allowlist above.
2. Leave `VITE_ANALYTICS_MODE` unset and verify no banner or requests appear.
3. Set it to `staging`; reject analytics and verify no event row is created.
4. Open canonical FetLife, Reddit and X UTM links, opt in, and verify one
   `landing_viewed` row for each synthetic tab.
5. Complete registration and verify `signup_started` then `signup_completed`.
6. Create one synthetic journey and verify `core_action_completed` without
   product data.
7. Try mixed-case, unknown-source, extra-query, and free-text UTM values; verify
   they are rejected or omitted.
8. Inspect stored rows and network payloads for every prohibited field above.
9. Repeat actions in one tab and verify once-only events do not duplicate.

The owner approved the 35-day retention direction and consent approach on
28 August 2026. Do not enable production collection until the staging payload,
exact final consent text, event map and production environment setting pass the
recorded go-live review.
