#!/bin/bash

# TherapistOS Development Startup Script
# This script starts all services including Stripe webhook listener

echo "🚀 Starting TherapistOS Development Environment..."

# Check if .env files exist
if [ ! -f backend/.env ]; then
    echo "⚠️  Warning: backend/.env not found. Copy backend/.env.example and configure it."
fi

# Start Docker services
echo "📦 Starting Docker containers..."
docker-compose up -d

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 5

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "⚠️  Stripe CLI not found. Webhook listener will not start."
    echo "   Install it from: https://stripe.com/docs/stripe-cli"
else
    # Start Stripe webhook listener in background
    echo "🎧 Starting Stripe webhook listener..."
    stripe listen --forward-to localhost:8001/api/v1/payments/webhook > stripe-webhook.log 2>&1 &
    STRIPE_PID=$!
    echo "   Stripe webhook PID: $STRIPE_PID"
    echo $STRIPE_PID > .stripe-webhook.pid
fi

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "⚠️  ngrok not found. Twilio webhooks will not work."
    echo "   Install it from: https://ngrok.com/download"
else
    # Start ngrok tunnel for Twilio webhooks in background
    echo "🌐 Starting ngrok tunnel for Twilio..."
    ngrok http 8001 > ngrok.log 2>&1 &
    NGROK_PID=$!
    echo "   ngrok PID: $NGROK_PID"
    echo $NGROK_PID > .ngrok.pid
    
    # Wait for ngrok to start and get URL
    sleep 3
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | grep -o 'https://[^"]*' | head -1)
    if [ ! -z "$NGROK_URL" ]; then
        echo "   ngrok URL: $NGROK_URL"
        echo "   📱 Configure Twilio webhook: $NGROK_URL/api/v1/webhooks/twilio/whatsapp"
    fi
fi

echo ""
echo "✅ TherapistOS is running!"
echo ""
echo "📍 Services:"
echo "   - Frontend: http://localhost:3001"
echo "   - Backend:  http://localhost:8001"
echo "   - Database: localhost:5433"
echo ""
echo "📝 Logs:"
echo "   - Docker:  docker-compose logs -f"
echo "   - Stripe:  tail -f stripe-webhook.log"
echo ""
echo "🛑 To stop: ./scripts/stop-dev.sh"
