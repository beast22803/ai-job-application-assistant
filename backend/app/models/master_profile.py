from sqlalchemy import Column, String, Text, Integer, DateTime
from datetime import datetime
from app.core.database import Base

class MasterExperience(Base):
    __tablename__ = "master_experiences"
    id = Column(String(36), primary_key=True)
    user_id = Column(String(50), index=True)
    title = Column(String(255))
    company = Column(String(255))
    start_date = Column(String(20))
    end_date = Column(String(20))
    is_current = Column(Integer, default=0)
    description = Column(Text)
    bullets_json = Column(Text, default="[]")
    technologies_json = Column(Text, default="[]")
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class MasterProject(Base):
    __tablename__ = "master_projects"
    id = Column(String(36), primary_key=True)
    user_id = Column(String(50), index=True)
    name = Column(String(255))
    description = Column(Text)
    technologies_json = Column(Text, default="[]")
    url = Column(String(500), default="")
    highlights_json = Column(Text, default="[]")
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class MasterSkill(Base):
    __tablename__ = "master_skills"
    id = Column(String(36), primary_key=True)
    user_id = Column(String(50), index=True)
    category = Column(String(100))
    name = Column(String(100))
    proficiency = Column(Integer, default=3)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class MasterEducation(Base):
    __tablename__ = "master_education"
    id = Column(String(36), primary_key=True)
    user_id = Column(String(50), index=True)
    institution = Column(String(255))
    degree = Column(String(100))
    field = Column(String(255))
    start_date = Column(String(20))
    end_date = Column(String(20))
    gpa = Column(String(10), default="")
    highlights_json = Column(Text, default="[]")
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
