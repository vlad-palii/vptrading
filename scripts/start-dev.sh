#!/bin/bash

# Start development servers

set -e

cd "$(dirname "$0")/.."

echo "Starting BNB/USDT Trading Application..."
echo ""
echo "Backend API:     http://localhost:3001"
echo "Backend WS:      ws://localhost:3002/ws"
echo "Frontend:        http://localhost:5173"
echo ""

npm run dev
