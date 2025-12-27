"""merge_v111_heads

Revision ID: 264a97cb8a78
Revises: b1234def5678, fix_service_type_schema, k1234efgh5678
Create Date: 2025-12-27 09:52:46.167423

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '264a97cb8a78'
down_revision: Union[str, Sequence[str], None] = ('b1234def5678', 'fix_service_type_schema', 'k1234efgh5678')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
