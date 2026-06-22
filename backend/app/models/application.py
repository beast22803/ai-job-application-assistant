from sqlalchemy import Column, String, Text, Integer, DateTime
from datetime import datetime
from app.core.database import Base

class JobApplication(Base):
    __tablename__ = "job_applications"
    id = Column(String(36), primary_key=True)
    user_id = Column(String(50), index=True)
    job_title = Column(String(255))
    company = Column(String(255))
    ats_score = Column(Integer)
    verdict = Column(String(50))
    resume_version = Column(Integer)
    status = Column(String(50), default="Applied")
    session_id = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

class SessionStore(Base):
    __tablename__ = "session_store"
    session_id = Column(String(50), primary_key=True)
    user_id = Column(String(50), nullable=True, index=True)
    job_description = Column(Text)
    resume_text = Column(Text)
    job_analysis_json = Column(Text)
    resume_analysis_json = Column(Text)
    ats_results_json = Column(Text)
    suggestions_json = Column(Text)
    # Generated assets (persisted after review/generate)
    optimized_resume = Column(Text, nullable=True)
    cover_letter = Column(Text, nullable=True)
    email_subject = Column(String(500), nullable=True)
    email_body = Column(Text, nullable=True)
    review_result_json = Column(Text, nullable=True)
    chat_history_json = Column(Text, default="[]")
    # Session lifecycle
    current_step = Column(Integer, default=2)  # 2=suggestions, 3=export
    status = Column(String(20), default="active")  # active, completed, abandoned
    timestamp = Column(DateTime, default=datetime.utcnow)

class ResumeVersion(Base):
    __tablename__ = "resume_versions"
    id = Column(String(36), primary_key=True)
    session_id = Column(String(50), index=True)
    version_num = Column(Integer)
    resume_text = Column(Text)
    resume_html = Column(Text)
    validation_json = Column(Text)
    ats_score = Column(Integer)
    timestamp = Column(DateTime, default=datetime.utcnow)
