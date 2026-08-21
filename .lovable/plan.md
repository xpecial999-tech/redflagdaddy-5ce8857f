# Move OTP and invites from SMS to WhatsApp (Twilio)

Goal: cut Clickatell costs by sending login codes, journey invites and guest report links over WhatsApp, with SMS kept only as a fallback you control.

## Why WhatsApp is cheaper

South African A2P SMS is one of the pricier routes. WhatsApp authentication messages are billed per conversation and are typically a fraction of that cost, and utility/marketing templates cover invites. Trade-off: WhatsApp needs a verified WhatsApp Business sender and pre-approved message templates, which is a one-time setup on Twilio's side (usually 1-3 days, faster if you use Twilio's Verify service).

## What you need to do outside the app

1. Connect Twilio in Lovable (I'll open the connect card). Use a Main API Key so message sending works.
2. In Twilio Console: register a WhatsApp sender (your business number) and get it approved.
3. Submit three WhatsApp templates for approval:
   - `auth_code` — "{{1}} is your RedFlagDaddy code. It expires in 5 minutes." (authentication category)
   - `journey_invite` — invite text with journey title + link (utility)
   - `report_ready` — guest report link (utility)
4. Give me the approved template SIDs (or content SIDs) and the WhatsApp sender number.

While templates are pending we can test end-to-end against Twilio's WhatsApp sandbox.

## What changes in the app

1. **New messaging layer** — `src/lib/messaging.server.ts`
   - `sendWhatsApp(phone, { template, variables })` posting to Twilio through the Lovable connector gateway (`/Messages.json`, `From: whatsapp:+…`, `To: whatsapp:+…`, `ContentSid` + `ContentVariables`).
   - `sendMessage(phone, { whatsappTemplate, variables, smsFallbackText })` — tries WhatsApp first; on a WhatsApp failure (undelivered, number not on WhatsApp, template error) it falls back to Clickatell SMS **only if the SMS fallback flag is on**.
   - Keeps `sendClickatellSms` intact as the fallback path.

2. **Admin cost controls** (new settings in the existing admin settings area)
   - Toggle: "SMS fallback enabled" (default on for OTP, off for invites).
   - Daily send budget per channel, with a counter table `message_sends` (channel, kind, phone hash, created_at) so we can hard-stop when the cap is hit and show today's usage in Admin.
   - Existing per-number and per-IP OTP rate limits stay as they are.

3. **Swap call sites** (three places, no UI change)
   - `src/lib/phone-auth.server.ts` — OTP send uses `sendMessage` with the auth template.
   - `src/lib/journeys.functions.ts` — invite uses the invite template.
   - `src/lib/assessment.functions.ts` — guest report link uses the report template.

4. **Copy updates** — login/register and the journey invite step say "code sent via WhatsApp" (with "we'll text you if WhatsApp fails" when fallback is on). The manual "Send by SMS" button on the success screen gets a WhatsApp sibling using a `wa.me` deep link (free, no template needed).

5. **Verification** — a small admin test action to send each template to your own number, plus checking Twilio's delivery status so failures surface instead of silently passing.

## Technical notes

- Twilio is called through the Lovable connector gateway, so no Twilio credentials live in app code; template SIDs and the WhatsApp sender number are stored as project secrets.
- WhatsApp template variables are positional (`{{1}}`, `{{2}}`), sent as JSON in `ContentVariables`.
- Phone numbers are already normalised to E.164; WhatsApp needs the `whatsapp:` prefix on both `To` and `From`.
- Budget counters are written server-side only; the table is RLS-locked with no client access.

## Acceptance criteria

- [ ] Login OTP arrives on WhatsApp within seconds.
- [ ] Journey invites and guest report links arrive on WhatsApp.
- [ ] SMS fallback fires only when WhatsApp fails and the toggle is on.
- [ ] Admin shows today's WhatsApp/SMS counts and can cap or kill sends.
- [ ] No regression in OTP rate limiting or lockout behaviour.
