"""merge_theme_preference_heads

Revision ID: 8c20ee5434b8
Revises: 59d8c633dbe5, l2345fghi6789
Create Date: 2025-12-28 19:39:58.222565

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8c20ee5434b8'
down_revision: Union[str, Sequence[str], None] = ('59d8c633dbe5', 'l2345fghi6789')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
