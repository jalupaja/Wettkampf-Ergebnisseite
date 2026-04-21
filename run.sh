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
npm run dev &
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
