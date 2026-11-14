# BORROW — The Zero-Trust AI Workspace

**Your AI. Your Rules. Your Data.**

BORROW makes one security story tangible: prepare an October expense report, grant a temporary permission lease, watch a malicious invoice request payroll, and see the server reject that request. The permitted task still completes. A signed privacy receipt records the authorization decisions, and a tamper test demonstrates what happens when the evidence changes.

The interactive 3D Trust Core reflects server-issued workflow states. It is accompanied by ordinary HTML controls, audit events, and accessible status text; WebGL is never needed to approve or revoke access.

## Run locally

Use **Node.js 22.13 or later** and npm. The repository contains a lockfile for repeatable installation.

```sh
npm ci
cp .env.example .env.local
```

Set `BORROW_MASTER_KEY` in `.env.local` to 64 random hexadecimal characters. Generate a value locally with:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Then start the standard Next.js App Router development server:

```sh
npm run dev:next
```

Open **http://localhost:3000**. This mode uses encrypted files in `.borrow-data/` and an HttpOnly, SameSite session cookie. Each browser session gets its own synthetic workspace. Keep the same master key across restarts; changing it makes existing ciphertext unreadable. The master key and all runtime records are excluded from source control.

No external account, model API key, or blockchain wallet is required for the complete security demo.

For your own small sample, Sources accepts `.txt` and `.json` files up to 100 KB. Plain text can be previewed; a JSON invoice supplies the structured fields needed by the report. Use an October 2026 date and USD currency for this deliberately scoped workflow:

```json
{
  "vendor": "Example Studio",
  "invoiceNumber": "DEMO-104",
  "date": "2026-10-15",
  "amount": 125,
  "currency": "USD",
  "category": "Design services",
  "description": "Fictional design consultation",
  "notes": "Sample invoice only"
}
```

Uploaded source content remains visible to its owner, while only allowlisted structured fields can pass to the agent. Unsupported files are rejected; renaming a PDF does not add PDF parsing.

## The three-minute demo

1. Open `/demo` and request “Prepare my October business expense report.”
2. Review the Intent Capsule. It lists the four selected resources, allowed fields and operations, output destination, and lease duration. Payroll and the private contract are outside the approved scope.
3. Approve the lease and run the task. Watch authorized document reads appear in the event stream.
4. Pause at the attack. The fictional Meridian Travel invoice contains an instruction to read payroll and send it elsewhere. The demonstration deliberately attempts the forbidden read; the actual server gateway returns `OUTSIDE_APPROVED_SCOPE` and no payroll fields.
5. Continue to the report. The three invoices total **$3,784.50**. The Orbit Studio payment confirmation is supporting evidence and is not counted twice.
6. Verify the receipt, then run the tamper test. Verification recalculates the receipt hash, verifies its signature, and checks the event hash chain.
7. Create another task, approve it, revoke its lease, and probe a normally permitted invoice read. The server must return `LEASE_REVOKED`.
8. Refresh to demonstrate persisted history.

Presenter wording and a longer walkthrough are in [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md).

## Application routes

| Route | Purpose |
| --- | --- |
| `/` | Product introduction and interactive 3D Trust Core |
| `/demo` | Guided expense-report and prompt-injection story |
| `/dashboard` | Workspace overview, tasks, leases, and current security state |
| `/sources` | Synthetic document library, owner previews, and sample uploads |
| `/assistant` | Task proposal, approval, execution, and sourced report |
| `/leases` | Lease details, revocation, and access probes |
| `/security` | Actual gateway decisions and their stated reasons |
| `/receipts` | Signed receipts, verification, and tampering demonstration |
| `/settings` | Demo account context, integration status, and presentation preferences |

## What is real and what is simulated

