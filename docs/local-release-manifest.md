# RedFlagDaddy release manifest

Updated: 31 August 2026

Status: application batches merged; deployment and provider dry run pending.

## Merged application releases

### PR #15 — core dry-run features

- Merged as main commit 2668e9781b1835e02110bf7512574fbc16e140ef.
- Construction mode with secure administrator entry.
- Dedicated administrator dashboard.
- International phone inputs with silent country default and E.164 output.
- Anonymous no-contact journeys with hashed private owner codes and 30-day
  expiry.
- Disabled-by-default Supabase email, Google and Apple authentication surfaces.
- Exact branch proof before merge: TypeScript pass, 83 tests across 18 files and
  Cloudflare-compatible production build pass.

### PR #16 — launch hardening

- Merged as main commit 925ea41991a7cf73edb54c0fc9a608dc2dd771e1.
- Public support form, Turnstile enforcement, safe support email queueing and
  operational feedback.
- Security headers, private no-store/noindex boundaries, bounded public errors
  and hashed-IP rate limits.
- Safer OTP consumption, journey finalization, SMS delivery callbacks, account
  deletion, report revocation, unsubscribe processing and email webhooks.
- Private Markdown/JSON/selective/conversation exports and privacy-safe calendar
  files.
- Brand assets, web-app icons, public metadata, mobile targets and accessibility
  hardening.
- Server-only payment and external-AI activation gates; both remain disabled.
- Canonical PUBLIC_SITE_URL handling and a non-secret runtime inventory.
- Marketing-source database migration and consent-led attribution boundaries.

## Validation evidence for PR #16

- Cloudflare-compatible production build: pass.
- TypeScript: pass.
- Automated tests: 149 passing across 32 files.
- Changed-file behavior lint: zero errors; four non-blocking Fast Refresh
  warnings.
- Repository whitespace and conflict-marker checks: pass.
- Personal-name and private-email scan: pass.
- No credential or environment file included.
- GitHub merge state: clean and mergeable; repository-hosted checks were not
  configured.

## Documentation release

The current branch packages the owner checklist, backlog, dry-run and go-live
runbooks, provider setup guides, counsel review pack, organic marketing material
and production-account inventory. It contains no provider secret and authorizes
no deployment.

## Controlled release steps still required

1. Merge the documentation PR.
2. Apply all new Supabase migrations to staging and verify expected schema.
3. Deploy the exact merged main commit to Cloudflare staging.
4. Configure PUBLIC_SITE_URL, Turnstile, support routing, outbound email and the
   SMS provider using encrypted environment storage.
5. Execute weekend-dry-run.md and record the exact commit and evidence.
6. Fix failures through a new reviewed PR.
7. Make a separate production go/no-go decision.
8. Promote the already-tested artifact; do not rebuild an unverified revision.

## Still requires owner-controlled services

- Support email routing and outbound delivery.
- Turnstile widget and exact staging hostname.
- Real SMS success/failure and authenticated callback capability.
- Private operational-role assignments and response targets.
- Legal review before public promotion.
- Production account-inventory completion and private recovery verification.

No DNS change, Cloudflare deployment, provider activation, production release or
public promotion is authorized by this manifest.
