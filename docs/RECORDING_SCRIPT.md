# BORROW — exact recording script

## Prepare before recording

1. Set Chrome to 100% zoom. Close notifications. Record the browser window with the address bar visible; hide unrelated tabs and bookmarks if possible.
2. Open two tabs:
   - **Product:** https://borrow.139-84-216-230.sslip.io/?intro=1
   - **Vultr:** https://console.vultr.com/ — show the instance list with **BORROW HackGlobal**, its running status, and IP **139.84.216.230**. Keep billing, credentials and account menus closed.
3. Rehearse once using the product's **Try the live demo** button. On `/demo`, click **Reset demo** before recording the final take. This clears only your synthetic demo workspace.
4. Start recording on the Vultr tab. Use the sequence below. The intro replay URL intentionally plays on every reload; use the plain homepage URL for normal browsing.

## Exact three-minute take

### 0:00–0:12 — Show Vultr

**Open:** the Vultr instance list. Point at BORROW HackGlobal and its public IP.

**Say:**
> “This is BORROW, running on a Vultr Compute instance in Bangalore. The frontend, backend and encrypted workspace storage run here, behind HTTPS.”

### 0:12–0:35 — Brand introduction and product

**Open:** the product tab. Reload `/?intro=1` so the BORROW introduction plays. After it clears, scroll briefly to the permission lifecycle. Do not spend the whole video on the landing page.

**Say:**
> “AI needs access to be useful. BORROW makes that access temporary and specific to one job. The user keeps the keys. Our example is an expense report: read the invoices, keep payroll outside the boundary, and leave verifiable evidence.”

### 0:35–1:05 — Ask and approve

**Click:** **Try the live demo**. If the workspace contains a rehearsal, click **Reset demo**. Leave the prefilled task instruction unchanged:

> Prepare my October business expense report.

**Click:** **Review requested access**. Point at the four source documents, visible fields and five-minute duration. Click **Approve limited access**.

**Say:**
> “These documents are synthetic. This run uses a labeled deterministic processor so the demonstration is repeatable. The server authorization is real. The task requests four documents for five minutes. I approve the scope; the agent cannot approve its own access.”

### 1:05–1:35 — The attack

**Click:** **Start authorized task**. Wait for the task to pause at **An invoice tried to cross the line**. Point at `OUTSIDE_APPROVED_SCOPE` and the denied payroll event.

**Say:**
> “An invoice contains a malicious instruction to read payroll. The agent's attempted call is scripted for this demo. The denial is not: the server checks the signed lease and refuses the request. No payroll fields are returned. Source text cannot turn itself into permission.”

### 1:35–1:55 — The useful result

**Click:** **Contain & continue report**. Show the **$3,784.50** total and the three invoice items. Point at **Permission lease automatically closed**. Click **Export** if desired.

**Say:**
> “The legitimate job still finishes. Three invoices total three thousand, seven hundred eighty-four dollars and fifty cents. The payment confirmation is supporting evidence, so it is not counted twice. The task completes and its permission closes automatically.”

### 1:55–2:25 — Check the evidence

**Scroll:** to **Privacy receipt**.

**Click:** **Verify integrity**, then **Tamper test**, then **Verify integrity** again. End this section with a valid original. Click **Download signed receipt**.

**Say:**
> “The privacy receipt includes a content hash, an ECDSA signature and a linked event chain. The original verifies. Alter its contents and verification fails. The original still verifies afterward. You can download it and check it offline. This is cryptographic integrity, not a claim of blockchain anchoring or invoice truth.”

### 2:25–2:55 — Revocation

**Click:** **Start another task**, **Review requested access**, and **Approve limited access**. Do not start execution. Open **Access leases** from the sidebar. Click **Revoke now** on the active lease, then **Test invoice access** on that same lease. Point at `LEASE_REVOKED`.

**Say:**
> “Permission can also end before the job does. I revoke this lease, then test an otherwise approved invoice read. The gateway rejects it with LEASE_REVOKED. Revocation is enforced on the server, not just reflected in the interface.”

### 2:55–3:05 — Close

**Open:** the public homepage, or leave the denied access test visible with the public URL in the address bar.

**Say:**
> “BORROW: useful work, temporary access, and evidence you can check. Let AI work. Keep the keys.”

## If you need a shorter take

For a two-minute limit, omit the second-task revocation segment. Keep the Vultr proof, explicit approval, real payroll denial, report and verify/tamper sequence. Do not speed through the security decision.

## Recording description — copy and paste

BORROW is a private expense workspace with user-approved, signed, short-lived permissions. This walkthrough shows the application running on Vultr Compute, a scoped task proposal, server-enforced payroll denial, expense report generation, automatic lease closure and signed receipt verification/tamper detection. Source documents and the adversarial agent choice are synthetic; policy enforcement and cryptographic checks are real. The demonstrated processor is deterministic. Optional model-assisted summarization is available when configured. Blockchain anchoring is not enabled.

Live app: https://borrow.139-84-216-230.sslip.io
Source and setup: https://github.com/VijayabaskarR-06/borrow
System design: https://github.com/VijayabaskarR-06/borrow/blob/main/docs/ARCHITECTURE.md
