"""seed_agent_playbooks

Revision ID: 190c2b058ca0
Revises: 2013ff4641d3
Create Date: 2026-01-08 00:24:57.341513

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "190c2b058ca0"
down_revision: Union[str, Sequence[str], None] = "2013ff4641d3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Run agent playbook seeder as a data migration."""
    import asyncio

    try:
        from app.scripts.seed_automation_playbooks import seed_playbooks

        asyncio.run(seed_playbooks())
    except ImportError:
        # Fallback if imports are tricky in alembic env
        print("⚠️ Warning: Could not import seed_playbooks, seeding skipped.")
    except Exception as e:
        print(f"⚠️ Seeder info: {e}")


def downgrade() -> None:
    """No easy rollback for data seeding."""
    pass
