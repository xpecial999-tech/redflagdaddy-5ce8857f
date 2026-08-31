# RedFlagDaddy pull-request execution record

Updated: 31 August 2026

Status: core and launch-hardening pull requests merged; documentation release in
progress.

The earlier six-batch proposal was consolidated after exact integration testing.
This reduced generated-route and dependency conflicts while keeping operational
documentation separate from application code.

## Completed sequence

### PR #15 — core product features

- URL: https://github.com/xpecial999-tech/redflagdaddy-5ce8857f/pull/15
- Merged commit: 2668e9781b1835e02110bf7512574fbc16e140ef
- Included construction mode, administrator workspace, international phones,
  anonymous owner-code journeys and disabled authentication alternatives.
- Did not activate providers, payments or production deployment.

### PR #16 — application launch hardening

- URL: https://github.com/xpecial999-tech/redflagdaddy-5ce8857f/pull/16
- Merged commit: 925ea41991a7cf73edb54c0fc9a608dc2dd771e1
- Included public/runtime safety, journey and identity integrity, email/privacy
  safeguards, disabled-feature gates, brand presentation and private owner tools.
- Included the non-secret runtime checklist and required marketing-source
  migration because automated application checks depend on them.
- Exact integrated proof: Cloudflare-compatible build, TypeScript, 149 tests and
  changed-file lint with zero errors.

### PR #17 — documentation and operations

- Base: merged main at 925ea41991a7cf73edb54c0fc9a608dc2dd771e1.
- Includes current backlog, owner actions, release record, dry-run and go-live
  checklists, provider guides, counsel pack, marketing drafts and account
  inventory.
- Must use RedFlagDaddy or role names only and include no login address, private
  forwarding destination, credential, MFA detail or recovery material.
- Does not authorize deployment, provider activation, DNS changes or promotion.

## GitHub access policy

- GitHub operations use the RedFlagDaddy fine-grained token stored in macOS
  Keychain.
- The token is injected only for the individual command.
- Its configuration directory is isolated from the user's other GitHub CLI and
  Claude Code authentication.
- Do not run global GitHub login, logout, account switch or setup commands.

## Post-merge release gates

1. Refresh and record exact main.
2. Confirm all Supabase migrations are applied to staging.
3. Deploy exact main to Cloudflare staging.
4. Configure only the approved staging provider values.
5. Run weekend-dry-run.md and preserve non-secret pass/fail evidence.
6. Stop on any privacy, authorization, data-association or recovery failure.
7. Fix defects through a new reviewable PR.
8. Make an explicit production go/no-go decision.

Merging code or documentation does not itself authorize deployment or public
promotion.
