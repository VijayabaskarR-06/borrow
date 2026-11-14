# BORROW: one story, three minutes

## Before presenting

- Open the app in a browser with WebGL available. Keep reduced motion enabled if preferred; the security controls work either way.
- Use the synthetic workspace. Do not bring real payroll, customer information, or actual bank details into a public demonstration.
- Confirm that the mode badge says **Demo processor** unless a model API key is configured. Explain model assistance honestly.
- Run the security tests and rehearse the sequence once. If reusing a workspace, use the app's reset control before starting.
- Keep a receipt from the rehearsal available as a backup. Do not claim a recorded result is live.

## 0:00–0:25 — Set the stakes

Show the landing-page Trust Core. Drag it briefly, then scroll through authorize → contain → verify. Explain that this is an illustrative preview. Click Experience BORROW to start an isolated live demo without an email. Email sign-in is available for returning users.

> “AI assistants need access to be useful. But access should belong to a task, not become an open-ended privilege. BORROW lets your AI borrow exactly what it needs—and gives you evidence of what happened.”

Open Sources. Point out the three fictional October invoices, the payment receipt, and the payroll record sitting alongside them.

> “The documents are synthetic. The authorization checks you are about to see are real.”

## 0:25–0:55 — Ask, then consent

Request **“Prepare my October business expense report.”**

Review the Intent Capsule: purpose, four selected documents, permitted fields, read/report operations, output destination, and temporary duration.

> “The agent can propose scope. It cannot approve its own access. I am approving invoice fields for this report, for a limited time. Payroll and our private contract stay outside the lease.”

Approve. The authorized connection lights up in the 3D core.

## 0:55–1:35 — The attempted permission heist

Start the task. Let the authorized invoice reads appear in the audit trail. Pause at the denied state.

Show the malicious note from Meridian Travel. It asks for payroll and an external destination.

> “The attacker put an instruction inside an invoice. The scripted demo agent tries the forbidden payroll read. A system prompt is not making the security decision here: the server checks the signed lease and returns OUTSIDE_APPROVED_SCOPE. No payroll fields cross the gateway.”

Point out the red route stopping at the policy boundary and the corresponding audit event.

> “The visualization reflects the server decision. A document can contain instructions; it cannot grant permission.”

## 1:35–2:00 — Finish the useful task

Continue to the expense report.

> “The attack does not have to derail the legitimate job. We still get the report, backed by the three invoices: $3,784.50. The payment confirmation is evidence, not a fourth expense.”

Open a citation. Show that unrelated fields, such as bank account details, were not disclosed to the reporting agent. Show the closed or revoked completed-task lease.

If the mode is deterministic, say:

> “This run uses a labeled deterministic processor so the demo is repeatable. A configured model can write the summary from the same gateway-approved data.”

## 2:00–2:35 — Give the judge a checkable receipt

Open the signed privacy receipt. Select **Verify**, then run **Tamper test**.

> “The receipt records the decisions, disclosed fields, and completion state. We recalculate its hash, verify an ECDSA signature, and verify the event chain. Alter the receipt, and the check fails.”

> “This proof is local cryptography, not a fabricated blockchain transaction. It is not anchored on-chain. It proves integrity of this signed record, not that every source document is true.”

Restore or verify the original so the demo ends on a valid proof.

## 2:35–3:00 — Take access away

Create another proposal, approve its lease, then open Leases and revoke it before execution. Probe an otherwise permitted invoice read.

> “Consent is revocable. This is the same invoice read that would be allowed moments ago. After revocation, the server returns LEASE_REVOKED.”

Refresh to show that tasks, decisions, and receipts persist.

> “Useful work, borrowed access, checkable evidence. Your AI. Your rules. Your data.”

## Questions worth answering precisely

**Is the injection an actual model attack?**

The malicious source text and attempted tool call are scripted to make the demonstration reproducible. The policy gateway, denied response, state change, and audit record are real. Model-assisted summarization is optional and is labeled separately.

**Can the model approve a broader lease?**

No. A task proposal is pending until an authenticated user explicitly approves it. The server issues and verifies the lease; source text cannot change it.

**Why sign a receipt?**

To make later alteration detectable and provide a portable artifact. Trust in the signing identity still needs an independently trusted public key; a self-contained signature is not proof of honesty.

**What does the trust score mean?**

It visualizes the current workflow and policy status. It is not a measured probability that a model is safe, and it does not replace reviewing the actual decisions.

**Does encryption hide the data from the server?**

No. Records are encrypted at rest, and the server decrypts authorized fields to process the task. A configured AI provider also receives the approved fields. BORROW does not claim end-to-end encryption.

**What would you build next?**

User-selected Drive ingestion, a mature production identity and key-management lifecycle, broader structured document extraction, externally witnessed receipt commitments, and adversarial evaluation of live tool-planning agents. The existing gateway remains the authorization boundary for those integrations.

## Final recording evidence

Vultr deployment is deferred. The final submission video must be recorded after deployment and include the public HTTPS URL plus the actual Compute instance in the console. Do not show account credentials or billing details. A local rehearsal does not satisfy that requirement.
