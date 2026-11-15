# HackGlobal submission package

## Project

**BORROW — temporary permission for autonomous work**

An AI expense assistant should be able to read invoices without gaining access to payroll. BORROW translates that intention into a user-approved, signed, time-limited lease. A deterministic server gateway enforces each operation, while a live 3D Trust Core makes the boundary understandable. A signed privacy receipt lets the user check the recorded result.

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

The product's contribution is a clear boundary between task interpretation and task authorization. Source text cannot approve access. Useful work still finishes after an attack is contained. Explain the attack as a scripted agent choice with real policy enforcement; distinguish deterministic processing from optional model inference.

## Final checklist

- Confirm deadline/timezone in the official event page and submission form.
- Confirm the repository is public and CI passes.
- Verify the demo URL from an unauthenticated browser.
- Record the actual Vultr instance and working public app; keep secrets out of the recording.
- Attach real screenshots and video link.
- Describe actual user feedback, countries, team members and universities accurately.
- Review the final submission text before posting it to Vultr Community.

No votes, users, interviews, partnerships or benchmark numbers are invented in this package.
