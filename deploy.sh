#!/bin/bash

# Connectify Backend Deployment Script
# This script helps deploy the backend to EC2 with Docker Compose

echo "🚀 Starting Connectify Backend Deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.production .env
    echo "⚠️  Please update the .env file with your actual configuration values before running again."
    exit 1
fi

# Create uploads directory if it doesn't exist
mkdir -p uploads

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Remove old images (optional)
echo "🧹 Cleaning up old images..."
docker system prune -f

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

# Run database migrations
echo "🗄️  Running database migrations..."
docker-compose exec backend npx prisma migrate deploy

# Check health
echo "🏥 Checking service health..."
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy and running!"
else
    echo "❌ Backend health check failed. Check logs with: docker-compose logs backend"
fi

echo "🎉 Deployment completed!"
echo "📊 View logs with: docker-compose logs -f"
echo "🛑 Stop services with: docker-compose down"






