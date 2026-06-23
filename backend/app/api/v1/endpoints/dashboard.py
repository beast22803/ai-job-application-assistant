from fastapi import APIRouter, Depends
from app.repositories import application_repo
from app.core.auth import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/dashboard")
def get_dashboard(current_user: User = Depends(get_current_user)):
    user_id = current_user.id
    apps = application_repo.get_job_applications(user_id)
    
    from app.core.database import SessionLocal
    from app.models.application import SessionStore
    import json

    db = SessionLocal()
    try:
        # Query all evaluated sessions (active and completed) for this user that have ATS results
        stores = db.query(SessionStore)\
            .filter(SessionStore.user_id == user_id)\
            .filter(SessionStore.ats_results_json != None)\
            .filter(SessionStore.status != "abandoned")\
            .all()
            
        total_analyzed = len(stores)
        scores = []
        probs = []
        verdict_distribution = {}
        
        for s in stores:
            score = 0
            prob = 0
            verdict = "Unknown"
            
            # Try to retrieve optimized results (Step 3)
            if s.review_result_json:
                try:
                    review = json.loads(s.review_result_json)
                    score = review.get("current_ats_score") or review.get("ats_score") or 0
                    prob = review.get("interview_probability") or 0
                    verdict = review.get("verdict") or "Unknown"
                except Exception:
                    pass
            
            # Fallback to initial evaluation results (Step 1)
            if not score and s.ats_results_json:
                try:
                    ats = json.loads(s.ats_results_json)
                    score = ats.get("final_score") or 0
                    # Estimate verdict and probability
                    if score >= 85:
                        verdict = "Strong Apply"
                        prob = min(95, 70 + (score - 85) * 2)
                    elif score >= 70:
                        verdict = "Apply"
                        prob = 40 + (score - 70)
                    elif score >= 55:
                        verdict = "Apply with Resume Changes"
                        prob = 15 + (score - 55)
                    else:
                        verdict = "Skip"
                        prob = max(5, score // 5)
                except Exception:
                    pass
            
            if score > 0:
                scores.append(score)
                probs.append(prob)
                verdict_distribution[verdict] = verdict_distribution.get(verdict, 0) + 1
                
        avg_score = sum(scores) / len(scores) if scores else 0
        avg_prob = sum(probs) / len(probs) if probs else 0
        
        return {
            "status": "success",
            "total_analyzed": total_analyzed,
            "average_ats": round(avg_score, 1),
            "average_interview_probability": round(avg_prob, 1),
            "verdict_distribution": verdict_distribution,
            "applications": apps,
            "suggestion_impact_report": []
        }
    finally:
        db.close()

@router.get("/sessions")
def get_sessions(current_user: User = Depends(get_current_user)):
    sessions = application_repo.get_all_sessions(current_user.id)
    return sessions
