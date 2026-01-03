#!/bin/bash

# KURA OS Development Stop Script

# Change to repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}/.."

echo "🛑 Stopping KURA OS Development Environment..."

# Stop Stripe webhook if running
if [ -f logs/.stripe-webhook.pid ]; then
    STRIPE_PID=$(cat logs/.stripe-webhook.pid)
    echo "   Stopping Stripe webhook (PID: $STRIPE_PID)..."
    kill $STRIPE_PID 2>/dev/null
    rm logs/.stripe-webhook.pid
fi

# Stop ngrok if running
if [ -f logs/.ngrok.pid ]; then
    NGROK_PID=$(cat logs/.ngrok.pid)
    echo "   Stopping ngrok tunnel (PID: $NGROK_PID)..."
    kill $NGROK_PID 2>/dev/null
    rm logs/.ngrok.pid
fi

# Stop Marketing app if running
if [ -f logs/.marketing.pid ]; then
    MARKETING_PID=$(cat logs/.marketing.pid)
    echo "   Stopping Marketing app (PID: $MARKETING_PID)..."
    kill $MARKETING_PID 2>/dev/null
    rm logs/.marketing.pid
fi

# Stop Docker containers
echo "   Stopping Docker containers..."
docker-compose down

echo "✅ All services stopped."
