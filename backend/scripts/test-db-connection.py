#!/usr/bin/env python3
"""
Simple script to test database connection and initialization.
Run this after setting up PostgreSQL to verify everything works.
"""

import sys
import os

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from sqlalchemy import create_engine, text
from app.core.config import settings
from app.db.session import engine, SessionLocal
from app.db.init_db import init_db

def test_connection():
    """Test basic database connection."""
    print("Testing database connection...")
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            if result.fetchone()[0] == 1:
                print("✓ Database connection successful!")
                return True
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return False

def test_tables():
    """Test table creation and model imports."""
    print("Testing table creation...")
    try:
        from app.db.base import Base
        print(f"✓ Found {len(Base.metadata.tables)} table definitions")
        
        # Check if tables exist
        with engine.connect() as connection:
            for table_name in Base.metadata.tables.keys():
                result = connection.execute(text(f"""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = '{table_name}'
                    );
                """))
                exists = result.fetchone()[0]
                status = "✓" if exists else "✗"
                print(f"{status} Table '{table_name}' {'exists' if exists else 'missing'}")
        
        return True
    except Exception as e:
        print(f"✗ Table check failed: {e}")
        return False

def test_initialization():
    """Test database initialization."""
    print("Testing database initialization...")
    try:
        db = SessionLocal()
        init_db(db)
        db.close()
        print("✓ Database initialization successful!")
        return True
    except Exception as e:
        print(f"✗ Database initialization failed: {e}")
        return False

def main():
    print("=== Database Setup Test ===")
    print(f"Database URL: {settings.DATABASE_URL}")
    print()
    
    success = True
    success &= test_connection()
    success &= test_tables()
    success &= test_initialization()
    
    print()
    if success:
        print("🎉 All tests passed! Database setup is working correctly.")
    else:
        print("❌ Some tests failed. Check the output above for details.")
        sys.exit(1)

if __name__ == "__main__":
    main()