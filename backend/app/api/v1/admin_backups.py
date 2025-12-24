"""Admin Backup API endpoints (Super Admin only).

Provides REST endpoints for database backup/restore operations via the Admin panel.
"""

import os
import subprocess
import glob
from datetime import datetime
from typing import List
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.db.base import get_db
from app.api.deps import get_current_user, require_super_admin
from app.db.models import User

router = APIRouter(prefix="/admin/backups", tags=["admin-backups"])

# Backup directory (relative to backend container)
BACKUP_DIR = Path("/app/backups")


class BackupInfo(BaseModel):
    """Backup file information."""

    filename: str
    size_bytes: int
    size_human: str
    created_at: str
    age_hours: float


class BackupListResponse(BaseModel):
    """Response for backup list."""

    backups: List[BackupInfo]
    total_count: int
    backup_dir: str


class BackupCreateResponse(BaseModel):
    """Response for backup creation."""

    success: bool
    filename: str
    size_human: str
    message: str


class RestoreRequest(BaseModel):
    """Request to restore from backup."""

    filename: str
    confirm: bool = False


class RestoreResponse(BaseModel):
    """Response for restore operation."""

    success: bool
    message: str


def get_human_size(size_bytes: int) -> str:
    """Convert bytes to human-readable size."""
    for unit in ["B", "KB", "MB", "GB"]:
        if size_bytes < 1024:
            return f"{size_bytes:.1f}{unit}"
        size_bytes /= 1024
    return f"{size_bytes:.1f}TB"


@router.get("", response_model=BackupListResponse)
async def list_backups(current_user: User = Depends(require_super_admin)):
    """List available backup files (Super Admin only)."""

    BACKUP_DIR.mkdir(parents=True, exist_ok=True)

    backups = []
    backup_files = sorted(
        glob.glob(str(BACKUP_DIR / "backup_*.sql.gz")),
        key=os.path.getmtime,
        reverse=True,
    )

    now = datetime.now()

    for filepath in backup_files:
        stat = os.stat(filepath)
        created = datetime.fromtimestamp(stat.st_mtime)
        age_hours = (now - created).total_seconds() / 3600

        backups.append(
            BackupInfo(
                filename=os.path.basename(filepath),
                size_bytes=stat.st_size,
                size_human=get_human_size(stat.st_size),
                created_at=created.isoformat(),
                age_hours=round(age_hours, 1),
            )
        )

    return BackupListResponse(
        backups=backups, total_count=len(backups), backup_dir=str(BACKUP_DIR)
    )


