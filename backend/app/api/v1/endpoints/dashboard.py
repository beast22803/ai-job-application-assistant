from fastapi import APIRouter, Depends
from app.repositories import application_repo
from app.core.auth import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/dashboard")
def get_dashboard(current_user: User = Depends(get_current_user)):
    user_id = current_user.id
    apps = application_repo.get_job_applications(user_id)
    sessions = application_repo.get_all_sessions(user_id)

    total_apps = len(apps)
    interviews = sum(1 for a in apps if a["status"] in ["Interview", "Offer"])
    success_rate = (interviews / total_apps * 100) if total_apps > 0 else 0

    avg_score = sum(a["ats_score"] for a in apps) / total_apps if total_apps > 0 else 0

    verdict_distribution = {}
    for a in apps:
        verdict = a.get("verdict", "Unknown")
        verdict_distribution[verdict] = verdict_distribution.get(verdict, 0) + 1

    return {
        "status": "success",
        "total_analyzed": len(sessions),
        "average_ats": round(avg_score, 1),
        "average_interview_probability": round(success_rate, 1),
        "verdict_distribution": verdict_distribution,
        "applications": apps,
        "suggestion_impact_report": []
    }

@router.get("/sessions")
def get_sessions(current_user: User = Depends(get_current_user)):
    sessions = application_repo.get_all_sessions(current_user.id)
    return sessions
