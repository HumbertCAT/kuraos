"""sync_prod_schema_hotfix

Revision ID: 230fd3513186
Revises: h8901bcdef2
Create Date: 2025-12-22 15:21:42.716762

NO-OP MIGRATION: Schema was already corrected via manual hotfix on 2025-12-22.

The following changes were applied manually to fix the 'Phantom Migration':
- Added schedule_id to service_types
- Added scheduling_type (VARCHAR) to service_types
- Added target_timezone to bookings

This migration just stamps the version to sync Alembic history.
"""

from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = "230fd3513186"
down_revision: Union[str, Sequence[str], None] = "h8901bcdef2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - NO-OP, schema already fixed via hotfix."""
    pass


def downgrade() -> None:
    """Downgrade schema - NO-OP, would require manual intervention."""
    pass
