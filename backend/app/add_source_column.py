"""
Database migration script: adds 'source' column to the 'moms' table.
Safe to run multiple times — checks if column exists first.
"""

from sqlalchemy import text
from app.database import engine


def migrate():
    with engine.connect() as conn:
        # Check if column already exists (PostgreSQL)
        result = conn.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'moms' AND column_name = 'source'
        """))

        if result.fetchone() is None:
            conn.execute(text(
                "ALTER TABLE moms ADD COLUMN source VARCHAR DEFAULT 'upload'"
            ))
            conn.commit()
            print("✅ Added 'source' column to 'moms' table")
        else:
            print("ℹ️  'source' column already exists — skipping")


if __name__ == "__main__":
    migrate()
