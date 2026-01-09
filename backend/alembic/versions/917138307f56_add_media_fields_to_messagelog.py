"""add_media_fields_to_messagelog

Revision ID: 917138307f56
Revises: 830bda45abc2
Create Date: 2026-01-09 03:12:49.604661

v1.6.7: Deep Listening - Media storage for audio/images from Meta
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "917138307f56"
down_revision: Union[str, Sequence[str], None] = "830bda45abc2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add media fields to message_logs for Deep Listening."""
    op.add_column(
        "message_logs", sa.Column("media_id", sa.String(length=100), nullable=True)
    )
    op.add_column(
        "message_logs", sa.Column("media_url", sa.String(length=512), nullable=True)
    )
    op.add_column(
        "message_logs", sa.Column("mime_type", sa.String(length=50), nullable=True)
    )


def downgrade() -> None:
    """Remove media fields from message_logs."""
    op.drop_column("message_logs", "mime_type")
    op.drop_column("message_logs", "media_url")
    op.drop_column("message_logs", "media_id")
