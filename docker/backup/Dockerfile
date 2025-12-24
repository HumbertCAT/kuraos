FROM alpine:3.19

# Install PostgreSQL client and bash
RUN apk add --no-cache \
    postgresql-client \
    bash \
    aws-cli \
    tzdata

# Create scripts directory
WORKDIR /scripts

# Copy backup script
COPY backup.sh /scripts/backup.sh
RUN chmod +x /scripts/backup.sh

# Create backup directory
RUN mkdir -p /backups

# Entry script that runs backup on schedule
COPY entrypoint.sh /scripts/entrypoint.sh
RUN chmod +x /scripts/entrypoint.sh

ENTRYPOINT ["/scripts/entrypoint.sh"]
