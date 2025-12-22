"""File upload endpoint for clinical attachments."""

import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, status

from app.api.deps import CurrentUser

router = APIRouter()

# Ensure upload directory exists
UPLOAD_DIR = "/app/static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/")
async def upload_file(
    current_user: CurrentUser,
    file: UploadFile = File(...),
):
    """Upload a file and return its URL.

    Files are stored locally for development.
    Will migrate to Google Cloud Storage in production.
    """
    # Validate file size (max 100MB)
    MAX_SIZE = 100 * 1024 * 1024  # 100MB
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size is 100MB.",
        )

    # Generate unique filename
    ext = os.path.splitext(file.filename or "file")[1] or ".bin"
    unique_name = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    # Save file
    with open(file_path, "wb") as f:
        f.write(content)

    # Return URL path
    return {
        "url": f"/static/uploads/{unique_name}",
        "filename": file.filename,
        "size": len(content),
        "content_type": file.content_type,
    }
