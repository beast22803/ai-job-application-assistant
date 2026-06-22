from typing import List, Optional
from pydantic import BaseModel

class ProfileItemRequest(BaseModel):
    id: Optional[str] = None
    # Experience fields
    title: Optional[str] = None
    company: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_current: Optional[bool] = False
    description: Optional[str] = None
    bullets: Optional[List[str]] = []
    technologies: Optional[List[str]] = []
    order_index: Optional[int] = 0
    # Project fields
    name: Optional[str] = None
    url: Optional[str] = None
    highlights: Optional[List[str]] = []
    # Skill fields
    category: Optional[str] = None
    proficiency: Optional[int] = 3
    # Education fields
    institution: Optional[str] = None
    degree: Optional[str] = None
    field: Optional[str] = None
    gpa: Optional[str] = None
