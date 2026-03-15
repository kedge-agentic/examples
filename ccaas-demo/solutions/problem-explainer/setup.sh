#!/bin/bash

# Problem Explainer Solution Setup Script
# This script builds and starts all services

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================"
echo "Problem Explainer Solution Setup"
echo "========================================"

# Check if CCAAS backend is running
if ! curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "⚠️  Warning: CCAAS backend not detected at localhost:3001"
    echo "   Please start CCAAS first: cd ../.. && npm run dev:backend"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."

if [ -d "mcp-server" ]; then
    echo "  → MCP Server..."
    cd mcp-server && npm install && npm run build && cd ..
fi

if [ -d "backend" ]; then
    echo "  → Backend..."
    cd backend && npm install && cd ..
fi

if [ -d "frontend" ]; then
    echo "  → Frontend..."
    cd frontend && npm install && cd ..
fi

echo ""
echo "✅ Dependencies installed!"

# Inject skills
echo ""
echo "🔧 Injecting skills..."
if [ -f "inject-skills.sh" ]; then
    chmod +x inject-skills.sh
    ./inject-skills.sh || echo "⚠️  Skill injection failed (CCAAS may not be running)"
fi

# Start services
echo ""
echo "🚀 Starting services..."
echo ""

# Start backend in background
if [ -d "backend" ]; then
    echo "Starting backend on port 3003..."
    cd backend
    npm run start:dev &
    BACKEND_PID=$!
    cd ..
fi

# Wait for backend
sleep 3

# Start frontend
if [ -d "frontend" ]; then
    echo "Starting frontend on port 5281..."
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd ..
fi

echo ""
echo "========================================"
echo "✅ Problem Explainer is running!"
echo ""
echo "   Frontend: http://localhost:5281"
echo "   Backend:  http://localhost:3003"
echo "   CCAAS:    http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all services"
echo "========================================"

# Wait for processes
wait
