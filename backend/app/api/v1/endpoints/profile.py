import uuid
from typing import Optional
from fastapi import APIRouter, HTTPException, Form
from app.schemas.profile import ProfileItemRequest
from app.repositories import master_repo
from app.repositories import user_repo

router = APIRouter()

@router.get("/{user_id}")
def get_master_profile(user_id: str):
    """Fetch all master profile data."""
    profile = master_repo.get_master_profile(user_id)
    return profile

@router.post("/{user_id}/{section}")
def save_section_item(user_id: str, section: str, req: ProfileItemRequest):
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

@router.delete("/{user_id}/{section}/{item_id}")
def delete_section_item(user_id: str, section: str, item_id: str):
    if section == "experience":
        success = master_repo.delete_master_experience(item_id)
    elif section == "project":
        success = master_repo.delete_master_project(item_id)
    elif section == "skill":
        success = master_repo.delete_master_skill(item_id)
    elif section == "education":
        success = master_repo.delete_master_education(item_id)
    else:
        raise HTTPException(status_code=400, detail="Invalid section")

    if not success:
        raise HTTPException(status_code=404, detail=f"{section.capitalize()} not found")
    return {"status": "success"}
