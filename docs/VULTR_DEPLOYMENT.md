# Deploy BORROW on Vultr Compute

**Status:** deployment artifacts are built for Vultr; account provisioning is authorized and being prepared. Do not claim that the public Sites prototype is hosted on Vultr.

## Required account inputs

- A Vultr account with redeemed hackathon credits or an approved spending budget.
- An Ubuntu 24.04 Compute instance. 2 vCPU / 4 GB RAM is a reasonable starting point for building; check the current plan and credit eligibility in the console before provisioning.
- SSH access and a hostname with an A record pointing at the instance. Automatic HTTPS needs that hostname and open ports 80/443.
- Inbound SSH restricted to the operator's IP. The app's Node port is published only on loopback.

## Automated fresh-instance setup

The repository includes `deploy/bootstrap-ubuntu.sh` for a fresh Ubuntu 24.04 server. From the cloned checkout, as root over SSH, set `APP_DOMAIN` to a hostname that resolves to the instance and run:

```sh
APP_DOMAIN=borrow.your-domain.example bash deploy/bootstrap-ubuntu.sh
```

It installs Docker from the official repository, generates a server-only master key once, preserves existing secrets, restricts SSH to the current operator IP when available, and starts the persistent app plus Caddy. Review `docker compose ps` and the HTTPS health endpoint before sharing the URL. Retain console recovery access if your operator IP changes.

## Manual install and run

Install Docker Engine and the Compose plugin from Docker's official Ubuntu instructions. Clone the public repository, then:

```sh
git clone https://github.com/VijayabaskarR-06/borrow.git
cd borrow
cp .env.example .env.production
chmod 600 .env.production
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Set `BORROW_MASTER_KEY` in `.env.production` to that generated value; preserve it across deployments. Set `BORROW_ALLOW_LOCAL_DEMO=false`. Leave `OPENAI_API_KEY` empty for the labeled deterministic demo, or configure it privately to enable the model summary. The provider choice is included in the consent capsule.

Set your hostname and deploy:

```sh
export APP_DOMAIN=borrow.your-domain.example
docker compose --env-file .env.production -f deploy/compose.yaml up -d --build
docker compose --env-file .env.production -f deploy/compose.yaml ps
curl --fail https://$APP_DOMAIN/api/health
```

Caddy requests an HTTPS certificate automatically. The application container runs as a non-root user. Its encrypted persistent data is in the `borrow_data` volume; accounts, invoices, tasks and signing keys survive container recreation. Do not delete the volume or rotate the master key without a recovery plan.

`BORROW_PUBLIC_ORIGIN` is set by Compose to the HTTPS hostname so same-origin protection works behind the reverse proxy. Caddy overwrites `X-Real-IP`; do not expose Node's port directly to untrusted networks.

## Acceptance on the actual instance

1. Open the public URL in a fresh browser.
2. Use **Try the demo**. Confirm no ChatGPT account is requested.
3. Complete expense report, payroll denial, signature verification and tamper test.
4. Approve a second task, revoke its lease, and test invoice access; expect `LEASE_REVOKED`.
5. Create a disposable email account, sign out, sign back in, and confirm history survives.
6. Restart the app container and confirm persisted account/task data remains.
7. Run `node scripts/smoke.mjs https://$APP_DOMAIN` from your local machine. It creates only isolated guest test workspaces.
8. Run `node scripts/release-check.mjs https://$APP_DOMAIN` for production cookie flags, account lifecycle, uploads, independent receipt verification and cross-workspace document isolation.
9. Record the final walkthrough with the public URL and Vultr console/instance visible. Do not show API keys, SSH keys or billing details.

## Updates and backup

```sh
git pull --ff-only
docker compose --env-file .env.production -f deploy/compose.yaml up -d --build
```

Back up the Docker data volume while the app is stopped, and store the master key separately. Do not publish either backup. Keep a single app replica with the current filesystem adapter. The app returns safe errors; inspect server logs privately without exposing private user records.

Current deployment has application-level rate limiting, no email verification/recovery, no external audit witness and no operator-independent key trust. These are explicit limits, not production certification.
