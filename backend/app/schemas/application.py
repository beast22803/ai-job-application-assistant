from typing import List, Optional
from pydantic import BaseModel

class ReviewRequest(BaseModel):
    session_id: str
    accepted_suggestions: List[str]
    rejected_suggestions: List[str]
    style_preference: str = "Formal"
    custom_instructions: Optional[str] = ""

class ApplicationRequest(BaseModel):
    job_title: str
    company: str
    ats_score: int
    verdict: str
    resume_version: int
    status: str = "Applied"
    session_id: Optional[str] = None

class UpdateStatusRequest(BaseModel):
    status: str

class MatchRequest(BaseModel):
    job_description: str


class ScoreRequest(BaseModel):
    resume_html: str


class VersionRequest(BaseModel):
    resume_html: str


class RefineRequest(BaseModel):
    session_id: str
    asset_type: str  # "resume", "cover_letter", or "email"
    instruction: str
    current_content: str
    history: Optional[List[dict]] = []


class FetchUrlRequest(BaseModel):
    url: str
