"""add_booking_self_service_fields

Revision ID: 04c7843ea29d
Revises: 52c5abb515c1
Create Date: 2025-12-15 02:18:13.541897

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "04c7843ea29d"
down_revision: Union[str, Sequence[str], None] = "52c5abb515c1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add self-service booking management fields."""
    # Add public_token as nullable first
    op.add_column(
        "bookings", sa.Column("public_token", sa.String(length=64), nullable=True)
    )

    # Generate tokens for existing bookings
    op.execute("""
        UPDATE bookings 
        SET public_token = md5(random()::text || clock_timestamp()::text || id::text)
        WHERE public_token IS NULL
    """)

    # Now make it NOT NULL
    op.alter_column("bookings", "public_token", nullable=False)

    # Add cancellation tracking fields
    op.add_column(
        "bookings", sa.Column("cancellation_reason", sa.Text(), nullable=True)
    )
    op.add_column(
        "bookings", sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column(
        "bookings", sa.Column("cancelled_by", sa.String(length=20), nullable=True)
    )
    op.add_column(
        "bookings", sa.Column("rescheduled_from_id", sa.Uuid(), nullable=True)
    )

    # Create index and foreign key
    op.create_index(
        op.f("ix_bookings_public_token"), "bookings", ["public_token"], unique=True
    )
    op.create_foreign_key(
        "fk_bookings_rescheduled_from",
        "bookings",
        "bookings",
        ["rescheduled_from_id"],
        ["id"],
    )

    # Add cancellation policy to service_types
    op.add_column(
        "service_types",
        sa.Column(
            "cancellation_policy",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
    )


def downgrade() -> None:
    """Remove self-service booking management fields."""
    op.drop_column("service_types", "cancellation_policy")
    op.drop_constraint("fk_bookings_rescheduled_from", "bookings", type_="foreignkey")
    op.drop_index(op.f("ix_bookings_public_token"), table_name="bookings")
    op.drop_column("bookings", "rescheduled_from_id")
    op.drop_column("bookings", "cancelled_by")
    op.drop_column("bookings", "cancelled_at")
    op.drop_column("bookings", "cancellation_reason")
    op.drop_column("bookings", "public_token")
