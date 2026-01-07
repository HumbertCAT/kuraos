"""Admin Backup API endpoints (Super Admin only).

Provides REST endpoints for database backup/restore operations via the Admin panel.
Backups are stored in Google Cloud Storage (kura-production-vault) for persistence.
"""

import os
import subprocess
import tempfile
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

from app.db.base import get_db
from app.api.deps import get_current_user, require_super_admin
from app.db.models import User
from app.services.storage import vault_storage, StorageFile

router = APIRouter(prefix="/admin/backups", tags=["admin-backups"])


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
    storage_location: str


class BackupCreateResponse(BaseModel):
    """Response for backup creation."""

    success: bool
    filename: str
    size_human: str
    message: str
    gcs_uri: str


class RestoreRequest(BaseModel):
    """Request to restore from backup."""

    filename: str
    confirm: bool = False


class RestoreResponse(BaseModel):
    """Response for restore operation."""

    success: bool
    message: str


@router.get("", response_model=BackupListResponse)
async def list_backups(current_user: User = Depends(require_super_admin)):
    """List available backup files from GCS vault (Super Admin only)."""

    try:
        gcs_files = vault_storage.list_backups()

        backups = [
            BackupInfo(
                filename=f.name,
                size_bytes=f.size_bytes,
                size_human=f.size_human,
                created_at=f.created_at,
                age_hours=f.age_hours,
            )
            for f in gcs_files
        ]

        return BackupListResponse(
            backups=backups,
            total_count=len(backups),
            storage_location="gs://kura-production-vault/backups/",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing backups: {str(e)}")


def _parse_database_url() -> dict:
    """Parse DATABASE_URL to extract connection components.

    Supports both formats:
    - Local: postgresql+asyncpg://user:pass@host:port/dbname
    - Cloud SQL: postgresql+asyncpg://user:pass@/dbname?host=/cloudsql/project:region:instance

    Returns dict with: host, port, user, password, dbname, socket_path (if Cloud SQL)
    """
    import re
    from urllib.parse import parse_qs, unquote

    database_url = os.environ.get("DATABASE_URL", "")

    if not database_url:
        # Fallback to individual env vars (local Docker)
        return {
            "host": os.environ.get("POSTGRES_HOST", "db"),
            "port": os.environ.get("POSTGRES_PORT", "5432"),
            "user": os.environ.get("POSTGRES_USER", "postgres"),
            "password": os.environ.get("POSTGRES_PASSWORD", "postgres"),
            "dbname": os.environ.get("POSTGRES_DB", "therapistos"),
            "socket_path": None,
        }

    # Use regex to parse URL with potentially special chars in password
    pattern = r"^(?:postgresql\+asyncpg|postgresql)://([^:]+):([^@]+)@([^/:]*)?(?::(\d+))?/([^?]+)(?:\?(.*))?$"
    match = re.match(pattern, database_url)

    if not match:
        return {
            "host": "localhost",
            "port": "5432",
            "user": "postgres",
            "password": "",
            "dbname": "therapistos",
            "socket_path": None,
        }

    user, password, host, port, dbname, query_string = match.groups()

    # Parse query params for Cloud SQL socket
    socket_path = None
    if query_string:
        query_params = parse_qs(query_string)
        if "host" in query_params:
            socket_path = query_params["host"][0]

    return {
        "host": host or "localhost",
        "port": port or "5432",
        "user": unquote(user) if user else "postgres",
        "password": unquote(password) if password else "",
        "dbname": dbname or "therapistos",
        "socket_path": socket_path,
    }


@router.post("/create", response_model=BackupCreateResponse)
async def create_backup(current_user: User = Depends(require_super_admin)):
    """Create a new database backup and upload to GCS vault (Super Admin only)."""

    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M")
    filename = f"backup_{timestamp}.sql.gz"

    # Get database connection details
    db_config = _parse_database_url()

    try:
        # Create temp file for the backup
        with tempfile.NamedTemporaryFile(suffix=".sql.gz", delete=False) as temp_file:
            temp_path = temp_file.name

        # Run pg_dump
        env = os.environ.copy()
        env["PGPASSWORD"] = db_config["password"]

        # Build pg_dump command
        pg_dump_cmd = [
            "pg_dump",
            "-U",
            db_config["user"],
            "-d",
            db_config["dbname"],
            "--no-owner",
            "--no-acl",
        ]

        # Use socket or host depending on environment
        if db_config["socket_path"]:
            pg_dump_cmd.extend(["-h", db_config["socket_path"]])
        else:
            pg_dump_cmd.extend(["-h", db_config["host"]])
            pg_dump_cmd.extend(["-p", db_config["port"]])

        pg_dump = subprocess.Popen(
            pg_dump_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=env,
        )

        # Pipe to gzip and save to temp file
        with open(temp_path, "wb") as f:
            gzip = subprocess.Popen(
                ["gzip"], stdin=pg_dump.stdout, stdout=f, stderr=subprocess.PIPE
            )
            gzip.communicate()

        pg_dump.wait()

        if pg_dump.returncode != 0:
            stderr = (
                pg_dump.stderr.read().decode() if pg_dump.stderr else "Unknown error"
            )
            raise HTTPException(
                status_code=500,
                detail=f"pg_dump failed: {stderr}",
            )

        # Verify file was created and has content
        file_size = os.path.getsize(temp_path)
        if file_size < 100:
            raise HTTPException(
                status_code=500, detail="Backup file creation failed or file is empty"
            )

        # Upload to GCS
        with open(temp_path, "rb") as f:
            gcs_uri = vault_storage.upload_backup(f, filename)

        # Get size for response
        size_human = _get_human_size(file_size)

        # Clean up temp file
        os.unlink(temp_path)

        return BackupCreateResponse(
            success=True,
            filename=filename,
            size_human=size_human,
            gcs_uri=gcs_uri,
            message=f"Backup created and uploaded to vault: {filename} ({size_human})",
        )

    except HTTPException:
        raise
    except Exception as e:
        # Clean up temp file on error
        if "temp_path" in locals() and os.path.exists(temp_path):
            os.unlink(temp_path)
        raise HTTPException(status_code=500, detail=str(e))


def _get_human_size(size_bytes: int) -> str:
    """Convert bytes to human-readable size."""
    for unit in ["B", "KB", "MB", "GB"]:
        if size_bytes < 1024:
            return f"{size_bytes:.1f}{unit}"
        size_bytes /= 1024
    return f"{size_bytes:.1f}TB"


@router.post("/restore", response_model=RestoreResponse)
async def restore_backup(
    request: RestoreRequest, current_user: User = Depends(require_super_admin)
):
    """Restore database from backup in GCS vault (Super Admin only).

    WARNING: This will overwrite the current database!
    """

    if not request.confirm:
        raise HTTPException(
            status_code=400, detail="You must set confirm=true to proceed with restore"
        )

    # Validate filename
    if not _is_valid_backup_filename(request.filename):
        raise HTTPException(status_code=400, detail="Invalid backup filename")

    # Check if backup exists in GCS
    if not vault_storage.backup_exists(request.filename):
        raise HTTPException(
            status_code=404,
            detail=f"Backup file not found in vault: {request.filename}",
        )

    # Get database connection details
    db_config = _parse_database_url()

    # Build psql connection args
    def get_psql_args(target_db: str) -> list:
        args = ["psql", "-U", db_config["user"], "-d", target_db]
        if db_config["socket_path"]:
            args.extend(["-h", db_config["socket_path"]])
        else:
            args.extend(["-h", db_config["host"], "-p", db_config["port"]])
        return args

    try:
        # Download backup from GCS to temp file
        backup_data = vault_storage.download_backup(request.filename)

        with tempfile.NamedTemporaryFile(suffix=".sql.gz", delete=False) as temp_file:
            temp_file.write(backup_data)
            temp_path = temp_file.name

        env = os.environ.copy()
        env["PGPASSWORD"] = db_config["password"]

        # Terminate existing connections
        subprocess.run(
            get_psql_args("postgres")
            + [
                "-c",
                f"""
                    SELECT pg_terminate_backend(pg_stat_activity.pid)
                    FROM pg_stat_activity
                    WHERE pg_stat_activity.datname = '{db_config["dbname"]}'
                    AND pid <> pg_backend_pid();
                """,
            ],
            env=env,
            capture_output=True,
        )

        # Drop and recreate database
        subprocess.run(
            get_psql_args("postgres")
            + [
                "-c",
                f"DROP DATABASE IF EXISTS {db_config['dbname']};",
            ],
            env=env,
            capture_output=True,
        )

        subprocess.run(
            get_psql_args("postgres")
            + [
                "-c",
                f"CREATE DATABASE {db_config['dbname']};",
            ],
            env=env,
            capture_output=True,
        )

        # Restore data
        gunzip = subprocess.Popen(
            ["gunzip", "-c", temp_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )

        restore = subprocess.Popen(
            get_psql_args(db_config["dbname"]) + ["--quiet"],
            stdin=gunzip.stdout,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=env,
        )

        restore.communicate()
        gunzip.wait()

        # Clean up temp file
        os.unlink(temp_path)

        if restore.returncode != 0:
            raise HTTPException(status_code=500, detail="Restore command failed")

        return RestoreResponse(
            success=True,
            message=f"Database restored successfully from {request.filename}. Please refresh your browser.",
        )

    except HTTPException:
        raise
    except Exception as e:
        # Clean up temp file on error
        if "temp_path" in locals() and os.path.exists(temp_path):
            os.unlink(temp_path)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{filename}")
async def delete_backup(
    filename: str, current_user: User = Depends(require_super_admin)
):
    """Delete a backup file from GCS vault (Super Admin only)."""

    # Security: Validate filename to prevent path traversal
    if not _is_valid_backup_filename(filename):
        raise HTTPException(status_code=400, detail="Invalid backup filename")

    try:
        vault_storage.delete_backup(filename)
        return {"success": True, "message": f"Deleted {filename} from vault"}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Backup not found in vault")
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
    """Get a signed URL to download a backup file (Super Admin only).

    Returns a redirect to a time-limited signed URL for secure download.
    """

    # Security: Validate filename
    if not _is_valid_backup_filename(filename):
        raise HTTPException(status_code=400, detail="Invalid backup filename")

    try:
        signed_url = vault_storage.generate_signed_url(filename, expiration_minutes=15)
        return RedirectResponse(url=signed_url, status_code=302)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Backup not found in vault")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
