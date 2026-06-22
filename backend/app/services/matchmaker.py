
"""
matchmaker.py — Semantic matching engine that selects the most relevant
entries from the user's Master Profile for a given job description.
"""

from __future__ import annotations

import json
from app.core.config import get_llm


def compile_profile_text(profile: dict) -> str:
    """Convert structured profile data into a formatted text resume."""
    sections = []
    
    # Experience
    if profile.get("experiences"):
        sections.append("WORK EXPERIENCE")
        sections.append("=" * 40)
        for exp in profile["experiences"]:
            date_range = f"{exp.get('start_date', '')} - {'Present' if exp.get('is_current') else exp.get('end_date', '')}"
            sections.append(f"\n{exp.get('title', '')} | {exp.get('company', '')} | {date_range}")
            if exp.get("description"):
                sections.append(exp["description"])
            for bullet in exp.get("bullets", []):
                sections.append(f"  • {bullet}")
            if exp.get("technologies"):
                sections.append(f"  Technologies: {', '.join(exp['technologies'])}")
    
    # Projects
    if profile.get("projects"):
        sections.append("\nPROJECTS")
        sections.append("=" * 40)
        for proj in profile["projects"]:
            sections.append(f"\n{proj.get('name', '')}")
            if proj.get("description"):
                sections.append(proj["description"])
            for h in proj.get("highlights", []):
                sections.append(f"  • {h}")
            if proj.get("technologies"):
                sections.append(f"  Technologies: {', '.join(proj['technologies'])}")
            if proj.get("url"):
                sections.append(f"  URL: {proj['url']}")
    
    # Skills
    if profile.get("skills"):
        sections.append("\nSKILLS")
        sections.append("=" * 40)
        categories = {}
        for skill in profile["skills"]:
            cat = skill.get("category", "General")
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(skill["name"])
        for cat, names in categories.items():
            sections.append(f"  {cat}: {', '.join(names)}")
    
    # Education
    if profile.get("education"):
        sections.append("\nEDUCATION")
        sections.append("=" * 40)
        for edu in profile["education"]:
            sections.append(f"\n{edu.get('degree', '')} in {edu.get('field', '')} — {edu.get('institution', '')}")
            date_range = f"{edu.get('start_date', '')} - {edu.get('end_date', '')}"
            sections.append(f"  {date_range}")
            if edu.get("gpa"):
                sections.append(f"  GPA: {edu['gpa']}")
            for h in edu.get("highlights", []):
                sections.append(f"  • {h}")
    
    return "\n".join(sections)


def match_profile_to_job(profile: dict, job_analysis: dict, job_description: str) -> dict:
    """
    Use LLM to semantically match the master profile entries to the job.
    Returns a curated selection with relevance reasoning.
    """
    llm = get_llm()
    
    profile_text = compile_profile_text(profile)
    
    prompt = f"""You are an expert resume strategist. Given a candidate's complete career profile and a target job description, select the MOST RELEVANT entries to include in a tailored resume.

CANDIDATE'S COMPLETE PROFILE:
{profile_text}

TARGET JOB DESCRIPTION:
{job_description}

JOB ANALYSIS:
{json.dumps(job_analysis, indent=2)}

Your task:
1. Select which work experiences are most relevant (by their order in the list, 0-indexed)
2. Select which projects to feature
3. Identify which skills to highlight (prioritize skills that match the job requirements)
4. Select education entries to include
5. For each selected experience, identify which bullet points are most impactful for this specific role

Respond in this exact JSON format:
{{
  "selected_experience_indices": [0, 1],
  "selected_project_indices": [0],
  "selected_skill_names": ["Python", "React"],
  "selected_education_indices": [0],
  "experience_bullet_selections": {{
    "0": [0, 1, 3],
    "1": [0, 2]
  }},
  "section_order": ["experience", "skills", "projects", "education"],
  "reasoning": "Brief explanation of selection strategy"
}}

Only output the JSON, nothing else."""
    
    try:
        response = llm.invoke(prompt)
        content = response.content if hasattr(response, 'content') else str(response)
        
        # Parse JSON from response
        import re
        json_match = re.search(r'\{[\s\S]*\}', content)
        if json_match:
            selection = json.loads(json_match.group())
        else:
            selection = json.loads(content)
        
        # Build the compiled resume text from selected entries
        compiled_text = _build_compiled_resume(profile, selection)
        selection["compiled_resume_text"] = compiled_text
        
        return selection
        
    except Exception as e:
        print(f"Matchmaker error: {e}")
        # Fallback: include everything
        return {
            "selected_experience_indices": list(range(len(profile.get("experiences", [])))),
            "selected_project_indices": list(range(len(profile.get("projects", [])))),
            "selected_skill_names": [s["name"] for s in profile.get("skills", [])],
            "selected_education_indices": list(range(len(profile.get("education", [])))),
            "experience_bullet_selections": {},
            "section_order": ["experience", "skills", "projects", "education"],
            "reasoning": "Fallback: including all entries due to matching error.",
            "compiled_resume_text": compile_profile_text(profile)
        }


