"""Meta Cloud API Media Service.

v1.6.7: Deep Listening - Download media from Meta Cloud API.

Meta's media URLs are ephemeral (expire in 5 minutes), so we must:
1. GET /{media_id} to get the temporary URL
2. GET {url} with Bearer token to download bytes
3. Store in GCS before the URL expires

Supports: audio/ogg, image/jpeg, video/mp4, etc.
"""

import logging
from typing import Tuple

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class MetaMediaService:
    """Download media from Meta Cloud API before ephemeral URLs expire."""

    def __init__(self):
        """Initialize with Meta access token from settings."""
        self.access_token = settings.META_ACCESS_TOKEN
        self.graph_url = "https://graph.facebook.com/v22.0"

    async def get_media_url(self, media_id: str) -> str:
        """Get temporary download URL from Graph API.

        Args:
            media_id: Meta's media ID from webhook

        Returns:
            Temporary URL (expires in ~5 minutes)

        Raises:
            Exception: If API call fails
        """
        if not self.access_token:
            raise ValueError("META_ACCESS_TOKEN not configured")

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{self.graph_url}/{media_id}",
                headers={"Authorization": f"Bearer {self.access_token}"},
            )

            if response.status_code != 200:
                logger.error(
                    f"❌ Failed to get media URL for {media_id}: "
                    f"HTTP {response.status_code} - {response.text}"
                )
                raise Exception(f"Meta API error: {response.status_code}")

            data = response.json()
            url = data.get("url")

            if not url:
                raise Exception(f"No URL in Meta response for media_id={media_id}")

            logger.info(f"📍 Got media URL for {media_id} (expires in ~5min)")
            return url

    async def download_media(self, media_id: str) -> Tuple[bytes, str]:
        """Download media binary from Meta.

        Two-step process:
        1. Get temporary URL via Graph API
        2. Download binary with Bearer token

        Args:
            media_id: Meta's media ID

        Returns:
            Tuple of (bytes, mime_type)

        Raises:
            Exception: If download fails
        """
        # Step 1: Get URL
        url = await self.get_media_url(media_id)

        # Step 2: Download binary
        async with httpx.AsyncClient(timeout=60.0) as client:
            logger.info(f"📥 Downloading media {media_id}...")

            response = await client.get(
                url,
                headers={"Authorization": f"Bearer {self.access_token}"},
                follow_redirects=True,
            )

            if response.status_code != 200:
                logger.error(
                    f"❌ Failed to download media {media_id}: "
                    f"HTTP {response.status_code}"
                )
                raise Exception(f"Media download failed: {response.status_code}")

            mime_type = response.headers.get("Content-Type", "audio/ogg")
            # Clean mime type (remove charset etc)
            mime_type = mime_type.split(";")[0].strip()

            data = response.content
            logger.info(
                f"✅ Downloaded media {media_id}: {len(data)} bytes, type={mime_type}"
            )

            return data, mime_type


# Singleton instance
meta_media_service = MetaMediaService()
