"""Add BUILDER/CENTER tiers and migrate FREE->BUILDER

Revision ID: f01a2b3c4d5e
Revises: c6f0b381121c
Create Date: 2025-12-15

PostgreSQL Enum Migration Strategy:
- Rename FREE -> BUILDER (PostgreSQL supports ALTER TYPE ... RENAME VALUE)
- Remove TRIAL
- Add CENTER
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "f01a2b3c4d5e"
down_revision = "b860b3630162"  # Previous head migration
branch_labels = None
depends_on = None


def upgrade() -> None:
    # === Part 1: OrgTier Enum Migration ===
    # PostgreSQL Enum migration strategy:
    # 1. Migrate any TRIAL orgs to FREE (will become BUILDER)
    # 2. Rename FREE -> BUILDER
    # 3. Add CENTER

    op.execute("UPDATE organizations SET tier = 'FREE' WHERE tier = 'TRIAL'")
    op.execute("ALTER TYPE orgtier RENAME VALUE 'FREE' TO 'BUILDER'")
    op.execute("ALTER TYPE orgtier ADD VALUE 'CENTER'")
    # Note: TRIAL remains in enum but unused (PG limitation)

    # === Part 2: Service-Therapist M2M Table ===
    op.create_table(
        "service_therapist_link",
        sa.Column("service_type_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(
            ["service_type_id"], ["service_types.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("service_type_id", "user_id"),
    )

    # === Part 3: Smart Migration - Assign existing services to OWNER ===
    # CTO Requirement: Prevent empty calendars after migration
    op.execute("""
        INSERT INTO service_therapist_link (service_type_id, user_id)
        SELECT st.id, u.id 
        FROM service_types st
        JOIN users u ON u.organization_id = st.organization_id
        WHERE u.role = 'OWNER'
    """)


def downgrade() -> None:
    # Drop M2M table
    op.drop_table("service_therapist_link")

    # Revert enum (partial - can't fully remove CENTER in PG)
    op.execute("UPDATE organizations SET tier = 'BUILDER' WHERE tier = 'CENTER'")
    op.execute("ALTER TYPE orgtier RENAME VALUE 'BUILDER' TO 'FREE'")
