#!/bin/bash
# Deploy Traefik from repo to LXC 251
set -e

LXC_IP="192.168.0.251"
SSH_KEY="${HOME}/.ssh/sirius_nextcloud_build"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Deploying Traefik to LXC 251 ($LXC_IP) ==="

# Sync config files
scp -i "$SSH_KEY" \
  "$REPO_DIR/traefik/traefik.yml" \
  "$REPO_DIR/traefik/docker-compose.yml" \
  root@$LXC_IP:/etc/traefik/

scp -i "$SSH_KEY" -r \
  "$REPO_DIR/traefik/dynamic/" \
  root@$LXC_IP:/etc/traefik/

# Restart Traefik
ssh -i "$SSH_KEY" root@$LXC_IP "cd /etc/traefik && docker compose restart"

echo "=== Traefik deployed and restarted ==="
