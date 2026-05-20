#!/bin/bash

# Smart Device Test Automation Framework - Setup Script

set -e

echo "🚀 Smart Device Test Automation & Monitoring Framework"
echo "=================================================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose"
    exit 1
fi

echo "✅ Node.js: $(node -v)"
echo "✅ Docker: $(docker -v)"
echo "✅ Docker Compose: $(docker-compose -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."

for service in backend-api device-simulator test-runner; do
    echo "  Installing $service dependencies..."
    cd "$service"
    npm install --silent
    cd ..
done

echo "✅ Dependencies installed"
echo ""

# Build Docker images
echo "🐳 Building Docker images..."
docker-compose build --no-cache 2>/dev/null
echo "✅ Docker images built"
echo ""

# Start services
echo "🚀 Starting services..."
docker-compose up -d
echo "✅ Services started"
echo ""

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo "🏥 Checking service health..."

services=(
    "Backend API:http://localhost:3000/health"
    "Device Sim 1:http://localhost:3001/health"
)

for service in "${services[@]}"; do
    IFS=':' read -r name url <<< "$service"
    if curl -s "$url" > /dev/null 2>&1; then
        echo "  ✅ $name is healthy"
    else
        echo "  ⚠️  $name is not responding yet"
    fi
done

echo ""
echo "=================================================="
echo "🎉 Setup Complete!"
echo "=================================================="
echo ""
echo "📊 Dashboard: http://localhost"
echo "🔌 Backend API: http://localhost:3000"
echo "📱 Device Simulator 1: http://localhost:3001"
echo ""
echo "🧪 To run tests:"
echo "   docker-compose exec test-runner npm run run-tests"
echo ""
echo "📋 To view logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 To stop all services:"
echo "   docker-compose down"
echo ""
