from __future__ import annotations

import json
from datetime import datetime
from app.core.database import SessionLocal
from app.models.application import SessionStore, ResumeVersion, JobApplication

def save_session(
    session_id: str,
    job_desc: str,
    resume_txt: str,
    job_analysis: dict,
    resume_analysis: dict,
    ats_results: dict,
    suggestions: list,
    user_id: str | None = None,
) -> None:
    db = SessionLocal()
    try:
        store = db.query(SessionStore).filter(SessionStore.session_id == session_id).first()
        if not store:
            store = SessionStore(session_id=session_id, user_id=user_id)
            db.add(store)
        elif user_id:
            store.user_id = user_id

        store.job_description = job_desc
        store.resume_text = resume_txt
        store.job_analysis_json = json.dumps(job_analysis)
        store.resume_analysis_json = json.dumps(resume_analysis)
        store.ats_results_json = json.dumps(ats_results)
        store.suggestions_json = json.dumps(suggestions)
        store.timestamp = datetime.utcnow()

        db.commit()
    except Exception as e:
        print(f"Error saving session: {e}")
        db.rollback()
    finally:
        db.close()

def get_session(session_id: str, user_id: str) -> dict | None:
    db = SessionLocal()
    try:
        store = db.query(SessionStore).filter(SessionStore.session_id == session_id, SessionStore.user_id == user_id).first()
        if not store:
            return None
        result = {
            "session_id": store.session_id,
            "job_description": store.job_description,
            "resume_text": store.resume_text,
            "job_analysis": json.loads(store.job_analysis_json or "{}"),
            "resume_analysis": json.loads(store.resume_analysis_json or "{}"),
            "ats_results": json.loads(store.ats_results_json or "{}"),
            "suggestions": json.loads(store.suggestions_json or "[]"),
            "current_step": store.current_step or 2,
            "status": store.status or "active",
            "chat_history": json.loads(store.chat_history_json or "[]"),
        }
        # Include generated assets if they exist
        if store.review_result_json:
            result["review_result"] = json.loads(store.review_result_json)
        if store.optimized_resume:
            result["optimized_resume"] = store.optimized_resume
        if store.cover_letter:
            result["cover_letter"] = store.cover_letter
        if store.email_subject or store.email_body:
            result["recruiter_email"] = {
                "subject": store.email_subject or "",
                "body": store.email_body or "",
            }
        return result
    finally:
        db.close()

def get_all_sessions(user_id: str) -> list[dict]:
    db = SessionLocal()
    try:
        stores = db.query(SessionStore)\
            .filter(SessionStore.user_id == user_id)\
            .filter((SessionStore.status == "active") | (SessionStore.status == None))\
            .order_by(SessionStore.timestamp.desc())\
            .all()
        result = []
        for s in stores:
            job_analysis = json.loads(s.job_analysis_json or "{}")
            result.append({
                "session_id": s.session_id,
                "job_title": job_analysis.get("role_information") or job_analysis.get("role") or "Software Engineer",
                "company": job_analysis.get("company") or "Target Company",
                "current_step": s.current_step or 2,
                "timestamp": s.timestamp.isoformat()
            })
        return result
    finally:
        db.close()

def get_next_resume_version(session_id: str) -> int:
    db = SessionLocal()
    try:
        last = db.query(ResumeVersion)\
            .filter(ResumeVersion.session_id == session_id)\
            .order_by(ResumeVersion.version_num.desc())\
            .first()
        if not last:
            return 1
        return last.version_num + 1
    finally:
        db.close()

def save_resume_version(
    version_id: str,
    session_id: str,
    version_num: int,
    resume_text: str,
    resume_html: str,
    validation_res: dict,
    ats_score: int,
) -> None:
    db = SessionLocal()
    try:
        version = ResumeVersion(
            id=version_id,
            session_id=session_id,
            version_num=version_num,
            resume_text=resume_text,
            resume_html=resume_html,
            validation_json=json.dumps(validation_res),
            ats_score=ats_score,
            timestamp=datetime.utcnow()
        )
        db.add(version)
        db.commit()
    except Exception as e:
        print(f"Error saving resume version: {e}")
        db.rollback()
    finally:
        db.close()

def get_resume_versions(session_id: str) -> list[dict]:
    db = SessionLocal()
    try:
        versions = db.query(ResumeVersion)\
            .filter(ResumeVersion.session_id == session_id)\
            .order_by(ResumeVersion.version_num.asc())\
            .all()
        return [
            {
                "version_num": v.version_num,
                "resume_text": v.resume_text,
                "resume_html": v.resume_html,
                "validation": json.loads(v.validation_json or "{}"),
                "ats_score": v.ats_score,
                "timestamp": v.timestamp.isoformat(),
            }
            for v in versions
        ]
    finally:
        db.close()

