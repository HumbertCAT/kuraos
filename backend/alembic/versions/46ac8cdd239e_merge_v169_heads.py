"""merge_v169_heads

Revision ID: 46ac8cdd239e
Revises: 917138307f56, t9012opqrs345
Create Date: 2026-01-10 03:46:19.521611

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '46ac8cdd239e'
down_revision: Union[str, Sequence[str], None] = ('917138307f56', 't9012opqrs345')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
