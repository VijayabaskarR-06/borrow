# Live Vultr demo evidence

These JSON artifacts were generated on 15 November 2026 by the public BORROW backend at https://borrow.139-84-216-230.sslip.io, using an isolated synthetic guest workspace. They contain no real invoices, private signing keys, passwords or session cookies.

- `vultr-report.json`: the completed $3,784.50 report with three invoice items and source citations.
- `vultr-receipt.json`: the actual SHA-256 commitment, ECDSA P-256 signature, included public key and hash-linked policy decisions. Its events include the denied payroll read and automatic lease closure.

Verify the receipt locally without contacting the app:

```sh
node scripts/verify-receipt.mjs docs/evidence/vultr-receipt.json
```

This checks integrity under the included key. It does not independently establish the operator's identity, invoice truth, completeness of monitoring, or a blockchain anchor. The adversarial agent choice and source documents are synthetic; the gateway denial and cryptographic operations are real.

Desktop and iPhone-emulation browser checks, production API checks and a container-recreation test are recorded in [VALIDATION.md](../VALIDATION.md). Native recording controls timed out; a recorded walkthrough and exported user-flow screenshots remain to be captured for the submission.
