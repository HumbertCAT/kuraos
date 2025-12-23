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
        TWILIO_WEBHOOK_URL="${NGROK_URL}/api/v1/webhooks/twilio/whatsapp"
        echo "   📱 Twilio webhook: $TWILIO_WEBHOOK_URL"
        
        # Auto-configure Twilio Sandbox Webhook (if credentials exist in .env)
        if [ -f backend/.env ]; then
            TWILIO_SID=$(grep -E '^TWILIO_ACCOUNT_SID=' backend/.env | cut -d'=' -f2)
            TWILIO_TOKEN=$(grep -E '^TWILIO_AUTH_TOKEN=' backend/.env | cut -d'=' -f2)
            TWILIO_PHONE=$(grep -E '^TWILIO_WHATSAPP_NUMBER=' backend/.env | cut -d'=' -f2 | tr -d '+')
            
            if [ ! -z "$TWILIO_SID" ] && [ ! -z "$TWILIO_TOKEN" ] && [ "$TWILIO_SID" != "placeholder" ]; then
                echo "   🔄 Updating Twilio Sandbox webhook via API..."
                # Update the WhatsApp Sandbox webhook URL
                TWILIO_RESPONSE=$(curl -s -X POST \
                    "https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/IncomingPhoneNumbers.json" \
                    -u "${TWILIO_SID}:${TWILIO_TOKEN}" \
                    -d "SmsUrl=${TWILIO_WEBHOOK_URL}" \
                    -d "PhoneNumber=+${TWILIO_PHONE}" 2>/dev/null)
                
                if echo "$TWILIO_RESPONSE" | grep -q '"sid"'; then
                    echo "   ✅ Twilio webhook updated automatically!"
                else
                    echo "   ⚠️  Auto-update failed. Configure manually: $TWILIO_WEBHOOK_URL"
                    echo "      Go to: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn"
                fi
            else
                echo "   ℹ️  Twilio credentials not found. Configure webhook manually:"
                echo "      $TWILIO_WEBHOOK_URL"
            fi
        fi
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
