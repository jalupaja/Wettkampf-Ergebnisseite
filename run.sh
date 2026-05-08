#!/usr/bin/env bash

echo "Starte Backend und Frontend..."

# Backend starten
cd Backend
npm install
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
