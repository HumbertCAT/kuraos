# =============================================================================
# KURA OS - Production Dockerfile (App Layer)
# =============================================================================
# This Dockerfile builds on top of the pre-built base image (kura-base)
# which contains heavy dependencies (Google Cloud, OpenTelemetry, etc.)
#
# The base image is rebuilt manually when requirements-heavy.txt changes.
# See: ./scripts/rebuild-base.sh
# =============================================================================

FROM europe-west1-docker.pkg.dev/kura-os/cloud-run-source-deploy/kura-base:v2

WORKDIR /app

# Install only light dependencies (fast - no heavy downloads)
COPY requirements-light.txt .
RUN pip install --no-cache-dir -r requirements-light.txt

# Copy application code
COPY . .

# Make startup script executable
RUN chmod +x scripts/startup.sh

# Use PORT env var for Cloud Run, default to 8000 for local dev
ENV PORT=8000
EXPOSE $PORT

# Use startup script that runs migrations before starting server
CMD ["./scripts/startup.sh"]
