"""Create missing teacher tables"""
import sys
sys.path.insert(0, '.')

from app.database import engine, Base
from app import models

# Create all missing tables
Base.metadata.create_all(bind=engine)

print("Tables created successfully!")

# Check which tables exist now
from sqlalchemy import inspect
inspector = inspect(engine)
tables = inspector.get_table_names()
print(f"Tables in database: {tables}")
