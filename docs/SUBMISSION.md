# HackGlobal submission package

## Project

**BORROW — temporary permission for autonomous work**

Small teams spend time reconciling invoices and payment evidence, yet giving an assistant broad access to their files is risky. BORROW imports the team's own CSV or JSON records, excludes duplicate invoices, flags missing payment evidence, and produces a report under a user-approved, signed, time-limited lease. A deterministic server gateway enforces each read; a signed receipt lets the user verify the recorded access. The 3D Trust Core makes the boundary understandable.

**Real-user path:** create an account → import the user's records → select a single-currency set → approve specific fields and duration → reconcile → inspect exceptions and signed proof. The import drops unrelated columns, such as bank accounts, before storage. The default calculation runs on Vultr without an external model request. Model-assisted summarization is optional and requires explicit provider-destination approval.

## The memorable demo

Ask for an October expense report → review exact access → approve → watch an invoice request payroll → see the gateway deny it → finish the $3,784.50 report → verify its receipt → alter the receipt and see verification fail → revoke another lease and prove further reads fail.

## Submission fields to complete

| Requirement | Evidence |
|---|---|
| Public source | https://github.com/VijayabaskarR-06/borrow |
| Setup + system design | README.md, docs/ARCHITECTURE.md |
| Vultr backend | Running on Vultr Cloud Compute in Bangalore; Docker + Caddy HTTPS + persistent encrypted storage |
| Public product URL | [https://borrow.139-84-216-230.sslip.io](https://borrow.139-84-216-230.sslip.io) |
| Recorded demo running on Vultr | Public deployment verified; native recording controls timed out. Capture using docs/DEMO_SCRIPT.md |
| User-flow screenshots | Capture login, approval, denial, report, receipt verification from the final deployment |
| Verifiable live artifacts | docs/evidence/vultr-report.json and docs/evidence/vultr-receipt.json |
| Reach in 3+ countries | Not yet collected; record real interviews in docs/USER_RESEARCH.md |

## Merit

The product's contribution is useful reconciliation on user-owned records under a clear boundary between task interpretation and task authorization. Source text cannot approve access. The sample attack demonstrates that useful work still finishes after a forbidden request is contained. Explain the attack as a scripted agent choice with real policy enforcement; distinguish deterministic calculations from optional model inference.

## Final checklist

- Confirm deadline/timezone in the official event page and submission form.
- Confirm the repository is public and CI passes.
- Verify the demo URL from an unauthenticated browser.
- Record the actual Vultr instance and working public app; keep secrets out of the recording.
- Attach real screenshots and video link.
- Describe actual user feedback, countries, team members and universities accurately.
- Review the final submission text before posting it to Vultr Community.

No votes, users, interviews, partnerships or benchmark numbers are invented in this package.
