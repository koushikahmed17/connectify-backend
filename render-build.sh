#!/usr/bin/env bash
# Render build script for Connectify Backend

set -o errexit

echo "Installing dependencies..."
npm install

echo "Generating Prisma Client..."
npx prisma generate

echo "Building application..."
npm run build

echo "Running database migrations..."
npx prisma migrate deploy

echo "Build completed successfully!"