| Capability | This build |
| --- | --- |
| Document corpus | Clearly fictional October 2026 invoices, receipt, payroll, and contract |
| Capsule review and user approval | Real server-side workflow; proposal alone cannot grant access |
| Signed, expiring, revocable leases | Real ECDSA-signed policy objects checked by the gateway |
| Resource, field, operation, and destination restrictions | Deterministic server enforcement, deny by default |
| Prompt-injection demonstration | Scripted adversarial agent request; the denial comes from the real gateway |
| Expense report without an API key | Deterministic demo processing, labeled in the interface and receipt |
| Expense report with `OPENAI_API_KEY` | Server-side model-assisted summary of approved, filtered fields |
| Audit history | Persisted, ordered events linked by SHA-256 hashes |
| Privacy receipt | Canonical payload hash, ECDSA P-256 signature, public verification key |
| Tamper demonstration | Real hash/signature/chain verification failure on an altered copy |
| Persistence | AES-GCM-encrypted workspace snapshots in local files or Cloudflare D1 |
| Hosted identity | Sites-provided authenticated user identity, isolated per workspace |
| Local identity | Localhost-only demo session, not production account authentication |
| Google Drive | Not connected; OAuth and Picker are not implemented |
| Blockchain | Not anchored on-chain; no transaction is fabricated |
| PostgreSQL / Supabase | Not implemented; hosted persistence uses D1 |

## Architecture

The application is written with Next.js App Router, TypeScript, React, Tailwind, accessible Radix-based controls, Motion, and Three.js through React Three Fiber and Drei. The Sites deployment runs the App Router implementation through the Vinext adapter on Cloudflare Workers. `npm run dev:next` retains the standard Next.js development path.

```text
User reviews capsule → explicit approval → signed temporary lease
                                         ↓
Agent operation → identity + ownership + lease + policy gateway
                                         ↓
                    allow selected fields / deny and return no data
                                         ↓
                    hash-linked audit events → report → signed receipt
```

The server checks identity, workspace ownership, lease signature, expiration, revocation, approval state, resource, operation, requested fields, and output destination before disclosing agent data. Source text is untrusted data and cannot expand a signed lease. Owner document previews are a separate authenticated user action, not an agent permission.

The signing keypair belongs to the workspace and stays inside its encrypted server record; only the public key is returned for verification. AES-GCM uses a fresh nonce and binds ciphertext to the workspace identifier. D1 writes use a version check to reject concurrent stale updates. Local file writes use a temporary file and atomic rename with an in-process per-workspace lock.

The Trust Core supports `IDLE`, `TASK_REQUESTED`, `LEASE_APPROVED`, `AGENT_EXECUTING`, `ACCESS_DENIED`, `TASK_COMPLETED`, and `RECEIPT_VERIFIED`. Decorative orbit animation does not decide these states. The status indicator is a policy/workflow visualization, not a statistically calibrated measure of model safety.

## Source map

```text
app/                       App Router pages and API route wrapper
components/                Landing, workspace UI, and TrustCore3D
lib/contracts.ts           Browser/server API types
lib/auth.ts                Hosted identity and local demo-session boundary
lib/server/api.ts          Validated workflow endpoints
lib/server/policy.ts       Deterministic authorization and event chaining
lib/server/crypto.ts       Canonicalization, hashing, signing, encryption
lib/server/receipts.ts     Receipt creation and verification
lib/server/storage.ts      Encrypted local/D1 persistence
lib/server/seed.ts         Fictional documents and default policy
db/ and drizzle/           D1 schema and migrations
tests/                     Security acceptance tests
worker/index.ts            Hosted API boundary and App Router handler
scripts/                   Build and Sites environment support
docs/DEMO_SCRIPT.md         Presenter walkthrough
```

## Verification

```sh
npm run typecheck
npm test
npm run build
```

The automated security suite exercises allowed access, out-of-scope reads, expired and revoked leases, workspace isolation, field restrictions, receipt integrity, and receipt tampering. The standard Next.js production build is available as `npm run build:next`; `npm run build` produces the Worker deployment in `dist/`.

### Verify a receipt entirely offline

Download a signed receipt using the download button in Privacy receipts. The standalone verifier uses only Node's built-in modules: no running app, npm installation, network, account, API key, or server private key is needed.

