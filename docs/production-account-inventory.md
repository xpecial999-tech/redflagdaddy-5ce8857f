# RedFlagDaddy production account inventory

Updated: 31 August 2026

This is an ownership and recovery checklist, not a password vault. Never place
passwords, API keys, private keys, OAuth secrets, MFA seeds or recovery codes in
this repository. Record only who owns an account, how access is protected, and
where the secret or recovery material is stored.

## Minimum operating policy

- Every production service has one named accountable owner and one recovery
  contact who can act if the owner is unavailable.
- Use a company-controlled address rather than an individual's disposable or
  social login wherever the provider supports it.
- Prefer phishing-resistant MFA such as a passkey or hardware security key;
  retain a separately stored backup method.
- Store credentials and recovery codes in an encrypted password manager. This
  file may name the vault and item, but must never contain the secret itself.
- Do not share one personal login among operators. Use provider roles and audit
  logs where available.
- Review access after every team change and at least every three months.
- Provider keys are scoped to the minimum permissions and separated between
  staging and production.

## Inventory

| Service                                 | Purpose                                      | Account/workspace ID                  | Accountable owner  | Recovery contact      | MFA method                      | Secret/recovery location                                           | Billing owner      | Last verified | Status                                                   |
| --------------------------------------- | -------------------------------------------- | ------------------------------------- | ------------------ | --------------------- | ------------------------------- | ------------------------------------------------------------------ | ------------------ | ------------- | -------------------------------------------------------- |
| Domain registrar                        | `redflagdaddy.com` ownership and renewal     | To complete                           | To complete        | To complete           | To complete                     | Password-manager reference only                                    | To complete        | -             | Needs owner input                                        |
| Cloudflare                              | DNS and Workers                              | redflagdaddy-xpecial999               | RedFlagDaddy owner | Private role register | Owner-confirmed; method private | Exact login and recovery details in private password manager only  | RedFlagDaddy owner | 30 Aug 2026   | Ownership confirmed                                      |
| GitHub                                  | Source repository and releases               | xpecial999-tech/redflagdaddy-5ce8857f | RedFlagDaddy owner | Private role register | Owner-confirmed; method private | Password manager; Codex token isolated in macOS Keychain           | RedFlagDaddy owner | 31 Aug 2026   | Repository write, PR and merge access verified           |
| Supabase production                     | Auth, database and storage                   | To complete                           | To complete        | To complete           | To complete                     | Password-manager reference only                                    | To complete        | -             | Needs owner input                                        |
| Supabase staging                        | Synthetic testing                            | To complete                           | To complete        | To complete           | To complete                     | Password-manager reference only                                    | To complete        | -             | Needs owner input                                        |
| SMS provider                            | OTP, journey messages and delivery callbacks | To complete                           | To complete        | To complete           | To complete                     | API and callback credentials stored separately in password manager | To complete        | -             | Provider and authenticated callback confirmation pending |
| Resend / transactional email            | Auth and status email                        | To complete                           | To complete        | To complete           | To complete                     | Password-manager reference only                                    | To complete        | -             | Recommended; setup pending                               |
| Google OAuth                            | Optional sign-in                             | To complete                           | To complete        | To complete           | To complete                     | Password-manager reference only                                    | To complete        | -             | Disabled pending setup                                   |
| Apple Developer                         | Optional Sign in with Apple                  | To complete                           | To complete        | To complete           | To complete                     | Password-manager reference only                                    | To complete        | -             | Disabled pending setup                                   |
| Analytics                               | Consent-led first-party analytics            | To complete                           | To complete        | To complete           | To complete                     | Password-manager reference only                                    | To complete        | -             | Production disabled                                      |
| Cloudflare Email Routing / support form | Product, privacy and safety intake           | To complete                           | To complete        | To complete           | To complete                     | Password-manager reference only                                    | N/A                | -             | Approved; setup/test pending                             |
| Meta WhatsApp Business                  | Possible future WhatsApp OTP                 | To complete                           | To complete        | To complete           | To complete                     | Password-manager reference only                                    | To complete        | -             | Official account guide ready; held                       |
| Payment provider                        | Future international paid mode               | Not selected                          | To complete        | To complete           | To complete                     | Password-manager reference only                                    | To complete        | -             | Peach held; Stripe comparison later                      |
| FetLife                                 | Founder/community presence                   | To complete                           | To complete        | To complete           | To complete                     | Password-manager reference only                                    | N/A                | -             | Needs owner input                                        |
| Instagram                               | Organic education                            | To complete                           | To complete        | To complete           | To complete                     | Password-manager reference only                                    | N/A                | -             | Needs owner input                                        |
| Threads                                 | Organic education                            | To complete                           | To complete        | To complete           | To complete                     | Password-manager reference only                                    | N/A                | -             | Needs owner input                                        |
| TikTok                                  | Organic education                            | To complete                           | To complete        | To complete           | To complete                     | Password-manager reference only                                    | N/A                | -             | Needs owner input                                        |

## Quarterly access review

- Review date:
- Reviewer:
- Accounts added or removed:
- Access removed:
- MFA/recovery tested without exposing secrets:
- Stale or over-privileged credentials rotated:
- Billing and renewal ownership confirmed:
- Follow-up owner and due date:

## Confirmed ownership notes

- Cloudflare ownership was confirmed by the RedFlagDaddy owner on 30 August 2026. The exact login address remains in the private account record and is not
  repeated in this repository.
- The Cloudflare Workers namespace observed in deployment records is
  redflagdaddy-xpecial999.
- Do not add personal names, login addresses, passwords, MFA details, recovery
  codes or provider secrets to this file.
