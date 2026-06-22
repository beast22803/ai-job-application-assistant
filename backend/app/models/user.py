import uuid
from sqlalchemy import Column, String, Text, Integer, DateTime
from datetime import datetime
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_admin = Column(Integer, default=0)
    user_memory = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

class UserPreference(Base):
    __tablename__ = "user_preferences"
    user_id = Column(String(50), primary_key=True)
    preferences_json = Column(Text)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    event_type = Column(String(100))
    user_id = Column(String(50), index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    details = Column(Text)
