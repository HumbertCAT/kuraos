FROM python:3.11-slim

WORKDIR /app

# Install PostgreSQL client, g++ for google-cloud-profiler compilation
RUN apt-get update && apt-get install -y postgresql-client g++ && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Make startup script executable
RUN chmod +x scripts/startup.sh

# Use PORT env var for Cloud Run, default to 8000 for local dev
ENV PORT=8000
EXPOSE $PORT

# Use startup script that runs migrations before starting server
CMD ["./scripts/startup.sh"]
