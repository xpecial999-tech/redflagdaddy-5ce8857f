# RedFlagDaddy

RedFlagDaddy is a consent-first compatibility and red-flag assessment app for
adults. It helps someone start a private journey, invite a partner, compare
answers and use the result as a structured conversation aid.

It is not a dating app, identity-verification tool, background check, diagnosis,
proof of consent, emergency service or guarantee of safety.

## Current Product Direction

- Guest-first journey creation: visitors can start privately before creating an
  account.
- Email-only authentication for the current staging release: Supabase sends a
  six-digit email OTP.
- Optional account claim after a journey is shared, so users can save and track
  their journeys later.
- Production remains behind a full Worker-level construction wall until staging
  passes the launch gates.
- SMS, Clickatell, payments, external AI analysis and production analytics are
  disabled for the current launch path.

## Environments

| Environment | URL                              | Status                          |
| ----------- | -------------------------------- | ------------------------------- |
| Staging     | https://staging.redflagdaddy.com | Open for owner testing          |
| Production  | https://redflagdaddy.com         | Locked behind construction mode |

Staging Supabase project: `lshnoprhmnmnhbhblcaw`.

Production Supabase project: `bevniqflxhsqstfnviwz`.

Do not commit API keys, passwords, database credentials, Cloudflare tokens,
private forwarding addresses, OTPs or generated access links.

## Tech Stack

- TanStack Start
- React
- TypeScript
- Vite
- Tailwind CSS
- Supabase
- Cloudflare Workers
- Resend through Supabase SMTP for authentication email

## Local Development

Install dependencies:

```sh
bun install
```

Run the local app:

```sh
bun run dev
```

Run checks:

```sh
bun run typecheck
bun run test
bun run build:staging
```

The repository-wide lint task still includes older formatting backlog. Treat
focused type, test and staging-build checks as the practical gate until that
backlog is cleared deliberately.

## Current Execution Docs

- `docs/current-execution-batch.md` is the short active batch.
- `docs/current-backlog.md` is the priority backlog.
- `docs/weekend-dry-run.md` is the staging smoke-test runbook.
- `docs/go-live-checklist.md` controls production readiness.
- `docs/runtime-configuration-checklist.md` records non-secret environment
  configuration.

Production changes require an explicit go/no-go decision. Staging work can
continue independently while production stays locked.
