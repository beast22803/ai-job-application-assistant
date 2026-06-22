import uuid
import json
from typing import Optional
from fastapi import APIRouter, HTTPException, Form
from pydantic import BaseModel
from app.repositories import application_repo
from app.schemas.application import (
    ApplicationRequest, ReviewRequest, ScoreRequest,
    VersionRequest, RefineRequest, FetchUrlRequest,
    UpdateStatusRequest
)
import app.services.analyzer as az
import app.services.generator as gen

router = APIRouter()

# ── Session Retrieval ─────────────────────────────────────────────────────────

@router.get("/session/{session_id}")
def get_session_data(session_id: str):
    session = application_repo.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"status": "success", "session": session}

@router.delete("/session/{session_id}")
def delete_session(session_id: str):
    success = application_repo.delete_session(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found or could not be deleted")
    return {"status": "success"}

@router.patch("/session/{session_id}/abandon")
def abandon_session(session_id: str):
    success = application_repo.abandon_session(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found or could not be abandoned")
    return {"status": "success"}

# ── Live ATS Scoring ──────────────────────────────────────────────────────────

@router.post("/session/{session_id}/score")
def score_resume(session_id: str, req: ScoreRequest):
    session = application_repo.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    job_analysis = session["job_analysis"]
    resume_analysis = az.analyze_resume(req.resume_html)
    ats_results = az.run_ats_scoring(job_analysis, resume_analysis, session["job_description"], req.resume_html)
    suggestions = az.generate_suggestions(job_analysis, resume_analysis, ats_results)
    
    # Update the session with new data
    application_repo.save_session(
        session_id=session_id,
        job_desc=session["job_description"],
        resume_txt=req.resume_html,
        job_analysis=job_analysis,
        resume_analysis=resume_analysis,
        ats_results=ats_results,
        suggestions=suggestions
    )
    
    return {
        "status": "success",
        "ats_score": ats_results["final_score"],
        "missing_skills": ats_results["missing_skills"],
        "matched_skills": ats_results["matched_skills"],
        "suggestions": suggestions
    }

# ── Resume Version Management ────────────────────────────────────────────────

@router.post("/session/{session_id}/version")
def save_resume_version(session_id: str, req: VersionRequest):
    version_id = f"ver_{uuid.uuid4().hex[:10]}"
    version_num = application_repo.get_next_resume_version(session_id)
    
    application_repo.save_resume_version(
        version_id=version_id,
        session_id=session_id,
        version_num=version_num,
        resume_text=req.resume_html,
        resume_html=req.resume_html,
        validation_res={},
        ats_score=0
    )
    return {"status": "success", "version": version_num}

@router.get("/session/{session_id}/versions")
def get_resume_versions(session_id: str):
    versions = application_repo.get_resume_versions(session_id)
    return {"status": "success", "versions": versions}

@router.post("/session/{session_id}/version/{version_num}/restore")
def restore_version(session_id: str, version_num: int):
    versions = application_repo.get_resume_versions(session_id)
    target = next((v for v in versions if v["version_num"] == version_num), None)
    if not target:
        raise HTTPException(status_code=404, detail="Version not found")
    
    # Score the restored version to update session data
    score_resume(session_id, ScoreRequest(resume_html=target["resume_html"] or target["resume_text"]))
    return {"status": "success"}

# ── Application Tracking ─────────────────────────────────────────────────────

@router.post("/application")
def create_application(req: ApplicationRequest):
    app_id = f"app_{uuid.uuid4().hex[:10]}"
    application_repo.create_job_application(
        app_id=app_id,
        user_id=req.user_id,
        job_title=req.job_title,
        company=req.company,
        ats_score=req.ats_score,
        verdict=req.verdict,
        resume_version=req.resume_version,
        status=req.status,
        session_id=req.session_id
    )
    # Mark the session as completed so it no longer appears in "Active Sessions"
    if req.session_id:
        application_repo.complete_session(req.session_id)
    return {"status": "success", "id": app_id}

@router.patch("/application/{app_id}/status")
def update_application_status(app_id: str, req: UpdateStatusRequest):
    success = application_repo.update_job_application_status(app_id, req.status)
    if not success:
        raise HTTPException(status_code=404, detail="Application not found or could not be updated")
    return {"status": "success"}

# ── Asset Refinement (Chat-based) ────────────────────────────────────────────

@router.post("/refine")
def refine_asset(req: RefineRequest):
    """Refine a resume, cover letter, or email via conversational AI."""
    try:
        refined = gen.refine_content(
            asset_type=req.asset_type,
            current_content=req.current_content,
            instruction=req.instruction,
            history=req.history or []
        )
        return {"status": "success", "refined_content": refined}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Refinement failed: {e}")

# ── Review & Generate Package ─────────────────────────────────────────────────

@router.post("/review")
def review_resume(req: ReviewRequest):
    session = application_repo.get_session(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Build a combined instruction from accepted/rejected suggestions
    instructions = f"Style: {req.style_preference}. "
    if req.accepted_suggestions:
        instructions += f"Ensure these are included: {', '.join(req.accepted_suggestions)}. "
    if req.rejected_suggestions:
        instructions += f"Do NOT include these: {', '.join(req.rejected_suggestions)}. "
    if req.custom_instructions:
        instructions += f"User note: {req.custom_instructions}."

    new_resume = gen.optimize_resume(
        original_resume=session["resume_text"],
        job_desc=session["job_description"],
        accepted_suggestions=req.accepted_suggestions,
        user_prefs={"style": req.style_preference},
        custom_instructions=instructions,
        job_analysis=session["job_analysis"],
        resume_analysis=session["resume_analysis"]
    )
    
    new_resume_analysis = az.analyze_resume(new_resume)
    new_ats_results = az.run_ats_scoring(session["job_analysis"], new_resume_analysis, session["job_description"], new_resume)
    
    cover_letter = gen.generate_cover_letter(
        optimized_resume=new_resume,
        job_desc=session["job_description"],
        style=req.style_preference,
        job_analysis=session["job_analysis"],
        resume_analysis=new_resume_analysis,
        ats_results=new_ats_results
    )
    
    recruiter_email = gen.generate_recruiter_email(
        candidate_name=new_resume_analysis.get("name", "Candidate"),
        role_info=session["job_analysis"].get("role", "the role"),
        company=session["job_analysis"].get("company", "the company"),
        resume_summary=new_resume_analysis.get("summary", ""),
        job_analysis=session["job_analysis"],
        resume_analysis=new_resume_analysis,
        ats_results=new_ats_results
    )
    
    validation = gen.validate_resume(new_resume, new_resume_analysis.get("name", "Candidate"))
    
    current_ats_score = new_ats_results.get("final_score", 0)
    previous_ats_score = session.get("ats_results", {}).get("final_score", 0)
    ats_gain = current_ats_score - previous_ats_score
    
    version_num = application_repo.get_next_resume_version(req.session_id)
    
    # Verdict logic
    if current_ats_score >= 85:
        verdict = "Strong Apply"
    elif current_ats_score >= 70:
        verdict = "Apply"
    elif current_ats_score >= 55:
        verdict = "Apply with Resume Changes"
    else:
        verdict = "Skip"
    
    # Interview probability estimation
    if current_ats_score >= 85:
        interview_probability = min(95, 70 + (current_ats_score - 85) * 2)
    elif current_ats_score >= 70:
        interview_probability = 40 + (current_ats_score - 70)
    elif current_ats_score >= 55:
        interview_probability = 15 + (current_ats_score - 55)
    else:
        interview_probability = max(5, current_ats_score // 5)
    
    verdict_explanation = f"Your resume scores {current_ats_score}/100 against this job's ATS criteria."
    if ats_gain > 0:
        verdict_explanation += f" That's a +{ats_gain} point improvement from the original."
    
    ip_explanation = f"Based on skill alignment and experience match."
    
    return_data = {
        "status": "success",
        "session_id": req.session_id,
        "resume_version": version_num,
        "optimized_resume": new_resume,
        "validation": validation,
        "previous_ats_score": previous_ats_score,
        "current_ats_score": current_ats_score,
        "ats_gain": ats_gain,
        "cover_letter": cover_letter,
        "recruiter_email": recruiter_email,
        "matched_skills": new_ats_results.get("matched_skills", []),
        "missing_skills": new_ats_results.get("missing_skills", []),
        "verdict": verdict,
        "verdict_explanation": verdict_explanation,
        "interview_probability": interview_probability,
        "interview_probability_explanation": ip_explanation
    }

    # Persist generated assets into the session for resumption
    application_repo.update_session_generated_assets(
        session_id=req.session_id,
        optimized_resume=new_resume,
        cover_letter=cover_letter,
        email_subject=recruiter_email.get("subject", "") if isinstance(recruiter_email, dict) else "",
        email_body=recruiter_email.get("body", "") if isinstance(recruiter_email, dict) else "",
        review_result=return_data,
    )

    return return_data

# ── URL Fetching ──────────────────────────────────────────────────────────────

@router.post("/fetch-url")
def fetch_url(req: FetchUrlRequest):
    import requests
    from bs4 import BeautifulSoup
    try:
        r = requests.get(req.url, timeout=10)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, 'html.parser')
        
        # Remove scripts and styles
        for element in soup(["script", "style", "nav", "footer", "header"]):
            element.decompose()
            
        text = soup.get_text(separator=' ')
        # Clean up whitespace
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = '\n'.join(chunk for chunk in chunks if chunk)
        
        return {"status": "success", "text": text}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
