from sqlalchemy import Column, String, Text, Integer, DateTime
from datetime import datetime
from app.core.database import Base

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
