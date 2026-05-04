#!/usr/bin/env bash

set -e

echo "🔨 Building Wettkampf Docker images..."
echo ""

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Image names and tags
BACKEND_IMAGE="wettkampf-backend:latest"
FRONTEND_IMAGE="wettkampf-frontend:latest"

echo "📦 Building backend image: $BACKEND_IMAGE"
docker build -t "$BACKEND_IMAGE" ./Backend
echo "✅ Backend image built"
echo ""

echo "📦 Building frontend image: $FRONTEND_IMAGE"
docker build -t "$FRONTEND_IMAGE" ./Frontend
echo "✅ Frontend image built"
echo ""

echo "✅ Both images built successfully!"
echo ""
echo "📋 Images created:"
echo "   - $BACKEND_IMAGE"
echo "   - $FRONTEND_IMAGE"
echo ""
echo "🚀 Now you can:"
echo "   1. Run locally:    docker-compose up"
echo "   2. Share images:   docker save -o wettkampf-images.tar $BACKEND_IMAGE $FRONTEND_IMAGE"
echo "   3. Load on another computer: docker load -i wettkampf-images.tar"
echo ""
