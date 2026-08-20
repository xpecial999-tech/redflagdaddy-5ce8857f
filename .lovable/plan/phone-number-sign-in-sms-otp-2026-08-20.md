# Phone-number sign-in (SMS OTP)

Switch RedFlagDaddy accounts from email/password to mobile number + 6-digit SMS code. Simplest reliable path: use the built-in phone auth in the backend, backed by an SMS provider.

## What you need first (one-off, from you)

Phone auth cannot send codes without an SMS provider account. Cheapest common option is Twilio:

- Twilio Account SID
- Twilio Auth Token
- A Twilio phone number (or Messaging Service SID)

Costs are per SMS (roughly $0.02–$0.08 depending on country; South African numbers are on the higher end). Once you give me the three values I store them as secrets and enable phone sign-in.

## What changes in the app

**Register**
- Fields become: display name, mobile number (with country code, e.g. +27…), primary identity. No password, no email field.
- Submit sends a 6-digit SMS code; the existing OTP step verifies it and creates the account.

**Login**
- Single field: mobile number. Tap "Send code" → enter 6 digits → signed in.
- No password, so the forgot-password / reset-password pages are removed from the login flow (routes kept but unlinked, or deleted).

**Profile**
- Shows the mobile number as the account identifier.
- Email becomes an optional field users can add so they still receive report and invite emails.

**Existing accounts**
- Only your admin account exists today. I add a phone number to it during the switch so you can keep signing in. Any future email-only account would need a number added by an admin.

## Technical notes

- Enable the Phone provider with Twilio credentials stored as backend secrets; set the SMS template to use the `{{ .Code }}` placeholder so codes (not links) are sent.
- `signUp({ phone, password? })` is replaced by `signInWithOtp({ phone })` + `verifyOtp({ phone, token, type: 'sms' })` on both register and login.
- Migration on `public.users`: add a `phone` column, make `email` nullable, and update the `handle_new_user` trigger to copy `phone` from `auth.users` on signup.
- Journey invite and completion emails keep working, but only for users who supplied an optional email; those code paths get a null-email guard.
- Guest flow keeps asking for an email (that's how the guest report is delivered) — unchanged.

## Alternative if you'd rather not pay for SMS

Keep email/password login and add the mobile number as profile data only. No provider, no cost, but users still sign in with email. Say the word and I'll swap the plan.
