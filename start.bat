@echo off
REM Tractocamión 4.0 - Startup Script for Windows

echo 🚛 Tractocamión 4.0 - Sistema de Gestión Logística
echo ==================================================

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error: Node.js is not installed
    echo 📦 Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js is installed
node --version
npm --version

REM Check if node_modules exists
if not exist "node_modules\" (
    echo 📦 Installing dependencies...
    call npm install
)

REM Set default port if not set
if not defined PORT set PORT=3000

echo 🚀 Starting Tractocamión server on port %PORT%...
echo 🌐 Access the dashboard at: http://localhost:%PORT%
echo 📡 API available at: http://localhost:%PORT%/api
echo ==================================================
echo.

REM Start the server
node src\server\index.js