def create_job_application(
    app_id: str,
    user_id: str,
    job_title: str,
    company: str,
    ats_score: int,
    verdict: str,
    resume_version: int,
    status: str = "Applied",
    session_id: str | None = None
) -> None:
    db = SessionLocal()
    try:
        app = JobApplication(
            id=app_id,
            user_id=user_id,
            job_title=job_title,
            company=company,
            ats_score=ats_score,
            verdict=verdict,
            resume_version=resume_version,
            status=status,
            session_id=session_id,
            timestamp=datetime.utcnow()
        )
        db.add(app)
        db.commit()
    except Exception as e:
        print(f"Error creating job application: {e}")
        db.rollback()
    finally:
        db.close()

def get_job_applications(user_id: str) -> list[dict]:
    db = SessionLocal()
    try:
        apps = db.query(JobApplication)\
            .filter(JobApplication.user_id == user_id)\
            .order_by(JobApplication.timestamp.desc())\
            .all()
        return [
            {
                "id": a.id,
                "job_title": a.job_title,
                "company": a.company,
                "ats_score": a.ats_score,
                "verdict": a.verdict,
                "resume_version": a.resume_version,
                "status": a.status,
                "session_id": a.session_id,
                "timestamp": a.timestamp.isoformat()
            }
            for a in apps
        ]
    finally:
        db.close()

def delete_session(session_id: str, user_id: str) -> bool:
    db = SessionLocal()
    try:
        store = db.query(SessionStore).filter(SessionStore.session_id == session_id, SessionStore.user_id == user_id).first()
        if store:
            # Delete related resume versions first
            db.query(ResumeVersion).filter(ResumeVersion.session_id == session_id).delete()
            db.delete(store)
            db.commit()
            return True
        return False
    except Exception as e:
        print(f"Error deleting session {session_id}: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def update_job_application_status(app_id: str, user_id: str, status: str) -> bool:
    db = SessionLocal()
    try:
        app = db.query(JobApplication).filter(JobApplication.id == app_id, JobApplication.user_id == user_id).first()
        if app:
            app.status = status
            db.commit()
            return True
        return False
    except Exception as e:
        print(f"Error updating status for application {app_id}: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def update_session_generated_assets(
    session_id: str,
    optimized_resume: str,
    cover_letter: str,
    email_subject: str,
    email_body: str,
    review_result: dict,
    user_id: str,
) -> bool:
    """Persist generated assets into the session and advance to step 3."""
    db = SessionLocal()
    try:
        store = db.query(SessionStore).filter(SessionStore.session_id == session_id, SessionStore.user_id == user_id).first()
        if not store:
            return False
        store.optimized_resume = optimized_resume
        store.cover_letter = cover_letter
        store.email_subject = email_subject
        store.email_body = email_body
        store.review_result_json = json.dumps(review_result)
        store.current_step = 3
        store.timestamp = datetime.utcnow()
        db.commit()
        return True
    except Exception as e:
        print(f"Error updating session assets for {session_id}: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def complete_session(session_id: str, user_id: str) -> bool:
    """Mark a session as completed (hides from active list)."""
    db = SessionLocal()
    try:
        store = db.query(SessionStore).filter(SessionStore.session_id == session_id, SessionStore.user_id == user_id).first()
        if not store:
            return False
        store.status = "completed"
        db.commit()
        return True
    except Exception as e:
        print(f"Error completing session {session_id}: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def abandon_session(session_id: str, user_id: str) -> bool:
    """Mark a session as abandoned (soft-hide from active list without data loss)."""
    db = SessionLocal()
    try:
        store = db.query(SessionStore).filter(SessionStore.session_id == session_id, SessionStore.user_id == user_id).first()
        if not store:
            return False
        store.status = "abandoned"
        db.commit()
        return True
    except Exception as e:
        print(f"Error abandoning session {session_id}: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def update_session_chat_history(session_id: str, user_id: str, chat_history: list) -> bool:
    """Save user refinement chat history in the session."""
    db = SessionLocal()
    try:
        store = db.query(SessionStore).filter(SessionStore.session_id == session_id, SessionStore.user_id == user_id).first()
        if not store:
            return False
        store.chat_history_json = json.dumps(chat_history)
        db.commit()
        return True
    except Exception as e:
        print(f"Error updating chat history for {session_id}: {e}")
        db.rollback()
        return False
    finally:
        db.close()
