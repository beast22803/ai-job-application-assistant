from fastapi import APIRouter, HTTPException, Depends
from app.schemas.profile import ProfileItemRequest
from app.repositories import master_repo
from app.repositories import user_repo
from app.core.auth import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("")
@router.get("/")
def get_master_profile(current_user: User = Depends(get_current_user)):
    """Fetch all master profile data."""
    user_id = current_user.id
    profile = master_repo.get_master_profile(user_id)
    return profile

@router.post("/{section}")
def save_section_item(section: str, req: ProfileItemRequest, current_user: User = Depends(get_current_user)):
    user_id = current_user.id
    if section == "experience":
        item_id = master_repo.save_master_experience(user_id, req.dict(exclude_unset=True))
    elif section == "project":
        item_id = master_repo.save_master_project(user_id, req.dict(exclude_unset=True))
    elif section == "skill":
        item_id = master_repo.save_master_skill(user_id, req.dict(exclude_unset=True))
    elif section == "education":
        item_id = master_repo.save_master_education(user_id, req.dict(exclude_unset=True))
    else:
        raise HTTPException(status_code=400, detail="Invalid section")

    if not item_id:
        raise HTTPException(status_code=500, detail=f"Failed to save {section}")
    return {"status": "success", "id": item_id}

@router.delete("/{section}/{item_id}")
def delete_section_item(section: str, item_id: str, current_user: User = Depends(get_current_user)):
    user_id = current_user.id
    if section == "experience":
        success = master_repo.delete_master_experience(item_id, user_id)
    elif section == "project":
        success = master_repo.delete_master_project(item_id, user_id)
    elif section == "skill":
        success = master_repo.delete_master_skill(item_id, user_id)
    elif section == "education":
        success = master_repo.delete_master_education(item_id, user_id)
    else:
        raise HTTPException(status_code=400, detail="Invalid section")

    if not success:
        raise HTTPException(status_code=404, detail=f"{section.capitalize()} not found")
    return {"status": "success"}

from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db

class ContextRequest(BaseModel):
    user_memory: str

@router.get("/context")
def get_user_context(current_user: User = Depends(get_current_user)):
    return {"user_memory": current_user.user_memory or ""}

@router.post("/context")
def save_user_context(req: ContextRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.user_memory = req.user_memory
    db.commit()
    return {"status": "success", "user_memory": user.user_memory}
