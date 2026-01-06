"""v1.3.7 Add referral conversions and bonus patient slots.

Revision ID: 6f4a800bbe41
Revises: 
Create Date: 2026-01-06

The Mycelium Engine - Automated viral loop.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '6f4a800bbe41'
down_revision = None  # Will be set by Alembic
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Add bonus_patient_slots to organizations (for referral rewards)
    op.add_column(
        'organizations',
        sa.Column('bonus_patient_slots', sa.Integer(), nullable=False, server_default='0')
    )
    
    # 2. Create reward_type enum
    reward_type_enum = postgresql.ENUM('CREDITS', 'SLOT', 'BOTH', name='rewardtype')
    reward_type_enum.create(op.get_bind(), checkfirst=True)
    
    # 3. Create conversion_status enum
    conversion_status_enum = postgresql.ENUM('PENDING', 'PAID', name='conversionstatus')
    conversion_status_enum.create(op.get_bind(), checkfirst=True)
    
    # 4. Create referral_conversions table
    op.create_table(
        'referral_conversions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('referrer_org_id', postgresql.UUID(as_uuid=True), 
                  sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('referee_org_id', postgresql.UUID(as_uuid=True), 
                  sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('reward_type', reward_type_enum, nullable=False, server_default='BOTH'),
        sa.Column('credits_awarded', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('status', conversion_status_enum, nullable=False, server_default='PENDING'),
        sa.Column('converted_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True),
    )
    
    # 5. Create index for efficient lookups
    op.create_index('ix_referral_conversions_referrer', 'referral_conversions', ['referrer_org_id'])


def downgrade() -> None:
    op.drop_index('ix_referral_conversions_referrer')
    op.drop_table('referral_conversions')
    op.drop_column('organizations', 'bonus_patient_slots')
    
    # Drop enums
    op.execute('DROP TYPE IF EXISTS rewardtype')
    op.execute('DROP TYPE IF EXISTS conversionstatus')
