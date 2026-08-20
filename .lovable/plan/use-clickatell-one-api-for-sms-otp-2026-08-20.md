# Use Clickatell One API for SMS OTP

Switch the app's phone authentication from the default Twilio/Supabase SMS provider to your Clickatell One API account.

## What will change

1. **New public SMS webhook** — `src/routes/api/public/sms.clickatell.ts`
   - Receives SMS send requests from Supabase Auth (phone number + message/code).
   - Calls the Clickatell One API `POST /v1/message` endpoint.
   - Uses your Clickatell API key stored as a runtime secret.
   - Returns the response Supabase expects so OTP delivery succeeds.

2. **Secret storage** — add `CLICKATELL_API_KEY` as a backend runtime secret.

3. **Supabase Auth configuration** — point the Phone provider's SMS hook to the production URL:
   `https://redflagdaddy.com/api/public/sms/clickatell`
   (or the preview URL during testing).

4. **UI copy updates** — remove any remaining "Twilio" references in login/register/help text and keep the "we'll text you a code" wording.

5. **End-to-end test** — sign up with a phone number, confirm the SMS arrives via Clickatell, and complete OTP verification.

## Technical details

- The webhook must be under `/api/public/*` so Supabase can call it without authentication.
- Input will be validated with Zod (phone E.164, message length capped).
- Clickatell One API request format:
  ```text
  POST https://platform.clickatell.com/v1/message
  Authorization: <CLICKATELL_API_KEY>
  Content-Type: application/json
  {
    "content": "Your RedFlagDaddy code is 123456",
    "to": ["+27821234567"]
  }
  ```
- If Clickatell returns an error, the webhook will log it and return a non-2xx response so Supabase marks the send as failed and surfaces the error to the user.
- No changes to login/register UI logic beyond copy; the existing `supabase.auth.signInWithOtp({ phone })` and `verifyOtp({ phone, token, type: "sms" })` calls stay the same.

## Acceptance criteria

- [ ] `CLICKATELL_API_KEY` saved as a runtime secret.
- [ ] `/api/public/sms/clickatell` route exists and forwards to Clickatell.
- [ ] Supabase Auth phone provider is configured with the public webhook URL.
- [ ] A new user can register with a phone number and receive the 6-digit code via Clickatell.
- [ ] Existing login flow still works after the switch.