```sh
node scripts/verify-receipt.mjs /path/to/borrow-receipt.json
```

It checks the canonical payload hash, ECDSA P-256 signature, every link in the audit event chain, the final audit root, and consistency of envelope fields duplicated in the signed payload, including receipt, task, and lease identifiers. Exit codes are `0` for passed checks, `1` for failed verification, and `2` for invalid input or usage. Add `--json` for machine-readable results.

To establish that the receipt came from the key you expect, obtain the workspace public JWK through a separately trusted channel and pin it:

```sh
node scripts/verify-receipt.mjs /path/to/borrow-receipt.json \
  --expected-key /path/to/trusted-public-key.json
```

The expected key file must contain the public EC P-256 JWK, with `kty`, `crv`, `x`, and `y` fields. It must not contain a private `d` field. The verifier also prints a SHA-256 fingerprint of the canonical public-key coordinates for comparison.

Without `--expected-key`, a valid result establishes integrity under the key included in the receipt; it does **not** establish the signer's identity. Copying the key out of the same untrusted receipt does not independently establish trust. Verification also does not prove source-document truth, exhaustive monitoring, or that a separate exported report matches the receipt's signed report hash.

## Deploy

The tracked `.openai/hosting.json` identifies this private Site and declares the D1 binding `DB`. Keep that Site identity when updating this deployment. A separate deployment should use its own Site identity, database, and secret.

1. Configure `BORROW_MASTER_KEY` as a **server secret** with the same 64-hex format. Set `BORROW_REQUIRE_D1=1`. Do not enable localhost demo authentication for hosted access.
2. Optionally configure `OPENAI_API_KEY` as a server secret and `OPENAI_MODEL` as the desired supported model. Never use a `NEXT_PUBLIC_` prefix for credentials.
3. Apply the checked-in D1 migration to the provisioned `DB`. The Sites publishing workflow applies declared migrations before the Worker is uploaded.
4. Build the application and publish the exact committed source and build archive through Sites. Preserve its private audience unless the owner deliberately changes access.
5. Verify an authenticated task, blocked payroll access, receipt verification, and refresh persistence in the deployed environment.

For standard Node hosting, use the Next.js build and server with durable private storage or implement a database adapter. A local filesystem on an ephemeral serverless instance is not durable storage. Do not point an internet-facing deployment at the localhost demo authentication mode.

## Boundaries and remaining work

- This is a complete, deliberately narrow hackathon workflow, not a general agent sandbox or a production security certification.
- The injected instruction and adversarial tool choice are scripted for repeatable judging. With an AI key, the report summary can use a live model; arbitrary autonomous tool planning is not implemented.
- The gateway protects the operations routed through it. It cannot prove the absence of undisclosed side channels, host compromise, or operations outside that boundary.
- Cryptographic receipts attest to the signed record and reveal later alteration. They do not prove invoice truth, exhaustive monitoring, or a trustworthy signing-key owner. Independent verification must establish trust in the public key through a separate channel.
- The event chain is logically append-only within the application. The hosting operator controls storage and keys; this is not an externally witnessed transparency log. Workspace reset starts a new demo history.
- Storage encryption is at rest. The server, and a configured AI provider, process authorized plaintext. This is not end-to-end encryption.
- Revocation blocks subsequent gateway operations and report publication. It cannot recall input already disclosed to a configured AI provider. The server checks the lease again after a provider response before publishing the report.
- Uploaded text samples are validated and encrypted; full PDF/OCR ingestion, malware scanning, live Drive access, and general document extraction are not implemented.
- Key rotation, account lifecycle management, production backup/recovery, externally pinned signing identities, distributed abuse controls, and database row-level policies need further operational work.
- Reduced-motion and WebGL fallback paths keep the task controls functional. A browser that cannot render 3D receives a lightweight SVG Trust Core.

No hackathon outcome is guaranteed. The strongest demonstration is the reproducible boundary: an approved task succeeds, a forbidden read fails, and the resulting evidence can be checked.
