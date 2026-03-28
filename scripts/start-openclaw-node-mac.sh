#!/usr/bin/env bash
# Install/start the OpenClaw node on macOS (user service) after verifying Tailscale.
#
# Uso:
#   ./scripts/start-openclaw-node-mac.sh              # openclaw node install + status (segundo plano)
#   ./scripts/start-openclaw-node-mac.sh --foreground # openclaw node run (terminal colgada, debug)
#
# Prerrequisito: Tailscale conectado. Config: scripts/mac-node.env o ~/.openclaw-node.env
#
# Tras install:  openclaw node status | stop | restart | uninstall

set -euo pipefail

# Homebrew bins (gh, etc.) for child processes spawned by the node host
export PATH="/opt/homebrew/bin:/usr/local/bin:${PATH:-}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

ENV_FILE=""
for candidate in "${SCRIPT_DIR}/mac-node.env" "${HOME}/.openclaw-node.env"; do
  if [[ -f "$candidate" ]]; then
    ENV_FILE="$candidate"
    break
  fi
done

if [[ -z "$ENV_FILE" ]]; then
  echo "No se encontró configuración."
  echo "  cp ${SCRIPT_DIR}/mac-node.env.example ${SCRIPT_DIR}/mac-node.env"
  echo "  Edita mac-node.env (TOKEN, HOST, etc.) y: chmod 600 ${SCRIPT_DIR}/mac-node.env"
  exit 1
fi

# shellcheck source=/dev/null
set -a
source "$ENV_FILE"
set +a

: "${OPENCLAW_GATEWAY_HOST:?Falta OPENCLAW_GATEWAY_HOST en ${ENV_FILE}}"
: "${OPENCLAW_GATEWAY_TOKEN:?Falta OPENCLAW_GATEWAY_TOKEN en ${ENV_FILE}}"

PORT="${OPENCLAW_GATEWAY_PORT:-18789}"
export OPENCLAW_ALLOW_INSECURE_PRIVATE_WS="${OPENCLAW_ALLOW_INSECURE_PRIVATE_WS:-1}"
export OPENCLAW_GATEWAY_TOKEN

echo "=== OpenClaw node (Mac) ==="
echo ""
echo "GitHub CLI: las herramientas que ejecuten \`gh\` en este nodo usan tu login de"
echo "  gh auth login  (~/.config/gh/). No hace falta GH_TOKEN en el VPS para eso."
echo ""

if command -v gh &>/dev/null; then
  if ! gh auth status &>/dev/null; then
    echo "gh está instalado pero no hay sesión activa. Ejecuta: gh auth login"
    exit 1
  fi
  echo "gh: sesión activa."
else
  echo "Aviso: no se encontró \`gh\` en PATH (brew install gh)."
fi
echo ""

echo "Antes de continuar: confirma que Tailscale está activo (menú bar) y que este Mac"
echo "puede alcanzar el VPS en la tailnet (mismo tailnet que el gateway)."
echo ""

if ! command -v tailscale &>/dev/null; then
  echo "No está el comando 'tailscale' en el PATH."
  echo "Instala Tailscale desde https://tailscale.com o asegura el CLI (brew install tailscale)."
  exit 1
fi

if ! tailscale status &>/dev/null; then
  echo "Tailscale no responde o no está conectado."
  echo "Abre la app Tailscale, inicia sesión / conecta, y vuelve a ejecutar este script."
  exit 1
fi

echo "Tailscale: OK (tailscale status)"
echo "Gateway: ${OPENCLAW_GATEWAY_HOST}:${PORT}"
echo ""

if [[ "${1:-}" == "--foreground" || "${1:-}" == "--run" ]]; then
  echo "Modo primer plano (openclaw node run). Ctrl+C para detener el nodo."
  echo ""
  exec openclaw node run --host "$OPENCLAW_GATEWAY_HOST" --port "$PORT"
fi

INSTALL_ARGS=(--host "$OPENCLAW_GATEWAY_HOST" --port "$PORT")
[[ "${OPENCLAW_NODE_FORCE_INSTALL:-}" == "1" ]] && INSTALL_ARGS+=(--force)

echo "Si tenías \`openclaw node run\` en otra terminal, deténlo (Ctrl+C) antes de continuar."
echo ""
echo "Instalando / actualizando servicio de nodo (segundo plano)..."
openclaw node install "${INSTALL_ARGS[@]}"

echo ""
openclaw node status
echo ""
echo "Listo. El nodo queda en segundo plano (login LaunchAgent / servicio de usuario)."
echo "  Parar:    openclaw node stop"
echo "  Reiniciar: openclaw node restart"
echo "  Quitar:   openclaw node uninstall"
echo "Modo terminal colgada (debug): $0 --foreground"
