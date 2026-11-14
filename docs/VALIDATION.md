# Validation record — 15 November 2026

## Passed

- TypeScript checks.
- 17 automated security/account tests.
- Next.js 16.4.6 production build.
- Docker production image builds successfully; the complete HTTP smoke test also passes inside the container running as non-root UID 1001. Test container removed after verification.
- HTTP smoke test against the standalone production server: 9 pages, isolated guest entry, explicit approval, scoped execution, actual payroll denial, report generation, receipt verification/tampering, revocation and persisted history.
- Official npm production-dependency audit: zero known advisories at the time of this run (`npm audit --omit=dev --registry=https://registry.npmjs.org`). Optional legacy Sites build tooling still has development-dependency advisories; this does not certify the application as vulnerability-free.
- Public repository and GitHub CI: https://github.com/VijayabaskarR-06/borrow/actions/runs/43635366847

## Outstanding evidence

- Latest monochrome/chrome desktop hero reviewed visually in Chrome. Final chapter-transition and mobile visual QA remain pending because native browser automation lost window access. HTTP and component compilation do not substitute for those checks.
- Vultr Compute provisioning and tests on that instance: deferred by the owner.
- Public deployment URL with the new independent email/guest sign-in.
- Screenshots and final video of the app actually running on Vultr.
- Real user interviews across three or more countries.

The existing private Sites URL is an earlier prototype. It is not the new Vultr release and is not evidence of Vultr deployment.