def _build_compiled_resume(profile: dict, selection: dict) -> str:
    """Build a compiled resume text from selected entries."""
    sections = []
    
    exp_indices = selection.get("selected_experience_indices", [])
    bullet_selections = selection.get("experience_bullet_selections", {})
    
    experiences = profile.get("experiences", [])
    if exp_indices and experiences:
        sections.append("WORK EXPERIENCE")
        for idx in exp_indices:
            if idx < len(experiences):
                exp = experiences[idx]
                date_range = f"{exp.get('start_date', '')} - {'Present' if exp.get('is_current') else exp.get('end_date', '')}"
                sections.append(f"\n{exp.get('title', '')} | {exp.get('company', '')} | {date_range}")
                if exp.get("description"):
                    sections.append(exp["description"])
                
                bullets = exp.get("bullets", [])
                selected_bullet_indices = bullet_selections.get(str(idx), list(range(len(bullets))))
                for bi in selected_bullet_indices:
                    if bi < len(bullets):
                        sections.append(f"  • {bullets[bi]}")
                
                if exp.get("technologies"):
                    sections.append(f"  Technologies: {', '.join(exp['technologies'])}")
    
    # Skills
    selected_skills = selection.get("selected_skill_names", [])
    all_skills = profile.get("skills", [])
    if selected_skills:
        sections.append("\nSKILLS")
        categories = {}
        for skill in all_skills:
            if skill["name"] in selected_skills:
                cat = skill.get("category", "General")
                if cat not in categories:
                    categories[cat] = []
                categories[cat].append(skill["name"])
        for cat, names in categories.items():
            sections.append(f"  {cat}: {', '.join(names)}")
    
    # Projects
    proj_indices = selection.get("selected_project_indices", [])
    projects = profile.get("projects", [])
    if proj_indices and projects:
        sections.append("\nPROJECTS")
        for idx in proj_indices:
            if idx < len(projects):
                proj = projects[idx]
                sections.append(f"\n{proj.get('name', '')}")
                if proj.get("description"):
                    sections.append(proj["description"])
                for h in proj.get("highlights", []):
                    sections.append(f"  • {h}")
                if proj.get("technologies"):
                    sections.append(f"  Technologies: {', '.join(proj['technologies'])}")
    
    # Education
    edu_indices = selection.get("selected_education_indices", [])
    education = profile.get("education", [])
    if edu_indices and education:
        sections.append("\nEDUCATION")
        for idx in edu_indices:
            if idx < len(education):
                edu = education[idx]
                sections.append(f"\n{edu.get('degree', '')} in {edu.get('field', '')} — {edu.get('institution', '')}")
                if edu.get("gpa"):
                    sections.append(f"  GPA: {edu['gpa']}")
                for h in edu.get("highlights", []):
                    sections.append(f"  • {h}")
    
    return "\n".join(sections)
