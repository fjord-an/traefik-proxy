#!/bin/bash
# PaceySpace Workspace Certificate Installer
# Run with: sudo bash install-linux.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}==========================================${NC}"
echo -e "${CYAN}  PaceySpace Workspace Setup${NC}"
echo -e "${CYAN}==========================================${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}⚠️  Please run as root (use sudo)${NC}"
    exit 1
fi

# Detect distribution
if [ -f /etc/debian_version ]; then
    DISTRO="debian"
    UPDATE_CMD="update-ca-certificates"
elif [ -f /etc/redhat-release ]; then
    DISTRO="redhat"
    UPDATE_CMD="update-ca-trust extract"
elif [ -f /etc/fedora-release ]; then
    DISTRO="fedora"
    UPDATE_CMD="update-ca-trust extract"
elif [ -f /etc/arch-release ]; then
    DISTRO="arch"
    UPDATE_CMD="trust extract-compat"
else
    DISTRO="unknown"
    UPDATE_CMD=""
fi

# Download certificate
CERT_URL="https://onboarding.pspace/assets/paceyspace-ca.crt"
TEMP_CERT="/tmp/paceyspace-ca.crt"

echo -e "${BLUE}📥 Downloading certificate...${NC}"
if command -v curl &> /dev/null; then
    curl -fsSL "$CERT_URL" -o "$TEMP_CERT"
elif command -v wget &> /dev/null; then
    wget -q "$CERT_URL" -O "$TEMP_CERT"
else
    echo -e "${RED}❌ Neither curl nor wget found. Please install one of them.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Certificate downloaded${NC}"

# Install certificate
echo ""
echo -e "${BLUE}🔐 Installing certificate...${NC}"

if [ "$DISTRO" = "debian" ] || [ "$DISTRO" = "unknown" ]; then
    # Debian/Ubuntu and generic
    CERT_DIR="/usr/local/share/ca-certificates"
    mkdir -p "$CERT_DIR"
    cp "$TEMP_CERT" "$CERT_DIR/paceyspace-ca.crt"
    
    if command -v update-ca-certificates &> /dev/null; then
        update-ca-certificates
    else
        # Fallback: append to ca-bundle
        if [ -f /etc/ssl/certs/ca-certificates.crt ]; then
            cat "$TEMP_CERT" >> /etc/ssl/certs/ca-certificates.crt
        fi
    fi
elif [ "$DISTRO" = "redhat" ] || [ "$DISTRO" = "fedora" ]; then
    # RHEL/CentOS/Fedora
    CERT_DIR="/etc/pki/ca-trust/source/anchors"
    mkdir -p "$CERT_DIR"
    cp "$TEMP_CERT" "$CERT_DIR/paceyspace-ca.crt"
    update-ca-trust extract
elif [ "$DISTRO" = "arch" ]; then
    # Arch Linux
    CERT_DIR="/etc/ca-certificates/trust-source/anchors"
    mkdir -p "$CERT_DIR"
    cp "$TEMP_CERT" "$CERT_DIR/paceyspace-ca.crt"
    trust extract-compat
fi

# Cleanup
rm -f "$TEMP_CERT"

# Verify
echo ""
echo -e "${BLUE}🔍 Verifying installation...${NC}"
if openssl x509 -in "$CERT_DIR/paceyspace-ca.crt" -noout &> /dev/null; then
    echo -e "${GREEN}✅ Certificate is valid${NC}"
else
    echo -e "${YELLOW}⚠️  Could not verify certificate, but installation was attempted${NC}"
fi

# Print info
CERT_INFO=$(openssl x509 -in "$CERT_DIR/paceyspace-ca.crt" -noout -subject -issuer -dates 2>/dev/null || echo "Could not read certificate info")

echo ""
echo -e "${CYAN}==========================================${NC}"
echo -e "${GREEN}  🎉 You're all set!${NC}"
echo -e "${CYAN}==========================================${NC}"
echo ""
echo -e "${NC}   You can now access PaceySpace services:${NC}"
echo -e "   • ${CYAN}https://nebula.pspace${NC}"
echo -e "   • ${CYAN}https://webmail.pspace${NC}"
echo -e "   • ${CYAN}https://engine.pspace${NC}"
echo ""
echo -e "${YELLOW}   Note: Close and reopen your browser to clear any cached warnings.${NC}"
echo ""
echo -e "${NC}   Certificate details:${NC}"
echo "$CERT_INFO" | sed 's/^/   /'
echo ""
