#!/bin/bash
# =============================================================================
# KURA OS - Rebuild Base Image
# =============================================================================
# Use this script when you change requirements-heavy.txt
# This should be run MANUALLY (not automated) per Arquitecto guidance
#
# Usage: ./scripts/rebuild-base.sh [version]
# Example: ./scripts/rebuild-base.sh v2
# =============================================================================

set -e

# Configuration
PROJECT_ID="kura-os"
REGION="europe-west1"
REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/cloud-run-source-deploy"
IMAGE_NAME="kura-base"
VERSION="${1:-v1}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🏗️  Building Kura OS Base Image...${NC}"
echo "   Registry: ${REGISTRY}"
echo "   Image: ${IMAGE_NAME}:${VERSION}"
echo ""

cd backend

# Build the base image
echo -e "${GREEN}[1/3]${NC} Building Docker image..."
docker build -f Dockerfile.base -t ${REGISTRY}/${IMAGE_NAME}:${VERSION} .

# Tag as latest too
docker tag ${REGISTRY}/${IMAGE_NAME}:${VERSION} ${REGISTRY}/${IMAGE_NAME}:latest

# Push to Artifact Registry
echo -e "${GREEN}[2/3]${NC} Pushing to Artifact Registry..."
docker push ${REGISTRY}/${IMAGE_NAME}:${VERSION}
docker push ${REGISTRY}/${IMAGE_NAME}:latest

# Update Dockerfile to use new version
echo -e "${GREEN}[3/3]${NC} Updating backend/Dockerfile..."
sed -i '' "s|FROM ${REGISTRY}/${IMAGE_NAME}:.*|FROM ${REGISTRY}/${IMAGE_NAME}:${VERSION}|" Dockerfile

echo ""
echo -e "${GREEN}✅ Base image rebuilt successfully!${NC}"
echo ""
echo "Next steps:"
echo "  1. git add backend/Dockerfile"
echo "  2. git commit -m 'build: update base image to ${VERSION}'"
echo "  3. Deploy as normal"
