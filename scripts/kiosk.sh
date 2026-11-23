#!/usr/bin/env bash
# Compila el proyecto, arranca el backend en producción y abre Google Chrome
# a pantalla completa (modo kiosk) apuntando al dashboard.
# Al cerrar Chrome (Alt+F4) o pulsar Ctrl+C se detiene también el backend.
#
# Uso: scripts/kiosk.sh [--skip-build]
# Variables opcionales: CHROME_BIN (navegador a usar), PORT (por defecto, el de .env o 3000).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

SKIP_BUILD=false
[[ "${1:-}" == "--skip-build" ]] && SKIP_BUILD=true

# Puerto: variable de entorno > .env > 3000
if [[ -z "${PORT:-}" && -f .env ]]; then
  PORT="$(grep -E '^PORT=' .env | tail -n1 | cut -d= -f2- | tr -d '[:space:]"' || true)"
fi
PORT="${PORT:-3000}"
URL="http://localhost:${PORT}"

for cmd in node npm curl; do
  command -v "$cmd" >/dev/null || { echo "Error: falta '$cmd'. Consulta los requisitos previos del README." >&2; exit 1; }
done

CHROME_BIN="${CHROME_BIN:-$(command -v google-chrome-stable || command -v google-chrome || command -v chromium-browser || true)}"
if [[ -z "$CHROME_BIN" ]]; then
  echo "Error: no se encontró Google Chrome. Instálalo con: sudo dnf install google-chrome-stable" >&2
  exit 1
fi

[[ -f .env ]] || echo "Aviso: no existe .env; se usarán los valores por defecto." >&2
[[ -d node_modules ]] || { echo "Instalando dependencias..."; npm ci; }

if [[ "$SKIP_BUILD" == false ]]; then
  echo "Compilando..."
  npm run build
fi

if curl -fsS "${URL}/api/health" >/dev/null 2>&1; then
  echo "Error: ya hay un servicio escuchando en ${URL}. Detenlo o usa otro PORT." >&2
  exit 1
fi

echo "Arrancando backend en ${URL}..."
NODE_ENV=production PORT="$PORT" node apps/backend/dist/server.js &
BACKEND_PID=$!

cleanup() {
  if kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo "Deteniendo backend..."
    kill -TERM "$BACKEND_PID" 2>/dev/null || true
    wait "$BACKEND_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT
trap 'exit 130' INT TERM

# Espera a que el backend responda (máx. 30 s)
for _ in $(seq 1 60); do
  curl -fsS "${URL}/api/health" >/dev/null 2>&1 && break
  kill -0 "$BACKEND_PID" 2>/dev/null || { echo "Error: el backend terminó inesperadamente." >&2; exit 1; }
  sleep 0.5
done
curl -fsS "${URL}/api/health" >/dev/null 2>&1 || { echo "Error: el backend no respondió a tiempo." >&2; exit 1; }

# Perfil propio: si Chrome ya está abierto con el perfil normal, ignoraría --kiosk
# y abriría una pestaña en la ventana existente.
PROFILE_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/weatherdash-kiosk"
mkdir -p "$PROFILE_DIR"

echo "Abriendo Chrome en modo kiosk (Alt+F4 para salir)..."
"$CHROME_BIN" \
  --kiosk \
  --user-data-dir="$PROFILE_DIR" \
  --ozone-platform-hint=auto \
  --no-first-run \
  --no-default-browser-check \
  --noerrdialogs \
  --disable-infobars \
  --disable-translate \
  --disable-session-crashed-bubble \
  --check-for-update-interval=31536000 \
  "$URL" || true
