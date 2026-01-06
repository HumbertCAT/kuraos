"""Storage Service for Google Cloud Storage operations.

Provides a unified interface for uploading, listing, and downloading files
from GCS buckets. Supports both the public media bucket and the private vault.
"""

import os
from datetime import datetime, timedelta
from typing import BinaryIO, List, Optional
from dataclasses import dataclass

from google.cloud import storage
from google.cloud.storage import Bucket, Blob


# Bucket configuration
VAULT_BUCKET = "kura-production-vault"
MEDIA_BUCKET = "kura-production-media"


@dataclass
class StorageFile:
    """Represents a file in GCS."""

    name: str
    size_bytes: int
    size_human: str
    created_at: str
    age_hours: float


def _get_human_size(size_bytes: int) -> str:
    """Convert bytes to human-readable size."""
    for unit in ["B", "KB", "MB", "GB"]:
        if size_bytes < 1024:
            return f"{size_bytes:.1f}{unit}"
        size_bytes /= 1024
    return f"{size_bytes:.1f}TB"


class StorageService:
    """Service for interacting with Google Cloud Storage."""

    def __init__(self, bucket_name: str = VAULT_BUCKET):
        """Initialize storage configuration.

        In Cloud Run, credentials are automatically provided via the
        service account. Locally, use GOOGLE_APPLICATION_CREDENTIALS.

        Note: Client is lazy-initialized to avoid import-time failures
        in environments without GCP credentials.
        """
        self.bucket_name = bucket_name
        self._client: Optional[storage.Client] = None
        self._bucket: Optional[Bucket] = None

    @property
    def client(self) -> storage.Client:
        """Lazy-load GCS client."""
        if self._client is None:
            self._client = storage.Client()
        return self._client

    @property
    def bucket(self) -> Bucket:
        """Lazy-load bucket reference."""
        if self._bucket is None:
            self._bucket = self.client.bucket(self.bucket_name)
        return self._bucket

    def upload_backup(self, file_obj: BinaryIO, filename: str) -> str:
        """Upload a backup file to the vault.

        Args:
            file_obj: File-like object to upload
            filename: Name of the file (without path)

        Returns:
            GCS URI of the uploaded file
        """
        blob_path = f"backups/{filename}"
        blob = self.bucket.blob(blob_path)

        # Upload with gzip content type for .sql.gz files
        blob.upload_from_file(file_obj, content_type="application/gzip", rewind=True)

        return f"gs://{self.bucket_name}/{blob_path}"

    def upload_backup_from_bytes(self, data: bytes, filename: str) -> str:
        """Upload backup data directly from bytes.

        Args:
            data: Raw bytes to upload
            filename: Name of the file (without path)

        Returns:
            GCS URI of the uploaded file
        """
        blob_path = f"backups/{filename}"
        blob = self.bucket.blob(blob_path)

        blob.upload_from_string(data, content_type="application/gzip")

        return f"gs://{self.bucket_name}/{blob_path}"

    def list_backups(self) -> List[StorageFile]:
        """List all backup files in the vault.

        Returns:
            List of StorageFile objects sorted by creation time (newest first)
        """
        blobs = self.client.list_blobs(self.bucket_name, prefix="backups/")

        now = datetime.utcnow()
        files = []

        for blob in blobs:
            # Skip the "folder" itself
            if blob.name == "backups/":
                continue

            # Extract just the filename
            filename = blob.name.replace("backups/", "")

            # Calculate age
            created = blob.time_created.replace(tzinfo=None)
            age_hours = (now - created).total_seconds() / 3600

            files.append(
                StorageFile(
                    name=filename,
                    size_bytes=blob.size,
                    size_human=_get_human_size(blob.size),
                    created_at=created.isoformat(),
                    age_hours=round(age_hours, 1),
                )
            )

        # Sort by creation time, newest first
        files.sort(key=lambda f: f.created_at, reverse=True)
        return files

    def download_backup(self, filename: str) -> bytes:
        """Download a backup file from the vault.

        Args:
            filename: Name of the backup file

        Returns:
            Raw bytes of the backup file
        """
        blob_path = f"backups/{filename}"
        blob = self.bucket.blob(blob_path)

        if not blob.exists():
            raise FileNotFoundError(f"Backup not found: {filename}")

        return blob.download_as_bytes()

    def delete_backup(self, filename: str) -> bool:
        """Delete a backup file from the vault.

        Args:
            filename: Name of the backup file

        Returns:
            True if deleted successfully
        """
        blob_path = f"backups/{filename}"
        blob = self.bucket.blob(blob_path)

        if not blob.exists():
            raise FileNotFoundError(f"Backup not found: {filename}")

        blob.delete()
        return True

    def generate_signed_url(self, filename: str, expiration_minutes: int = 15) -> str:
        """Generate a signed URL for temporary download access.

        Args:
            filename: Name of the backup file
            expiration_minutes: How long the URL should be valid

        Returns:
            Signed URL string
        """
        blob_path = f"backups/{filename}"
        blob = self.bucket.blob(blob_path)

        if not blob.exists():
            raise FileNotFoundError(f"Backup not found: {filename}")

        url = blob.generate_signed_url(
            version="v4", expiration=timedelta(minutes=expiration_minutes), method="GET"
        )

        return url

    def backup_exists(self, filename: str) -> bool:
        """Check if a backup file exists.

        Args:
            filename: Name of the backup file

        Returns:
            True if the backup exists
        """
        blob_path = f"backups/{filename}"
        blob = self.bucket.blob(blob_path)
        return blob.exists()

    def upload_temp_media(self, data: bytes, filename: str, content_type: str) -> str:
        """Upload media file for AI analysis (stored in temp_analysis/).

        Used for large audio/video files that exceed Vertex AI's inline limit.
        Files in temp_analysis/ should be cleaned up via GCS lifecycle rules.

        Args:
            data: Raw bytes of the media file
            filename: Name of the file
            content_type: MIME type (e.g., audio/webm)

        Returns:
            GCS URI (gs://bucket/temp_analysis/filename)
        """
        blob_path = f"temp_analysis/{filename}"
        blob = self.bucket.blob(blob_path)
        blob.upload_from_string(data, content_type=content_type)
        return f"gs://{self.bucket_name}/{blob_path}"


# Singleton instance for the vault (lazy - no client created until first use)
vault_storage = StorageService(VAULT_BUCKET)
