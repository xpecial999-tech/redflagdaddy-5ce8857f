# Privacy & data modal on Profile

## Goal
Make the "Privacy & data" button on the Profile page open a small modal with "Download your data" and "Delete your account" actions, instead of navigating to a separate page that currently has a non-functional delete button.

## Current state
- `src/routes/_authenticated/profile.tsx` links "Privacy & data" to `/profile/privacy`.
- `src/routes/_authenticated/profile.privacy.tsx` renders a full page with non-persisting toggles and a "Delete account" row that has no `onClick`.
- `src/lib/data-export.functions.ts` already exposes `exportMyData` for the authenticated user.
- No account-deletion server function exists.

## Plan

### 1. Add account deletion server function
- Extend or rename `src/lib/data-export.functions.ts` to also export `deleteMyAccount`.
- Use `requireSupabaseAuth` middleware.
- Load `supabaseAdmin` inside the handler to bypass RLS for cleanup.
- Delete the auth user via `supabaseAdmin.auth.admin.deleteUser(userId)`.
- Clean up public tables scoped to the user:
  - `users`, `user_preferences`, `payments`, `admin_users` (if present)
  - `journeys` where `creator_id = userId`, plus related `invites`, `responses`, `results`, `sms_log`
  - `phone_otps` rows for the user
- Return `{ ok: true }` on success; surface clear error messages on failure.

### 2. Replace the Privacy & data link with a modal trigger
- In `src/routes/_authenticated/profile.tsx`, change the "Privacy & data" item from a `Link` to a button that opens a `Dialog`.
- Keep the existing icon, label, and chevron styling.

### 3. Build the modal
- Use the project's `Dialog` component (`src/components/ui/dialog.tsx`).
- Content:
  - Title: "Privacy & data"
  - Short copy explaining the two actions.
  - Primary button: "Download your data" — calls `exportMyData`, then triggers a JSON file download.
  - Destructive button: "Delete my account" — opens a confirmation `AlertDialog`.
- Show loading states and inline error text.

### 4. Add delete confirmation flow
- Clicking "Delete my account" opens an `AlertDialog` requiring the user to type a confirmation phrase (e.g. "delete my account") before the final "Permanently delete" button is enabled.
- On confirm, call `deleteMyAccount`, then sign the user out and redirect to `/login` with a toast confirming deletion.

### 5. Clean up the old privacy page
- Remove `src/routes/_authenticated/profile.privacy.tsx`.
- Remove the `/profile/privacy` route from `src/routeTree.gen.ts` if it is not auto-regenerated; otherwise let TanStack regenerate it after the file is deleted.

## Verification
- Clicking "Privacy & data" on Profile opens the modal.
- "Download your data" produces and downloads a JSON file.
- "Delete my account" shows a confirmation; typing the phrase enables deletion.
- After deletion the user is signed out and cannot log back in.
- Build passes and the old `/profile/privacy` route no longer exists.
