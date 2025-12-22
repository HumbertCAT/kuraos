"""Add HelpQueryLog table for chatbot analytics

Revision ID: 7abb364277c9
Revises: 9a6493d7ef99
Create Date: 2025-12-19 15:48:19.841087

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "7abb364277c9"
down_revision: Union[str, Sequence[str], None] = "9a6493d7ef99"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create HelpQueryLog table for chatbot analytics."""
    op.create_table(
        "help_query_logs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=True),
        sa.Column("org_id", sa.Uuid(), nullable=True),
        sa.Column("query_text", sa.String(length=500), nullable=False),
        sa.Column("detected_topic", sa.String(length=50), nullable=True),
        sa.Column("current_route", sa.String(length=200), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["org_id"],
            ["organizations.id"],
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_help_query_logs_org_id"), "help_query_logs", ["org_id"], unique=False
    )
    op.create_index(
        op.f("ix_help_query_logs_user_id"), "help_query_logs", ["user_id"], unique=False
    )


def downgrade() -> None:
    """Drop HelpQueryLog table."""
    op.drop_index(op.f("ix_help_query_logs_user_id"), table_name="help_query_logs")
    op.drop_index(op.f("ix_help_query_logs_org_id"), table_name="help_query_logs")
    op.drop_table("help_query_logs")
