# Guest page: mobile-only sign-up

## Goal
Remove the email address field from the "Continue as guest" flow and make the mobile number the only required contact method.

## Changes

### 1. UI updates — `src/routes/guest.tsx`
- Remove the "Your email address" input field and its React state.
- Change the mobile number field from optional to required.
- Update the helper text under the mobile field to explain it is used to deliver the report link via SMS.
- Update the "How it works" step copy so it refers to SMS delivery instead of email.
- On the partner-link success screen, remove references to the report being emailed; instead say the report link will be texted to the mobile number.
- Keep the self-assessment flow working without email.

### 2. Server function updates — `src/lib/guest.functions.ts`
- Make `guestEmail` optional in the `CreateGuestSchema`.
- Make `guestPhone` required and validate it as a valid E.164 mobile number.
- Insert `guest_email: null` when no email is provided.
- Preserve existing SMS invitation/report delivery behaviour.

### 3. Completion notification check — `src/lib/assessment.functions.ts`
- Verify the existing logic that texts the report link to `guest_phone` when no creator account exists still runs correctly.
- No change expected here; confirm it is the primary path for guest journeys.

### 4. Validation
- Type-check the project.
- Walk through the guest flow in the preview to confirm:
  - Email field is gone.
  - Mobile number is required and validates.
  - Partner link is generated.
  - Self-assessment path still works.
