from __future__ import annotations

import uuid
from typing import Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form

import app.services.analyzer as az
import app.services.matchmaker as mm
from app.repositories import application_repo, user_repo, master_repo

router = APIRouter()

@router.post("/analyze")
async def analyze(
    user_id: str = Form("varshit"),
    job_description: str = Form(...),
    resume_text: Optional[str] = Form(None),
    resume_file: Optional[UploadFile] = File(None),
    use_master_profile: Optional[str] = Form(None),
):
    user_repo.log_event("ANALYZE_START", user_id, {"has_file": resume_file is not None})

    parsed_resume_text = ""
    if use_master_profile == "true":
        profile = master_repo.get_master_profile(user_id)
        total_entries = len(profile.get("experiences", [])) + len(profile.get("projects", [])) + len(profile.get("skills", [])) + len(profile.get("education", []))
        if total_entries == 0:
            user_repo.log_event("ANALYZE_FAILED", user_id, {"error": "Empty master profile"})
            raise HTTPException(status_code=400, detail="Master profile is empty. Please add your career data first.")
        parsed_resume_text = mm.compile_profile_text(profile)
    elif resume_file:
        try:
            content = await resume_file.read()
            parsed_resume_text = az.extract_resume_text(resume_file.filename, content)
        except Exception as e:
            user_repo.log_event("ANALYZE_FAILED", user_id, {"error": str(e)})
            raise HTTPException(status_code=400, detail=f"Failed to read resume file: {e}")
    elif resume_text:
        parsed_resume_text = resume_text.strip()
    else:
        user_repo.log_event("ANALYZE_FAILED", user_id, {"error": "No resume provided"})
        raise HTTPException(status_code=400, detail="Please provide a resume file or text.")

    if not parsed_resume_text:
        user_repo.log_event("ANALYZE_FAILED", user_id, {"error": "Empty resume text"})
        raise HTTPException(status_code=400, detail="Resume text content is empty.")

    try:
        job_analysis = az.analyze_job_description(job_description)
        resume_analysis = az.analyze_resume(parsed_resume_text)
        ats_results = az.run_ats_scoring(job_analysis, resume_analysis, job_description, parsed_resume_text)
        suggestions = az.generate_suggestions(job_analysis, resume_analysis, ats_results)
    except Exception as e:
        user_repo.log_event("ANALYZE_FAILED", user_id, {"error": str(e)})
        raise HTTPException(status_code=500, detail=f"AI Analysis failed: {e}")

    session_id = f"session_{uuid.uuid4().hex[:10]}"
    application_repo.save_session(
        session_id=session_id,
        job_desc=job_description,
        resume_txt=parsed_resume_text,
        job_analysis=job_analysis,
        resume_analysis=resume_analysis,
        ats_results=ats_results,
        suggestions=suggestions
    )

    user_repo.log_event("ANALYZE_SUCCESS", user_id, {"session_id": session_id, "score": ats_results["final_score"]})

    return {
        "session_id": session_id,
        "ats_score": ats_results["final_score"],
        "missing_skills": ats_results["missing_skills"],
        "matched_skills": ats_results["matched_skills"],
        "scores": ats_results["scores"],
        "job_title": job_analysis.get("role_information", "Software Engineer"),
        "company": job_analysis.get("company", "Target Company"),
        "suggestions": suggestions
    }
