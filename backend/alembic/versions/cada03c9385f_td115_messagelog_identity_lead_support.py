"""td115_messagelog_identity_lead_support

Revision ID: cada03c9385f
Revises: 46ac8cdd239e
Create Date: 2026-01-11 18:05:24.659585

TD-115: Enable WhatsApp message storage for Leads following Identity Vault pattern.
- Make patient_id nullable
- Add identity_id (the universal anchor)
- Add lead_id (optional Lead reference)
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "cada03c9385f"
down_revision: Union[str, Sequence[str], None] = "46ac8cdd239e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """TD-115: Add identity_id and lead_id to message_logs, make patient_id nullable."""

    # 1. Add identity_id column (the universal anchor)
    op.add_column("message_logs", sa.Column("identity_id", sa.Uuid(), nullable=True))
    op.create_index(
        op.f("ix_message_logs_identity_id"),
        "message_logs",
        ["identity_id"],
        unique=False,
    )
    op.create_index(
        "ix_message_logs_identity_timestamp",
        "message_logs",
        ["identity_id", "timestamp"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_message_logs_identity",
        "message_logs",
        "identities",
        ["identity_id"],
        ["id"],
        ondelete="SET NULL",
    )

    # 2. Add lead_id column (optional Lead reference)
    op.add_column("message_logs", sa.Column("lead_id", sa.Uuid(), nullable=True))
    op.create_index(
        op.f("ix_message_logs_lead_id"), "message_logs", ["lead_id"], unique=False
    )
    op.create_foreign_key(
        "fk_message_logs_lead",
        "message_logs",
        "leads",
        ["lead_id"],
        ["id"],
        ondelete="CASCADE",
    )

    # 3. Make patient_id nullable (was NOT NULL before)
    op.alter_column(
        "message_logs", "patient_id", existing_type=sa.UUID(), nullable=True
    )


def downgrade() -> None:
    """Revert TD-115 changes.

    ⚠️ WARNING - POINT OF NO RETURN ⚠️
    This will FAIL if any messages with patient_id=NULL exist in the database.
    These are Lead-only messages created after this migration was applied.

    Before running downgrade, you MUST either:
    1. Delete all Lead-only messages: DELETE FROM message_logs WHERE patient_id IS NULL
    2. Or convert all Leads to Patients first

    Manual cleanup is REQUIRED before downgrade can succeed.
    """

    # Restore NOT NULL on patient_id (will fail if NULLs exist!)
    op.alter_column(
        "message_logs", "patient_id", existing_type=sa.UUID(), nullable=False
    )

    # Drop lead_id
    op.drop_constraint("fk_message_logs_lead", "message_logs", type_="foreignkey")
    op.drop_index(op.f("ix_message_logs_lead_id"), table_name="message_logs")
    op.drop_column("message_logs", "lead_id")

    # Drop identity_id
    op.drop_constraint("fk_message_logs_identity", "message_logs", type_="foreignkey")
    op.drop_index("ix_message_logs_identity_timestamp", table_name="message_logs")
    op.drop_index(op.f("ix_message_logs_identity_id"), table_name="message_logs")
    op.drop_column("message_logs", "identity_id")
