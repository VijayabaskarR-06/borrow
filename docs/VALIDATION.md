# Validation record — 15 November 2026

## Passed

- TypeScript checks for the final shared white/graphite/blue product design.
- 17 automated security/account tests.
- Next.js 16.4.6 production build.
- Docker production image builds successfully; the complete HTTP smoke test also passes inside the container running as non-root UID 1001. The local QA test container was removed after verification; the Vultr containers remain running.
- HTTP smoke test against the production server (with legacy local auth disabled and the public origin explicitly configured): 9 pages, isolated guest entry, explicit approval, scoped execution, actual payroll denial, report generation, receipt verification/tampering, revocation and persisted history.
- Additional production HTTP release check: secure cookie flags, account signup/signout/signin, rejected credentials and forged sessions, cross-origin write rejection, structured invoice upload/preview/report, private-field filtering, offline signature/tamper verification, persisted account history and cross-workspace document isolation.
- Clean `npm ci`, TypeScript check, all 17 tests and the Next.js production build pass after removing the unused hosted prototype. An npm production-dependency audit reports zero known advisories at the time of this run (`npm audit --omit=dev --registry=https://registry.npmjs.org`); this does not certify the application as vulnerability-free.
- Public repository and GitHub CI for release `39e5fab`: https://github.com/VijayabaskarR-06/borrow/actions/runs/43674863618
- Actual Vultr release: both `smoke.mjs` and `release-check.mjs` pass against https://borrow.139-84-216-230.sslip.io. TLS certificate validation succeeds; HTTP redirects to HTTPS.
- After the repository cleanup, both public checks passed again against the rebuilt Vultr container.
- Production Docker runtime: app runs as non-root UID 1001, Node binds only 127.0.0.1:3000, and the environment file is mode 0600.
- Container recreation: original session, email sign-in, encrypted workspace, completed report, receipt hash and signing key survive (`scripts/persistence-check.mjs`).

## Browser review

- Final product design reviewed in Chrome: desktop hero, interactive approval preview, sticky chapter transitions to denied and verified states, gateway allow/deny comparison and receipt section. iPhone 16 emulation (393 × 852) reviewed: homepage, receipt, guest entry, workspace and permission review. This is browser emulation, not a physical-device test.
- Live browser workflow on the final production build: guest entry, permission review/approval, start, real payroll denial, contain/continue, $3,784.50 report, receipt verification, tamper rejection and successful re-verification.
- Public Vultr browser flow also passes: guest session, review/approval, authorized execution, payroll denial, contain/continue, report and receipt verification.
- Browser downloads confirmed: `borrow-october-report.json` contains three invoice items totaling $3,784.50. The downloaded `borrow-receipt-083c033a.json` also passes the standalone offline verifier (hash, signature, event chain and envelope).
- Published actual synthetic report and signed receipt from the Vultr backend under `docs/evidence/`; offline verification passes.

## Outstanding evidence

- Exported screenshots and final video of the app running on Vultr. Native Screenshot/QuickTime controls timed out during capture attempts; browser visual review itself completed successfully.
- Real user interviews across three or more countries.

Public Vultr application: [https://borrow.139-84-216-230.sslip.io](https://borrow.139-84-216-230.sslip.io).
