#!/bin/bash

# Tractocamión 4.0 - Startup Script for Linux/macOS/Termux

echo "🚛 Tractocamión 4.0 - Sistema de Gestión Logística"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "📦 Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo "🌍 Platform: $(uname -s)"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if PORT is set
if [ -z "$PORT" ]; then
    export PORT=3000
fi

echo "🚀 Starting Tractocamión server on port $PORT..."
echo "🌐 Access the dashboard at: http://localhost:$PORT"
echo "📡 API available at: http://localhost:$PORT/api"
echo "=================================================="
echo ""

# Start the server
node src/server/index.js
