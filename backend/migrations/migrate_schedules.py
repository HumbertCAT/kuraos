"""Migration: Create availability_schedules table and migrate existing blocks.

This script:
1. Creates the availability_schedules table
2. Creates a "Default" schedule for each user who has AvailabilityBlocks
3. Updates existing AvailabilityBlocks to point to their user's default schedule
4. Adds schedule_id columns to time_off and specific_availability (nullable)
5. Adds schedule_id and scheduling_type to service_types
"""

import asyncio
from sqlalchemy import text
from app.db.base import engine


async def run_migration():
    async with engine.begin() as conn:
        print("Starting migration...")

        # 1. Create availability_schedules table
        await conn.execute(
            text("""
            CREATE TABLE IF NOT EXISTS availability_schedules (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id),
                name VARCHAR(100) NOT NULL,
                is_default BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)
        )
        print("✓ Created availability_schedules table")

        await conn.execute(
            text("""
            CREATE INDEX IF NOT EXISTS ix_availability_schedules_user_id 
                ON availability_schedules(user_id)
        """)
        )
        print("✓ Created index on availability_schedules")

        # 2. Add schedule_id column to availability_blocks (nullable first)
        try:
            await conn.execute(
                text("""
                ALTER TABLE availability_blocks 
                ADD COLUMN IF NOT EXISTS schedule_id UUID REFERENCES availability_schedules(id)
            """)
            )
            print("✓ Added schedule_id to availability_blocks")
        except Exception as e:
            print(f"  (schedule_id already exists or error: {e})")

        # 3. Add schedule_id to time_off (nullable)
        try:
            await conn.execute(
                text("""
                ALTER TABLE time_off 
                ADD COLUMN IF NOT EXISTS schedule_id UUID REFERENCES availability_schedules(id)
            """)
            )
            print("✓ Added schedule_id to time_off")
        except Exception as e:
            print(f"  (schedule_id already exists or error: {e})")

        # 4. Add schedule_id to specific_availability (nullable)
        try:
            await conn.execute(
                text("""
                ALTER TABLE specific_availability 
                ADD COLUMN IF NOT EXISTS schedule_id UUID REFERENCES availability_schedules(id)
            """)
            )
            print("✓ Added schedule_id to specific_availability")
        except Exception as e:
            print(f"  (schedule_id already exists or error: {e})")

        # 5. Add schedule_id and scheduling_type to service_types (nullable)
        try:
            await conn.execute(
                text("""
                ALTER TABLE service_types 
                ADD COLUMN IF NOT EXISTS schedule_id UUID REFERENCES availability_schedules(id)
            """)
            )
            print("✓ Added schedule_id to service_types")
        except Exception as e:
            print(f"  (schedule_id already exists or error: {e})")

        try:
            await conn.execute(
                text("""
                ALTER TABLE service_types 
                ADD COLUMN IF NOT EXISTS scheduling_type VARCHAR(20) DEFAULT 'CALENDAR'
            """)
            )
            print("✓ Added scheduling_type to service_types")
        except Exception as e:
            print(f"  (scheduling_type already exists or error: {e})")

        # 6. Find all users who have availability_blocks but no schedule
        result = await conn.execute(
            text("""
            SELECT DISTINCT ab.user_id 
            FROM availability_blocks ab
            WHERE ab.schedule_id IS NULL
            AND NOT EXISTS (
                SELECT 1 FROM availability_schedules s 
                WHERE s.user_id = ab.user_id AND s.is_default = TRUE
            )
        """)
        )
        users_needing_schedule = result.fetchall()
        print(f"✓ Found {len(users_needing_schedule)} users needing default schedule")

        # 7. Create default schedule for each user and update their blocks
        for (user_id,) in users_needing_schedule:
            # Create default schedule
            schedule_result = await conn.execute(
                text("""
                INSERT INTO availability_schedules (user_id, name, is_default)
                VALUES (:user_id, 'Default', TRUE)
                RETURNING id
            """),
                {"user_id": user_id},
            )
            schedule_id = schedule_result.fetchone()[0]

            # Update blocks
            await conn.execute(
                text("""
                UPDATE availability_blocks 
                SET schedule_id = :schedule_id
                WHERE user_id = :user_id AND schedule_id IS NULL
            """),
                {"schedule_id": schedule_id, "user_id": user_id},
            )

            print(f"  → Created schedule for user {user_id}")

        # 8. Create index on schedule_id
        await conn.execute(
            text("""
            CREATE INDEX IF NOT EXISTS ix_availability_blocks_schedule_id 
                ON availability_blocks(schedule_id)
        """)
        )
        print("✓ Created indexes")

        print("\n✅ Migration complete!")


if __name__ == "__main__":
    asyncio.run(run_migration())
