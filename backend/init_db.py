#!/usr/bin/env python3
"""
Database initialization script
Creates the default admin user and sets up initial data
"""

import os
import sys
import time
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError
from passlib.context import CryptContext

# Add the app directory to the Python path
sys.path.append('/app')

from app.models import User, Base
from app.config import settings

def create_admin_user():
    """Create the default admin user"""
    
    # Wait for database to be ready with retries
    max_retries = 30
    retry_delay = 2
    
    for attempt in range(max_retries):
        try:
            print(f"Attempting to connect to database (attempt {attempt + 1}/{max_retries})...")
            # Create database engine
            engine = create_engine(settings.database_url)
            
            # Test connection
            with engine.connect() as conn:
                print("✅ Database connection successful!")
                break
                
        except OperationalError as e:
            if attempt < max_retries - 1:
                print(f"❌ Database not ready yet: {e}")
                print(f"Waiting {retry_delay} seconds before retry...")
                time.sleep(retry_delay)
            else:
                print(f"❌ Failed to connect to database after {max_retries} attempts")
                raise e
    
    # Create all tables
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    # Create session
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Check if admin user already exists
        admin_user = db.query(User).filter(User.username == "admin").first()
        
        if admin_user:
            print("Admin user already exists")
            return
        
        # Create password context with simple hashing
        pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
        
        # Create admin user with simple password
        admin_user = User(
            username="admin",
            email="admin@patchmonitor.local",
            password_hash=pwd_context.hash("admin123"),
            role="admin",
            is_active=True
        )
        
        db.add(admin_user)
        db.commit()
        
        print("✅ Admin user created successfully!")
        print("   Username: admin")
        print("   Password: admin123")
        print("   Role: admin")
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()
