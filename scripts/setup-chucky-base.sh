#!/usr/bin/env bash
# Run ON chucky (after SSH key works):
#   ssh chucky 'bash -s' < scripts/setup-chucky-base.sh
# Or copy and run locally on the Ubuntu box.

set -euo pipefail

echo "==> apt update / base packages"
sudo apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y \
  ca-certificates curl gnupg lsb-release jq git vim ufw fail2ban \
  apt-transport-https software-properties-common

echo "==> Docker"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sudo sh
fi
sudo usermod -aG docker "$USER" || true

echo "==> Tailscale"
if ! command -v tailscale >/dev/null 2>&1; then
  curl -fsSL https://tailscale.com/install.sh | sh
fi

echo "==> OpenClaw deploy dirs"
sudo mkdir -p /home/chucky/openclaw/data/config /home/chucky/openclaw/data/workspace
sudo chown -R "$USER:$USER" /home/chucky/openclaw

echo "==> Cursor CLI"
if ! command -v agent >/dev/null 2>&1; then
  curl -fsS https://cursor.com/install | bash
  grep -q '.local/bin' "$HOME/.bashrc" 2>/dev/null || echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.bashrc"
fi

echo "==> GitHub CLI"
if ! command -v gh >/dev/null 2>&1; then
  (type -p wget >/dev/null || sudo apt-get install -y wget)
  sudo mkdir -p -m 755 /etc/apt/keyrings
  out=$(mktemp)
  wget -nv -O"$out" https://cli.github.com/packages/githubcli-archive-keyring.gpg
  cat "$out" | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg >/dev/null
  sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
    | sudo tee /etc/apt/sources.list.d/github-cli.list >/dev/null
  sudo apt-get update -y
  sudo apt-get install -y gh
fi

echo
echo "Base install done."
echo "NEXT (interactive on chucky):"
echo "  1) sudo tailscale up          # login URL"
echo "  2) newgrp docker || re-login  # docker without sudo"
echo "  3) agent login                # Cursor CLI"
echo "  4) gh auth login              # GitHub"
echo "  5) rotate the Linux password if it was shared in chat"
