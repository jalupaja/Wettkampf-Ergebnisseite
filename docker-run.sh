#!/usr/bin/env bash

set -e

echo "🚀 Building and starting Wettkampf with Docker Compose..."
echo ""

# Check if docker and docker-compose are installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "📦 Building Docker images..."
docker-compose build

echo ""
echo "🟢 Starting services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "✅ Wettkampf is running!"
    echo ""
    echo "📍 Access the application:"
    echo "   Frontend:  http://localhost:5173"
    echo "   Backend:   http://localhost:3001"
    echo "   API Docs:  http://localhost:3001/api/config"
    echo ""
    echo "📝 Useful commands:"
    echo "   View logs:     docker-compose logs -f"
    echo "   Backend logs:  docker-compose logs -f backend"
    echo "   Frontend logs: docker-compose logs -f frontend"
    echo "   Stop:          docker-compose down"
    echo "   Stop + remove volumes: docker-compose down -v"
    echo ""
else
    echo "❌ Failed to start services. Check logs with: docker-compose logs"
    exit 1
fi
