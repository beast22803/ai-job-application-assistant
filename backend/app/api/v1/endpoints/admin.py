from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User, AuditLog, UserPreference
from app.models.application import SessionStore, ResumeVersion, JobApplication
from app.models.master_profile import MasterExperience, MasterProject, MasterSkill, MasterEducation

router = APIRouter()

def verify_admin(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have administrative privileges."
        )
    return current_user

@router.get("/users")
def list_users(db: Session = Depends(get_db), admin: User = Depends(verify_admin)):
    users = db.query(User).all()
    result = []
    for u in users:
        sessions_count = db.query(SessionStore).filter(SessionStore.user_id == u.id).count()
        apps_count = db.query(JobApplication).filter(JobApplication.user_id == u.id).count()
        result.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "is_admin": bool(u.is_admin),
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "sessions_count": sessions_count,
            "applications_count": apps_count
        })
    return result

@router.delete("/user/{user_id}")
def delete_user(user_id: str, db: Session = Depends(get_db), admin: User = Depends(verify_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Prevent self-deletion
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")

    # Cascading deletes
    db.query(JobApplication).filter(JobApplication.user_id == user_id).delete()
    
    # Delete sessions and their resume versions
    sessions = db.query(SessionStore).filter(SessionStore.user_id == user_id).all()
    for s in sessions:
        db.query(ResumeVersion).filter(ResumeVersion.session_id == s.session_id).delete()
        db.delete(s)
        
    db.query(UserPreference).filter(UserPreference.user_id == user_id).delete()
    db.query(AuditLog).filter(AuditLog.user_id == user_id).delete()
    
    # Profile items
    db.query(MasterExperience).filter(MasterExperience.user_id == user_id).delete()
    db.query(MasterProject).filter(MasterProject.user_id == user_id).delete()
    db.query(MasterSkill).filter(MasterSkill.user_id == user_id).delete()
    db.query(MasterEducation).filter(MasterEducation.user_id == user_id).delete()

    db.delete(user)
    db.commit()
    return {"status": "success"}

@router.get("/sessions")
def list_sessions(db: Session = Depends(get_db), admin: User = Depends(verify_admin)):
    sessions = db.query(SessionStore).order_by(SessionStore.timestamp.desc()).all()
    result = []
    for s in sessions:
        user_name = "Unknown"
        if s.user_id:
            u = db.query(User).filter(User.id == s.user_id).first()
            if u:
                user_name = u.name
        result.append({
            "session_id": s.session_id,
            "user_id": s.user_id,
            "user_name": user_name,
            "job_title": "Software Engineer",
            "company": "Target Company",
            "current_step": s.current_step,
            "status": s.status,
            "timestamp": s.timestamp.isoformat() if s.timestamp else None
        })
        if s.job_analysis_json:
            try:
                import json
                job_analysis = json.loads(s.job_analysis_json)
                result[-1]["job_title"] = job_analysis.get("role_information") or job_analysis.get("role") or "Software Engineer"
                result[-1]["company"] = job_analysis.get("company") or "Target Company"
            except Exception:
                pass
    return result

@router.delete("/session/{session_id}")
def delete_session(session_id: str, db: Session = Depends(get_db), admin: User = Depends(verify_admin)):
    session = db.query(SessionStore).filter(SessionStore.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    db.query(ResumeVersion).filter(ResumeVersion.session_id == session_id).delete()
    db.delete(session)
    db.commit()
    return {"status": "success"}

@router.get("/applications")
def list_applications(db: Session = Depends(get_db), admin: User = Depends(verify_admin)):
    apps = db.query(JobApplication).order_by(JobApplication.timestamp.desc()).all()
    result = []
    for a in apps:
        user_name = "Unknown"
        if a.user_id:
            u = db.query(User).filter(User.id == a.user_id).first()
            if u:
                user_name = u.name
        result.append({
            "id": a.id,
            "user_id": a.user_id,
            "user_name": user_name,
            "job_title": a.job_title,
            "company": a.company,
            "ats_score": a.ats_score,
            "verdict": a.verdict,
            "status": a.status,
            "timestamp": a.timestamp.isoformat() if a.timestamp else None
        })
    return result

@router.delete("/application/{app_id}")
def delete_application(app_id: str, db: Session = Depends(get_db), admin: User = Depends(verify_admin)):
    app = db.query(JobApplication).filter(JobApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    db.delete(app)
    db.commit()
    return {"status": "success"}
