#!/bin/bash

# TherapistOS Development Stop Script

echo "🛑 Stopping TherapistOS Development Environment..."

# Stop Stripe webhook if running
if [ -f .stripe-webhook.pid ]; then
    STRIPE_PID=$(cat .stripe-webhook.pid)
    echo "   Stopping Stripe webhook (PID: $STRIPE_PID)..."
    kill $STRIPE_PID 2>/dev/null
    rm .stripe-webhook.pid
fi

# Stop ngrok if running
if [ -f .ngrok.pid ]; then
    NGROK_PID=$(cat .ngrok.pid)
    echo "   Stopping ngrok tunnel (PID: $NGROK_PID)..."
    kill $NGROK_PID 2>/dev/null
    rm .ngrok.pid
fi

# Stop Docker containers
echo "   Stopping Docker containers..."
docker-compose down

echo "✅ All services stopped."
