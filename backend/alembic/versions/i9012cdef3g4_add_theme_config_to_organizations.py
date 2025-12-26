"""add theme_config to organizations

Revision ID: i9012cdef3g4
Revises: h8901bcdef2_add_target_entity_to_form_templates
Create Date: 2025-12-26 09:10:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision = 'i9012cdef3g4'
down_revision = 'h8901bcdef2_add_target_entity_to_form_templates'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add theme_config column to organizations table
    op.add_column('organizations', sa.Column('theme_config', JSONB, nullable=True))


def downgrade() -> None:
    op.drop_column('organizations', 'theme_config')
