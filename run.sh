#!/usr/bin/env bash

echo "Starte Backend und Frontend..."

# Backend starten
cd Backend
npm install
# If something is already listening on the backend port, warn and skip killing it.
# Aggressively killing processes from a helper script caused the server to receive
# SIGTERM during normal operation. It's safer to warn and let the operator decide
# to free the port manually.
EXISTING_BACKEND=$(ss -ltnp 2>/dev/null | rg ":3001\b" --no-line-number || true)
if [ -n "$EXISTING_BACKEND" ]; then
  echo "Warning: port 3001 already in use. Not killing existing process. If you want a fresh start, stop the process using port 3001 and re-run this script."
fi

npm start &
BACKEND_PID=$!

cd ..

# Frontend starten
cd Frontend
npm install

# Start frontend robustly to avoid 'vite: Permission denied' when node_modules/.bin/vite
# may be non-executable (CI, mounted volumes). Try several fallbacks in order.
FRONTEND_PID=0
(
  set -e
  # Preferred: use npm exec to run the installed binary without relying on exec bit
    if npm exec --yes -- vite --version >/dev/null 2>&1; then
      # Start vite using npm exec. Do not attempt to kill existing vite
      # instances here - that can inadvertently terminate unrelated processes.
      npm exec -- vite -- --host 0.0.0.0 &
    elif npx --no-install vite --version >/dev/null 2>&1; then
      # npx may be present and can run the binary without exec bit
      npx vite --host 0.0.0.0 &
    elif [ -f node_modules/vite/bin/vite.js ]; then
      # Directly run the JS file with Node as a last-resort fallback
      node node_modules/vite/bin/vite.js --host 0.0.0.0 &
  else
    # Fall back to package.json script (may still fail if vite is missing)
    npm run dev &
  fi
)
FRONTEND_PID=$!

cd ..

echo ""
echo "======================================"
echo "Wettkampf wird gestartet..."
echo ""
echo "Backend:  http://0.0.0.0:3001"
echo "Frontend: http://0.0.0.0:5173"
echo ""
echo "======================================"
echo ""
echo "Zum Beenden: kill $BACKEND_PID $FRONTEND_PID"

# Auf Beenden warten
wait