@router.post("/create", response_model=BackupCreateResponse)
async def create_backup(current_user: User = Depends(require_super_admin)):
    """Create a new database backup (Super Admin only)."""

    BACKUP_DIR.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M")
    filename = f"backup_{timestamp}.sql.gz"
    filepath = BACKUP_DIR / filename

    # Get database connection details from environment
    db_host = os.environ.get("POSTGRES_HOST", "db")
    db_port = os.environ.get("POSTGRES_PORT", "5432")
    db_name = os.environ.get("POSTGRES_DB", "therapistos")
    db_user = os.environ.get("POSTGRES_USER", "postgres")
    db_password = os.environ.get("POSTGRES_PASSWORD", "postgres")

    try:
        # Run pg_dump
        env = os.environ.copy()
        env["PGPASSWORD"] = db_password

        pg_dump = subprocess.Popen(
            [
                "pg_dump",
                "-h",
                db_host,
                "-p",
                db_port,
                "-U",
                db_user,
                "-d",
                db_name,
                "--no-owner",
                "--no-acl",
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=env,
        )

        # Pipe to gzip
        with open(filepath, "wb") as f:
            gzip = subprocess.Popen(
                ["gzip"], stdin=pg_dump.stdout, stdout=f, stderr=subprocess.PIPE
            )
            gzip.communicate()

        pg_dump.wait()

        if pg_dump.returncode != 0:
            raise HTTPException(
                status_code=500,
                detail=f"pg_dump failed: {pg_dump.stderr.read().decode()}",
            )

        # Verify file was created and has content
        if not filepath.exists() or filepath.stat().st_size < 100:
            raise HTTPException(
                status_code=500, detail="Backup file creation failed or file is empty"
            )

        size_human = get_human_size(filepath.stat().st_size)

        return BackupCreateResponse(
            success=True,
            filename=filename,
            size_human=size_human,
            message=f"Backup created successfully: {filename} ({size_human})",
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/restore", response_model=RestoreResponse)
async def restore_backup(
    request: RestoreRequest, current_user: User = Depends(require_super_admin)
):
    """Restore database from backup (Super Admin only).

    WARNING: This will overwrite the current database!
    """

    if not request.confirm:
        raise HTTPException(
            status_code=400, detail="You must set confirm=true to proceed with restore"
        )

    filepath = BACKUP_DIR / request.filename

    if not filepath.exists():
        raise HTTPException(
            status_code=404, detail=f"Backup file not found: {request.filename}"
        )

    # Get database connection details
    db_host = os.environ.get("POSTGRES_HOST", "db")
    db_port = os.environ.get("POSTGRES_PORT", "5432")
    db_name = os.environ.get("POSTGRES_DB", "therapistos")
    db_user = os.environ.get("POSTGRES_USER", "postgres")
    db_password = os.environ.get("POSTGRES_PASSWORD", "postgres")

    try:
        env = os.environ.copy()
        env["PGPASSWORD"] = db_password

        # Terminate existing connections
        terminate_cmd = subprocess.run(
            [
                "psql",
                "-h",
                db_host,
                "-p",
                db_port,
                "-U",
                db_user,
                "-d",
                "postgres",
                "-c",
                f"""
                    SELECT pg_terminate_backend(pg_stat_activity.pid)
                    FROM pg_stat_activity
                    WHERE pg_stat_activity.datname = '{db_name}'
                    AND pid <> pg_backend_pid();
                """,
            ],
            env=env,
            capture_output=True,
        )

        # Drop and recreate database
        subprocess.run(
            [
                "psql",
                "-h",
                db_host,
                "-p",
                db_port,
                "-U",
                db_user,
                "-d",
                "postgres",
                "-c",
                f"DROP DATABASE IF EXISTS {db_name};",
            ],
            env=env,
            capture_output=True,
        )

        subprocess.run(
            [
                "psql",
                "-h",
                db_host,
                "-p",
                db_port,
                "-U",
                db_user,
                "-d",
                "postgres",
                "-c",
                f"CREATE DATABASE {db_name};",
            ],
            env=env,
            capture_output=True,
        )

        # Restore data
        gunzip = subprocess.Popen(
            ["gunzip", "-c", str(filepath)],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )

        restore = subprocess.Popen(
            [
                "psql",
                "-h",
                db_host,
                "-p",
                db_port,
                "-U",
                db_user,
                "-d",
                db_name,
                "--quiet",
            ],
            stdin=gunzip.stdout,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=env,
        )

        restore.communicate()
        gunzip.wait()

        if restore.returncode != 0:
            raise HTTPException(status_code=500, detail="Restore command failed")

        return RestoreResponse(
            success=True,
            message=f"Database restored successfully from {request.filename}. Please refresh your browser.",
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{filename}")
async def delete_backup(
    filename: str, current_user: User = Depends(require_super_admin)
):
    """Delete a backup file (Super Admin only)."""

    # Security: Validate filename to prevent path traversal
    if not _is_valid_backup_filename(filename):
        raise HTTPException(status_code=400, detail="Invalid backup filename")

    filepath = BACKUP_DIR / filename

    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Backup not found")

    try:
        filepath.unlink()
        return {"success": True, "message": f"Deleted {filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _is_valid_backup_filename(filename: str) -> bool:
    """Security: Validate backup filename to prevent path traversal attacks."""
    # Must start with backup_ and end with .sql.gz
    if not filename.startswith("backup_") or not filename.endswith(".sql.gz"):
        return False
    # No path separators or parent directory references
    if "/" in filename or "\\" in filename or ".." in filename:
        return False
    # Filename must be reasonable length
    if len(filename) > 100:
        return False
    return True


@router.get("/{filename}/download")
async def download_backup(
    filename: str, current_user: User = Depends(require_super_admin)
):
    """Download a backup file (Super Admin only).

    CRITICAL: This allows saving backups to local machine since
    Cloud Run has ephemeral storage that can be wiped on restart.
    """
    from fastapi.responses import FileResponse

    # Security: Validate filename
    if not _is_valid_backup_filename(filename):
        raise HTTPException(status_code=400, detail="Invalid backup filename")

    filepath = BACKUP_DIR / filename

    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Backup not found")

    return FileResponse(
        path=str(filepath), filename=filename, media_type="application/gzip"
    )
