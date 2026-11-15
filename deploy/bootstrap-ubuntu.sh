#!/usr/bin/env bash
# Run from the checkout on a fresh Ubuntu 24.04 Vultr instance, as root.
# APP_DOMAIN must already resolve to this server. Secrets are generated locally.
set -euo pipefail
if [[ $(id -u) != 0 ]]; then printf '%s\n' 'Run this script as root.' >&2; exit 1; fi
if [[ ! ${APP_DOMAIN:-} =~ ^[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
  printf '%s\n' 'Set APP_DOMAIN to the public DNS hostname.' >&2; exit 1
fi
cd "$(dirname "${BASH_SOURCE[0]}")/.."
source /etc/os-release
if [[ $ID != ubuntu || $VERSION_ID != 24.04 ]]; then
  printf '%s\n' 'This bootstrap targets Ubuntu 24.04 LTS.' >&2; exit 1
fi
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates curl git openssl ufw
if ! command -v docker >/dev/null || ! docker compose version >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  cat > /etc/apt/sources.list.d/docker.sources <<REPO
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: noble
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
REPO
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
systemctl enable --now docker
if [[ ! -f .env.production ]]; then
  umask 077
  printf 'BORROW_MASTER_KEY=%s\nBORROW_ALLOW_LOCAL_DEMO=false\nBORROW_REQUIRE_D1=0\nOPENAI_API_KEY=\nAPP_DOMAIN=%s\n' "$(openssl rand -hex 32)" "$APP_DOMAIN" > .env.production
fi
chmod 600 .env.production
# Restrict SSH to the current operator when an SSH connection is available.
connection=${SSH_CONNECTION:-}
operator_ip=${connection%% *}
if [[ -n $operator_ip && $operator_ip =~ ^[0-9a-fA-F:.]+$ ]]; then
  ufw allow from "$operator_ip" to any port 22 proto tcp
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw allow 443/udp
  ufw --force enable
fi
export APP_DOMAIN
docker compose --env-file .env.production -f deploy/compose.yaml config --quiet
docker compose --env-file .env.production -f deploy/compose.yaml up -d --build
docker compose --env-file .env.production -f deploy/compose.yaml ps
printf 'BORROW started. Verify HTTPS at https://%s/api/health before sharing.\n' "$APP_DOMAIN"
