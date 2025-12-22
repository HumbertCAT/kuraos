"""set_superadmin_user

Revision ID: a1b2c3d4e5f6
Revises: 230fd3513186
Create Date: 2025-12-22 17:17:00.000000

Data migration to set humbert.torroella@gmail.com as superuser.
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "230fd3513186"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Set humbert.torroella@gmail.com as superuser."""
    op.execute(
        """
        UPDATE users 
        SET is_superuser = TRUE 
        WHERE email = 'humbert.torroella@gmail.com'
        """
    )


def downgrade() -> None:
    """Remove superuser status."""
    op.execute(
        """
        UPDATE users 
        SET is_superuser = FALSE 
        WHERE email = 'humbert.torroella@gmail.com'
        """
    )
