# Validation record — 15 November 2026

## Passed

- TypeScript checks for the final shared white/graphite/blue product design.
- 17 automated security/account tests.
- Next.js 16.4.6 production build.
- Docker production image builds successfully; the complete HTTP smoke test also passes inside the container running as non-root UID 1001. Test container removed after verification.
- HTTP smoke test against the production server (with legacy local auth disabled and the public origin explicitly configured): 9 pages, isolated guest entry, explicit approval, scoped execution, actual payroll denial, report generation, receipt verification/tampering, revocation and persisted history.
- Additional production HTTP release check: secure cookie flags, account signup/signout/signin, rejected credentials and forged sessions, cross-origin write rejection, structured invoice upload/preview/report, private-field filtering, offline signature/tamper verification, persisted account history and cross-workspace document isolation.
- Official npm production-dependency audit: zero known advisories at the time of this run (`npm audit --omit=dev --registry=https://registry.npmjs.org`). Optional legacy Sites build tooling still has development-dependency advisories; this does not certify the application as vulnerability-free.
- Public repository and GitHub CI: https://github.com/VijayabaskarR-06/borrow/actions/runs/43635366847

## Browser review

- Final product design reviewed in Chrome: desktop hero, interactive approval preview, sticky chapter transitions to denied and verified states, gateway allow/deny comparison and receipt section. iPhone 16 emulation (393 × 852) reviewed: homepage, receipt, guest entry, workspace and permission review. This is browser emulation, not a physical-device test.

## Outstanding evidence

- Vultr account accessed: $200 remaining credit confirmed, no existing instances. A 2 vCPU / 4 GB / 80 GB shared Compute instance in Bangalore with Ubuntu 24.04 LTS and automatic backups is configured ($24/month including backups). No instance has been provisioned yet; final cost and SSH-access approval are still required by the browser action policy.
- Public deployment URL with the new independent email/guest sign-in.
- Screenshots and final video of the app actually running on Vultr.
- Real user interviews across three or more countries.

The existing private Sites URL is an earlier prototype. It is not the new Vultr release and is not evidence of Vultr deployment.
