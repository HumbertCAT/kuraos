#!/bin/bash

# =============================================================================
# Kura OS Test Runner - The Immune System
# =============================================================================
#
# Unified interface for running all test layers locally.
#
# Usage:
#   ./scripts/test.sh innate      # Backend unit tests (pytest)
#   ./scripts/test.sh adaptive    # Frontend E2E tests (Playwright)
#   ./scripts/test.sh cognitive   # AI semantic evaluation
#   ./scripts/test.sh email       # Email flow tests (Mailpit)
#   ./scripts/test.sh all         # Run all layers sequentially
#
# Exit codes: 0 = all passed, 1 = failures detected
# =============================================================================

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Test layer selection
LAYER="${1:-all}"

# =============================================================================
# Helper Functions
# =============================================================================

print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

check_dependencies() {
    local layer=$1
    
    case $layer in
        innate|email)
            if [ ! -d "$PROJECT_ROOT/backend/.venv" ]; then
                print_error "Backend virtual environment not found"
                print_warning "Run: cd backend && python -m venv .venv && .venv/bin/pip install -r requirements.txt -r requirements-test.txt"
                exit 1
            fi
            ;;
        adaptive)
            if ! command -v pnpm &> /dev/null; then
                print_error "pnpm not found"
                print_warning "Install: npm install -g pnpm"
                exit 1
            fi
            ;;
        cognitive)
            if [ ! -f "$PROJECT_ROOT/backend/.venv/bin/python" ]; then
                print_error "Python environment not found"
                exit 1
            fi
            ;;
    esac
}

# =============================================================================
# Test Runners
# =============================================================================

run_innate() {
    print_header "🧬 Phase 1: Innate Immunity (Backend Unit Tests)"
    
    check_dependencies "innate"
    
    cd "$PROJECT_ROOT/backend"
    
    print_warning "Running pytest..."
    if .venv/bin/pytest tests/ --verbose --tb=short -x; then
        print_success "Innate immunity tests passed"
        return 0
    else
        print_error "Innate immunity tests failed"
        return 1
    fi
}

run_adaptive() {
    print_header "🎭 Phase 2: Adaptive Immunity (Frontend E2E)"
    
    check_dependencies "adaptive"
    
    cd "$PROJECT_ROOT/apps/platform"
    
    print_warning "Running Playwright E2E tests..."
    if E2E_TEST_EMAIL=e2e.playwright@gmail.com E2E_TEST_PASSWORD=E2ETestPassword123! pnpm exec playwright test; then
        print_success "Adaptive immunity tests passed"
        return 0
    else
        print_error "Adaptive immunity tests failed"
        return 1
    fi
}

run_cognitive() {
    print_header "🧠 Phase 3: Cognitive Immunity (AI Evaluation)"
    
    check_dependencies "cognitive"
    
    cd "$PROJECT_ROOT/backend"
    
    print_warning "Validating AI evaluation script..."
    if .venv/bin/python -m py_compile tests/ai/evaluate_aletheia.py; then
        print_success "Cognitive immunity script validated"
        print_warning "Note: Full AI evaluation requires Vertex AI credentials and live backend"
        return 0
    else
        print_error "Cognitive immunity validation failed"
        return 1
    fi
}

run_email() {
    print_header "📧 Phase 5: Communication Immunity (Email Testing)"
    
    check_dependencies "email"
    
    cd "$PROJECT_ROOT/backend"
    
    print_warning "Running email tests with Mailpit..."
    if .venv/bin/pytest tests/test_emails.py --verbose --tb=short; then
        print_success "Communication immunity tests passed"
        return 0
    else
        print_error "Communication immunity tests failed"
        return 1
    fi
}

run_all() {
    print_header "🏆 THE IMMUNE SYSTEM - Full Test Suite"
    
    local failed=0
    
    run_innate || failed=1
    echo ""
    
    run_adaptive || failed=1
    echo ""
    
    run_cognitive || failed=1
    echo ""
    
    run_email || failed=1
    echo ""
    
    if [ $failed -eq 0 ]; then
        print_header "🎉 ALL IMMUNE SYSTEM LAYERS PASSED"
        return 0
    else
        print_header "💥 SOME IMMUNE SYSTEM LAYERS FAILED"
        return 1
    fi
}

# =============================================================================
# Main
# =============================================================================

case $LAYER in
    innate)
        run_innate
        ;;
    adaptive)
        run_adaptive
        ;;
    cognitive)
        run_cognitive
        ;;
    email)
        run_email
        ;;
    all)
        run_all
        ;;
    *)
        echo "Usage: $0 {innate|adaptive|cognitive|email|all}"
        echo ""
        echo "Layers:"
        echo "  innate     - Backend unit tests (pytest)"
        echo "  adaptive   - Frontend E2E tests (Playwright)"
        echo "  cognitive  - AI semantic evaluation"
        echo "  email      - Email flow tests (Mailpit)"
        echo "  all        - Run all layers"
        exit 1
        ;;
esac
