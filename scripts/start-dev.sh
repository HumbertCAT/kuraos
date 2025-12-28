#!/bin/bash

# Kura OS Development Startup Script
# Usage: ./scripts/start-dev.sh [--clean|--reset]
#
# Options:
#   --clean, --reset    Delete database volume and start fresh

echo "🚀 Starting KuraOS Development Environment..."

# Parse arguments
CLEAN_START=false
for arg in "$@"; do
    case $arg in
        --clean|--reset)
            CLEAN_START=true
            shift
            ;;
    esac
done

# Handle clean start - ONLY way to delete data
if [ "$CLEAN_START" = true ]; then
    echo "⚠️  CLEAN START: Removing database volume..."
    docker-compose down -v
    echo "   Database volume deleted."
fi

# Check if .env file exists (single source of truth in project root)
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env not found. Copy .env.example to .env and configure it."
    echo "   Run: cp .env.example .env"
fi

# Start Docker services
echo "📦 Starting Docker containers..."
docker-compose up -d

# Wait for backend to be ready (includes auto-migration)
echo "⏳ Waiting for backend (includes auto-migration)..."
sleep 8

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

# Start marketing app on port 3002
echo "🌐 Starting Marketing app on port 3002..."
if [ -d "apps/marketing" ]; then
    cd apps/marketing
    # Install deps if needed (silently)
    if [ ! -d "node_modules" ]; then
        echo "   Installing marketing dependencies..."
        npm install --silent
    fi
    # Start on port 3002 in background
    npm run dev > ../../marketing.log 2>&1 &
    MARKETING_PID=$!
    echo "   Marketing PID: $MARKETING_PID"
    echo $MARKETING_PID > ../../.marketing.pid
    cd ../..
else
    echo "⚠️  apps/marketing not found. Skipping."
fi

echo ""
echo "✅ KURA OS is running!"
echo ""
echo "📍 Services:"
echo "   - Platform:  http://localhost:3001  (main app)"
echo "   - Marketing: http://localhost:3002  (landing page)"
echo "   - Backend:   http://localhost:8001  (API)"
echo "   - Database:  localhost:5433 (PERSISTENT)"
echo ""
echo "📝 Logs:"
echo "   - Docker:    docker-compose logs -f"
echo "   - Stripe:    tail -f stripe-webhook.log"
echo "   - Marketing: tail -f marketing.log"
echo ""
echo "🔄 Migrations run automatically on startup"
echo "🗑️  To reset DB: ./scripts/start-dev.sh --clean"
echo "🛑 To stop: ./scripts/stop-dev.sh"
