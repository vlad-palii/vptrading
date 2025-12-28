#!/bin/bash

# BNB/USDT Trading Application Setup Script

set -e

echo "Setting up BNB/USDT Trading Application..."

# Navigate to project root
cd "$(dirname "$0")/.."

# Create .env from example if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "Please edit .env and add your Binance API credentials"
fi

# Create data directory
mkdir -p data

# Install dependencies
echo "Installing dependencies..."
npm install

echo ""
echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env and add your Binance API credentials"
echo "   - Get testnet keys from: https://testnet.binance.vision/"
echo "2. Run 'npm run dev' to start the development servers"
echo ""
