#!/usr/bin/env bash
# Bootstrap SSH key auth + base packages on local Ubuntu host "chucky".
# Run from the Mac:
#   ./scripts/bootstrap-chucky.sh
#
# Uses password once (ssh-copy-id). After KEY_OK, prefer: ssh chucky

set -euo pipefail

HOST="${CHUCKY_HOST:-192.168.68.117}"
USER_NAME="${CHUCKY_USER:-chucky}"
KEY="${CHUCKY_KEY:-$HOME/.ssh/chucky_ed25519}"

if [[ ! -f "$KEY" ]]; then
  ssh-keygen -t ed25519 -f "$KEY" -N "" -C "chucky-admin-$(whoami)@$(hostname -s)"
fi

if [[ ! -f "$HOME/.ssh/config" ]] || ! grep -q 'Host chucky' "$HOME/.ssh/config" 2>/dev/null; then
  cat >> "$HOME/.ssh/config" <<EOF

# BEGIN dhaliora-lab
Host chucky
  HostName ${HOST}
  User ${USER_NAME}
  IdentityFile ${KEY}
  IdentitiesOnly yes
  ServerAliveInterval 30
  ServerAliveCountMax 3

Host dhaliora assistant.dhalia.fun
  HostName assistant.dhalia.fun
  User deploy
  IdentityFile ~/.ssh/dhaliora_deploy
  IdentitiesOnly yes
  ServerAliveInterval 30
  ServerAliveCountMax 3
# END dhaliora-lab
EOF
  chmod 600 "$HOME/.ssh/config"
fi

echo "Installing public key on ${USER_NAME}@${HOST} (password prompt once)..."
ssh-copy-id -i "${KEY}.pub" -o StrictHostKeyChecking=accept-new "${USER_NAME}@${HOST}"

echo "Verifying key login..."
ssh -i "$KEY" -o BatchMode=yes -o IdentitiesOnly=yes "${USER_NAME}@${HOST}" 'echo KEY_OK; hostname; whoami; head -5 /etc/os-release'

echo "Done. Next: ssh chucky"
