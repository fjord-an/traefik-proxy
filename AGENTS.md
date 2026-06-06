# AGENTS.md — PaceySpace Traefik Proxy (LXC 251)

Last updated: 2026-06-05

---

## Overview

Traefik reverse proxy running on **LXC 251** (`traefik-proxy`) on Proxmox Sirius. Provides friendly `*.pspace` domain names for all intranet web services — no ports required.

**LXC:** 251 (`traefik-proxy`)  
**LAN IP:** `192.168.0.251`  
**Tailscale IP:** `100.70.175.38` (`tag:proxy`)  
**Dashboard:** `https://proxy.pspace` (Tailnet access)  
**Ports:** `80` (HTTP→HTTPS redirect), `443` (HTTPS), `8080` (dashboard)

---

## Architecture

```
Colleague (Tailnet) → AdGuard DNS (100.121.252.126) resolves *.pspace → 100.70.175.38
Colleague (Tailnet) → Traefik :443 (LXC 251) → routes by Host header to backend
```

All `.pspace` names answer the **Traefik Tailscale IP**. Traefik inspects the `Host:` header and proxies to the correct backend service and port behind the scenes.

---

## Service Catalog (*.pspace)

| Domain | Backend | Protocol | Notes |
|--------|---------|----------|-------|
| `yendorcats.pspace` | `192.168.0.150:30080` | HTTP | K3s NodePort |
| `openwebui.pspace` | `192.168.0.150:30030` | HTTP | K3s NodePort |
| `registry.pspace` | `192.168.0.150:30500` | HTTP | K3s NodePort |
| `engine.pspace` | `100.76.111.24:5678` | HTTP | n8n |
| `nebula.pspace` | `192.168.0.200:80` | HTTP | Nextcloud |
| `enhance-cp.pspace` | `100.94.214.49:2087` | HTTPS | Enhance CP (skip verify) |
| `mail.pspace` | `192.168.0.33:8080` | HTTP | Stalwart admin |
| `webmail.pspace` | `192.168.0.33:8081` | HTTP | Snappymail |
| `proxmox-sirius.pspace` | `192.168.0.133:8006` | HTTPS | Proxmox UI (skip verify) |
| `proxmox-orion.pspace` | `192.168.0.92:8006` | HTTPS | Proxmox UI (skip verify) |
| `dns.pspace` | `192.168.0.250:3000` | HTTP | AdGuard UI |
| `proxy.pspace` | `192.168.0.251:8080` | HTTP | This dashboard |
| `onboarding.pspace` | `192.168.0.251:8082` | HTTP | Onboarding portal |

---

## Onboarding Portal

### For New Colleagues

New team members should visit `https://onboarding.pspace` to set up their device.

**What it does:**
- Auto-detects the user's operating system (macOS, Windows, Linux, iOS, Android)
- Provides one-click certificate installation via `.mobileconfig` (Apple), PowerShell (Windows), or Bash (Linux)
- Runs connection tests to verify DNS, Tailscale, and HTTPS certificate trust
- Includes email provisioning request form
- Shows a catalog of all available `.pspace` services

### Certificate Installation

| OS | Method | File |
|---|---|---|
| **macOS** | `.mobileconfig` profile | `paceyspace-ca.mobileconfig` |
| **iOS** | `.mobileconfig` profile | `paceyspace-ca.mobileconfig` |
| **Windows** | PowerShell one-liner | `install-windows.ps1` |
| **Linux** | Bash one-liner | `install-linux.sh` |
| **Android** | Manual `.crt` install | `paceyspace-ca.crt` |

### Files

All onboarding files are served from `/etc/traefik/onboarding/`:
- `index.html` — Main portal page
- `assets/onboarding.css` — Styles
- `assets/onboarding.js` — OS detection, test suite, email form
- `assets/paceyspace-ca.crt` — Internal CA certificate
- `assets/paceyspace-ca.mobileconfig` — Apple Configuration Profile
- `assets/install-windows.ps1` — Windows install script
- `assets/install-linux.sh` — Linux install script

---

## SSH Access

```bash
ssh -i ~/.ssh/sirius_nextcloud_build root@192.168.0.251
```

---

## Service Management

```bash
# Status
cd /etc/traefik && docker compose ps

# Restart
cd /etc/traefik && docker compose restart

# View logs
docker logs traefik -f

# Reload dynamic config (file provider watch is enabled; usually automatic)
curl -X POST http://localhost:8080/api/providers/file/reload
```

---

## Internal CA

Traefik serves `*.pspace` via an **internal CA** (not publicly trusted). Colleagues must import the root CA once:

```bash
# Download CA cert from the proxy (available over HTTP for convenience)
curl -o paceyspace-ca.crt http://proxy.pspace/ca.crt
# Or copy from the LXC directly:
scp root@192.168.0.251:/etc/traefik/certs/ca.crt ./paceyspace-ca.crt
```

Then install `paceyspace-ca.crt` into the system/browser trust store:
- **macOS:** Open Keychain Access → System keychain → import → set to "Always Trust"
- **Windows:** certmgr → Trusted Root Certification Authorities → import
- **Linux:** `sudo cp paceyspace-ca.crt /usr/local/share/ca-certificates/ && sudo update-ca-certificates`

---

## Updating Routes

Edit `/etc/traefik/dynamic/services.yml` on LXC 251 (or in this repo under `traefik/dynamic/services.yml`), then either:
1. Wait for Traefik's file provider `watch: true` to auto-reload (~1-2s)
2. Or trigger manual reload: `curl -X POST http://localhost:8080/api/providers/file/reload`

After changes, sync back to the repo:
```bash
scp root@192.168.0.251:/etc/traefik/dynamic/services.yml traefik/dynamic/services.yml
```

---

## Re-deploy from Repo

```bash
# From this repo root
scp -r traefik/* root@192.168.0.251:/etc/traefik/
ssh root@192.168.0.251 "cd /etc/traefik && docker compose restart"
```

---

## LXC Specs

```yaml
vmid: 251
hostname: traefik-proxy
ostype: ubuntu (24.04)
cores: 1
memory: 512
swap: 256
rootfs: local-lvm:8G
net0: vmbr0, 192.168.0.251/24
features: nesting=1, keyctl=1, /dev/net/tun mounted
unprivileged: 1
onboot: 1
```

---

## Related Docs

- `../dns/AGENTS.md` — AdGuard DNS server
- `../INFRASTRUCTURE.md` — Full infrastructure map
- `../tailscale-config/tailnet-policy.json` — ACL (tag:proxy grants)
