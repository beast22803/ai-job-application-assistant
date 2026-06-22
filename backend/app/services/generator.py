
"""
generator.py — Handles optimized resume generation, cover letter styling,
recruiter email crafting, and resume content validation.
"""

from __future__ import annotations

import json
import re
import os
from langchain_core.messages import HumanMessage, SystemMessage
from app.core.config import get_llm
from app.services.analyzer import load_prompt, _clean_json_output

# ── HTML Resume Renderer (Idea A) ─────────────────────────────────────────────

def render_resume_json_to_html(resume_data: dict) -> str:
    """Render the structured resume JSON payload to a beautiful, clean A4 print-ready HTML layout (Idea A)."""
    # Parse header
    header_str = resume_data.get("header", "")
    parts = [p.strip() for p in header_str.split("|") if p.strip()]
    if parts:
        name = parts[0]
        contact_info = parts[1:]
    else:
        name = "Candidate"
        contact_info = []
        
    # Render header block
    contact_spans = "".join([f"<span>{item}</span>" for item in contact_info])
    header_html = f"""
    <div class="header">
      <h1>{name}</h1>
      <div class="contact-info">
        {contact_spans}
      </div>
    </div>
    """
    
    # Render summary block
    summary = resume_data.get("summary", "").strip()
    summary_html = ""
    if summary:
        summary_html = f"""
        <div class="section">
          <h2 class="section-title">Professional Summary</h2>
          <p class="summary-text">{summary}</p>
        </div>
        """
        
    # Render skills block
    skills = resume_data.get("skills", [])
    skills_html = ""
    if skills:
        skills_tags = "".join([f"<span class='skill-tag'>{skill}</span>" for skill in skills])
        skills_html = f"""
        <div class="section">
          <h2 class="section-title">Skills</h2>
          <div class="skills-grid">
            {skills_tags}
          </div>
        </div>
        """
        
    # Render experience block
    experience = resume_data.get("experience", [])
    exp_items_html = ""
    for exp_str in experience:
        if not exp_str or not isinstance(exp_str, str):
            continue
        lines = [line.strip() for line in exp_str.split("\n") if line.strip()]
        if not lines:
            continue
        meta_line = lines[0]
        # Parse meta_line
        meta_parts = [p.strip() for p in meta_line.split("·")]
        if len(meta_parts) < 3:
            meta_parts = [p.strip() for p in meta_line.split("|")]
        if len(meta_parts) < 3:
            meta_parts = [p.strip() for p in meta_line.split(" - ")]
            
        if len(meta_parts) >= 3:
            title = meta_parts[0]
            company = meta_parts[1]
            dates = " · ".join(meta_parts[2:])
        elif len(meta_parts) == 2:
            title = meta_parts[0]
            company = meta_parts[1]
            dates = ""
        else:
            title = meta_line
            company = ""
            dates = ""
            
        # Extract bullets
        bullets = []
        for line in lines[1:]:
            bullet_clean = re.sub(r'^[•\-\*\s]+', '', line).strip()
            if bullet_clean:
                bullets.append(bullet_clean)
                
        bullets_html = ""
        if bullets:
            bullets_li = "".join([f"<li>{b}</li>" for b in bullets])
            bullets_html = f"<ul class='exp-bullets'>{bullets_li}</ul>"
            
        company_span = f"<span class='exp-sep'>at</span><span class='exp-company'>{company}</span>" if company else ""
        dates_div = f"<div class='exp-dates'>{dates}</div>" if dates else ""
        
        exp_items_html += f"""
        <div class="exp-item">
          <div class="exp-header">
            <div class="exp-title-company">
              <span class="exp-title">{title}</span>
              {company_span}
            </div>
            {dates_div}
          </div>
          {bullets_html}
        </div>
        """
        
    experience_html = ""
    if exp_items_html:
        experience_html = f"""
        <div class="section">
          <h2 class="section-title">Work Experience</h2>
          {exp_items_html}
        </div>
        """
        
    # Render projects block
    projects = resume_data.get("projects", [])
    proj_items_html = ""
    for proj_str in projects:
        if not proj_str or not isinstance(proj_str, str):
            continue
        lines = [line.strip() for line in proj_str.split("\n") if line.strip()]
        if not lines:
            continue
        meta_line = lines[0]
        meta_parts = [p.strip() for p in meta_line.split("—")]
        if len(meta_parts) < 2:
            meta_parts = [p.strip() for p in meta_line.split(" - ")]
        if len(meta_parts) < 2:
            meta_parts = [p.strip() for p in meta_line.split("|")]
            
        if len(meta_parts) >= 2:
            proj_name = meta_parts[0]
            proj_tech = meta_parts[1]
        else:
            proj_name = meta_line
            proj_tech = ""
            
        proj_desc = "\n".join(lines[1:]).strip()
        tech_span = f"<span class='project-tech'>{proj_tech}</span>" if proj_tech else ""
        desc_p = f"<p class='project-desc'>{proj_desc}</p>" if proj_desc else ""
        
        proj_items_html += f"""
        <div class="project-item">
          <div class="project-header">
            <span class="project-name">{proj_name}</span>
            {tech_span}
          </div>
          {desc_p}
        </div>
        """
        
    projects_html = ""
    if proj_items_html:
        projects_html = f"""
        <div class="section">
          <h2 class="section-title">Projects</h2>
          {proj_items_html}
        </div>
        """
        
    # Render education block
    education = resume_data.get("education", [])
    edu_items_html = ""
    for edu_str in education:
        if not edu_str or not isinstance(edu_str, str):
            continue
        edu_parts = [p.strip() for p in edu_str.split("·")]
        if len(edu_parts) < 2:
            edu_parts = [p.strip() for p in edu_str.split("|")]
        if len(edu_parts) < 2:
            edu_parts = [p.strip() for p in edu_str.split(" - ")]
            
        if len(edu_parts) >= 3:
            degree = edu_parts[0]
            inst = edu_parts[1]
            year = " · ".join(edu_parts[2:])
        elif len(edu_parts) == 2:
            degree = edu_parts[0]
            inst = edu_parts[1]
            year = ""
        else:
            degree = edu_str
            inst = ""
            year = ""
            
        inst_span = f"<span class='edu-sep'>at</span><span class='edu-institution'>{inst}</span>" if inst else ""
        year_div = f"<div class='edu-year'>{year}</div>" if year else ""
        
        edu_items_html += f"""
        <div class="edu-item">
          <div class="edu-header">
            <div class="edu-degree-institution">
              <span class="edu-degree">{degree}</span>
              {inst_span}
            </div>
            {year_div}
          </div>
        </div>
        """
        
    education_html = ""
    if edu_items_html:
        education_html = f"""
        <div class="section">
          <h2 class="section-title">Education</h2>
          {edu_items_html}
        </div>
        """
        
    # Combine into full HTML template
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Optimized Resume</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background-color: #f8fafc;
      line-height: 1.5;
      margin: 0;
      padding: 2rem 1rem;
    }}
    .page {{
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 3rem;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      border-radius: 8px;
      box-sizing: border-box;
    }}
    .header {{
      text-align: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 1.25rem;
      margin-bottom: 1.5rem;
    }}
    .header h1 {{
      font-size: 2.25rem;
      color: #0f172a;
      margin: 0 0 0.5rem 0;
      font-weight: 700;
      letter-spacing: -0.025em;
    }}
    .contact-info {{
      font-size: 0.875rem;
      color: #475569;
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 0.5rem 0.75rem;
    }}
    .contact-info span {{
      display: inline-flex;
      align-items: center;
    }}
    .contact-info span:not(:last-child)::after {{
      content: "•";
      margin-left: 0.75rem;
      color: #cbd5e1;
    }}
    .section {{
      margin-bottom: 1.5rem;
    }}
    .section-title {{
      font-size: 1.125rem;
      font-weight: 600;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 0.25rem;
      margin-top: 0;
      margin-bottom: 0.75rem;
    }}
    .summary-text {{
      font-size: 0.925rem;
      color: #334155;
      text-align: justify;
      margin: 0;
      line-height: 1.6;
    }}
    .skills-grid {{
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }}
    .skill-tag {{
      font-size: 0.825rem;
      background-color: #f1f5f9;
      color: #334155;
      padding: 0.25rem 0.625rem;
      border-radius: 4px;
      font-weight: 500;
      border: 1px solid #e2e8f0;
    }}
    .exp-item {{
      margin-bottom: 1.25rem;
    }}
    .exp-header {{
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 0.375rem;
    }}
    .exp-title {{
      font-weight: 600;
      color: #0f172a;
      font-size: 0.95rem;
    }}
    .exp-sep {{
      color: #64748b;
      margin: 0 0.25rem;
      font-size: 0.875rem;
    }}
    .exp-company {{
      font-weight: 500;
      color: #475569;
      font-size: 0.95rem;
    }}
    .exp-dates {{
      font-size: 0.875rem;
      color: #64748b;
      font-weight: 500;
    }}
    .exp-bullets {{
      margin: 0;
      padding-left: 1.25rem;
      color: #334155;
      font-size: 0.9rem;
      line-height: 1.5;
    }}
    .exp-bullets li {{
      margin-bottom: 0.25rem;
    }}
    .project-item {{
      margin-bottom: 1rem;
    }}
    .project-header {{
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 0.25rem;
    }}
    .project-name {{
      font-weight: 600;
      color: #0f172a;
      font-size: 0.95rem;
    }}
    .project-tech {{
      font-size: 0.825rem;
      color: #0f172a;
      background-color: #f1f5f9;
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
      font-weight: 500;
    }}
    .project-desc {{
      margin: 0;
      font-size: 0.9rem;
      color: #334155;
      line-height: 1.5;
    }}
    .edu-item {{
      margin-bottom: 0.75rem;
    }}
    .edu-header {{
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }}
    .edu-degree {{
      font-weight: 600;
      color: #0f172a;
      font-size: 0.95rem;
    }}
    .edu-sep {{
      color: #64748b;
      margin: 0 0.25rem;
      font-size: 0.875rem;
    }}
    .edu-institution {{
      font-weight: 500;
      color: #475569;
      font-size: 0.95rem;
    }}
    .edu-year {{
      font-size: 0.875rem;
      color: #64748b;
      font-weight: 500;
    }}
    @media print {{
      body {{
        background-color: #ffffff;
        padding: 0;
        margin: 0;
      }}
      .page {{
        padding: 0;
        margin: 0;
        box-shadow: none;
        max-width: 100%;
        border-radius: 0;
      }}
    }}
  </style>
</head>
<body>
  <div class="page">
    {header_html}
    {summary_html}
    {skills_html}
    {experience_html}
    {projects_html}
    {education_html}
  </div>
</body>
</html>"""
    return html.strip()


# ── Resume Optimization ───────────────────────────────────────────────────────

def optimize_resume(
    original_resume: str,
    job_desc: str,
    accepted_suggestions: list[str],
    user_prefs: dict,
    custom_instructions: str = "",
    job_analysis: dict = None,
    resume_analysis: dict = None
) -> str:
    """
    Generate an optimized resume JSON via LLM and render it to HTML (Idea A).
    Must adhere strictly to actual achievements without hallucinating fake jobs or credentials.
    """
    if job_analysis is None:
        import app.services.analyzer as az
        job_analysis = az.analyze_job_description(job_desc)
    if resume_analysis is None:
        import app.services.analyzer as az
        resume_analysis = az.analyze_resume(original_resume)

    llm = get_llm()
    system_prompt = load_prompt("prompt_final_resume_generator.txt")
    system_prompt = system_prompt.replace("{{ JSON.stringify($json.job, null, 2) }}", json.dumps(job_analysis, indent=2))
    system_prompt = system_prompt.replace("{{ JSON.stringify($json.resume, null, 2) }}", json.dumps(resume_analysis, indent=2))
    system_prompt = system_prompt.replace("{{ JSON.stringify($json.accepted_suggestions, null, 2) }}", json.dumps(accepted_suggestions, indent=2))
    system_prompt = system_prompt.replace("{{ JSON.stringify($json.memory_context, null, 2) }}", json.dumps(user_prefs, indent=2))

    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content="Generate the optimized resume JSON now.")
    ])

    cleaned_content = _clean_json_output(response.content)
    try:
        resume_data = json.loads(cleaned_content)
        if not isinstance(resume_data, dict):
            print(f"Warning: Generator LLM returned non-dict: {resume_data}")
            raise ValueError("LLM returned a non-dictionary format.")
    except Exception as e:
        print(f"Error parsing optimized resume JSON: {e}. Raw: {response.content}")
        # Robust fallback using existing details
        resume_data = {
            "header": f"{resume_analysis.get('name', 'Candidate')} | {resume_analysis.get('email', '')} | {resume_analysis.get('phone', '')} | {resume_analysis.get('location', '')}",
            "summary": resume_analysis.get("summary", ""),
            "skills": resume_analysis.get("skills", []),
            "experience": resume_analysis.get("experience", []),
            "projects": resume_analysis.get("projects", []),
            "education": resume_analysis.get("education", [])
        }

    return render_resume_json_to_html(resume_data)


def validate_resume(resume_html: str, candidate_name: str = "") -> dict:
    """
    Validate the generated resume for required sections, empty content, and placeholders.
    """
    # 1. Strip HTML tags to inspect plain text content
    text = re.sub(r"<[^>]*>", " ", resume_html)

    # 2. Check for required sections (case insensitive)
    required_sections = ["summary", "skills", "experience", "education"]
    missing_sections = []
    for section in required_sections:
        if not re.search(r'\b' + re.escape(section) + r'\b', text, re.IGNORECASE):
            missing_sections.append(section.capitalize())

    # 3. Check for placeholder markers
    placeholder_patterns = [
        r"\[your\s+name\]", r"\[phone\]", r"\[email\]", r"\[address\]", r"\[company\s+name\]",
        r"\[job\s+title\]", r"lorem\s+ipsum", r"placeholder"
    ]
    placeholders_found = []
    for pattern in placeholder_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            placeholders_found.append(matches[0])

    if candidate_name and candidate_name.lower() != "candidate":
        if candidate_name.lower() not in text.lower():
            placeholders_found.append(f"Missing candidate name '{candidate_name}'")

    errors = []
    if missing_sections:
        errors.append(f"Missing required sections: {', '.join(missing_sections)}")
    if placeholders_found:
        errors.append(f"Placeholders detected: {', '.join(placeholders_found)}")

    # Check for empty content
    cleaned_text = text.replace(" ", "").replace("\n", "").strip()
    if len(cleaned_text) < 100:
        errors.append("Resume contains too little text content (possibly empty).")

    return {
        "valid": len(errors) == 0,
        "missing_sections": missing_sections,
        "placeholders_found": placeholders_found,
        "errors": errors
    }


# ── Cover Letter Generation ───────────────────────────────────────────────────

def generate_cover_letter(
    optimized_resume: str,
    job_desc: str,
    style: str = "Formal",
    job_analysis: dict = None,
    resume_analysis: dict = None,
    ats_results: dict = None
) -> str:
    """
    Generate a tailored cover letter HTML using prompt_cover_letter_generator.txt template.
    """
    if job_analysis is None:
        import app.services.analyzer as az
        job_analysis = az.analyze_job_description(job_desc)
    if resume_analysis is None:
        import app.services.analyzer as az
        resume_analysis = az.analyze_resume(optimized_resume)
    if ats_results is None:
        import app.services.analyzer as az
        ats_results = az.run_ats_scoring(job_analysis, resume_analysis, job_desc, optimized_resume)

    llm = get_llm()
    system_prompt = load_prompt("prompt_cover_letter_generator.txt")
    system_prompt = system_prompt.replace('{{ JSON.stringify($node["Prepare Generation Payload"].json.job, null, 2) }}', json.dumps(job_analysis, indent=2))
    system_prompt = system_prompt.replace('{{ JSON.stringify($node["Prepare Generation Payload"].json.resume, null, 2) }}', json.dumps(resume_analysis, indent=2))
    system_prompt = system_prompt.replace('{{ JSON.stringify($node["Prepare Generation Payload"].json.ats, null, 2) }}', json.dumps(ats_results, indent=2))
    system_prompt = system_prompt.replace('{{ JSON.stringify($node["Smart Review Processor"].json.memory_context, null, 2) }}', json.dumps({"style_preference": style}, indent=2))

    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content="Write the cover letter.")
    ])

    content = response.content.strip()
    # Split paragraphs by double newline and wrap in <p> tags
    paragraphs = [p.strip() for p in content.split("\n\n") if p.strip()]
    html_paragraphs = "".join([f"<p>{p}</p>" for p in paragraphs])
    return f"<div class='cover-letter'>{html_paragraphs}</div>"


# ── Recruiter Email Generation ────────────────────────────────────────────────

def generate_recruiter_email(
    candidate_name: str,
    role_info: str,
    company: str,
    resume_summary: str,
    job_analysis: dict = None,
    resume_analysis: dict = None,
    ats_results: dict = None
) -> dict:
    """
    Generate subject and email body for recruiter outreach using prompt_recruiter_email_generator.txt template.
    """
    if job_analysis is None:
        job_analysis = {"role": role_info, "company": company}
    if resume_analysis is None:
        resume_analysis = {"name": candidate_name, "summary": resume_summary}
    if ats_results is None:
        ats_results = {}

    llm = get_llm()
    system_prompt = load_prompt("prompt_recruiter_email_generator.txt")
    system_prompt = system_prompt.replace('{{ JSON.stringify($node["Prepare Generation Payload"].json.resume, null, 2) }}', json.dumps(resume_analysis, indent=2))
    system_prompt = system_prompt.replace('{{ JSON.stringify($node["Prepare Generation Payload"].json.job, null, 2) }}', json.dumps(job_analysis, indent=2))
    system_prompt = system_prompt.replace('{{ JSON.stringify($node["Prepare Generation Payload"].json.ats, null, 2) }}', json.dumps(ats_results, indent=2))

    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content="Generate outreach email now.")
    ])

    content = response.content.strip()
    
    subject = f"Application for {role_info} — {candidate_name}"
    body = content

    # Search for "Subject:" line (case insensitive)
    subject_match = re.match(r"^Subject:\s*(.+)$", content, re.IGNORECASE | re.MULTILINE)
    if subject_match:
        subject = subject_match.group(1).strip()
        body = re.sub(r"^Subject:.*?\n+", "", content, flags=re.IGNORECASE).strip()

    return {
        "subject": subject,
        "body": body
    }


# ── Asset Refinement ──────────────────────────────────────────────────────────

def refine_content(asset_type: str, current_content: str, instruction: str, history: list = None) -> str:
    """Apply a targeted refinement instruction to a generated asset using LLM with optional chat context."""
    from langchain_core.messages import AIMessage
    
    system_prompt = load_prompt("refine_asset.txt")
    llm = get_llm()

    messages = [SystemMessage(content=system_prompt)]

    # Inject message history if provided to maintain conversational context
    if history:
        for item in history:
            role = item.get("role")
            content = item.get("content")
            # Skip generic success messages to avoid cluttering context
            if content.startswith("✓") and "updated successfully" in content:
                continue
            if role == "user":
                messages.append(HumanMessage(content=content))
            elif role == "assistant":
                messages.append(AIMessage(content=content))

    user_message = (
        f"ASSET TYPE: {asset_type}\n\n"
        f"CURRENT CONTENT:\n{current_content}\n\n"
        f"INSTRUCTION: {instruction}"
    )
    messages.append(HumanMessage(content=user_message))

    response = llm.invoke(messages)
    refined = response.content.strip()

    # Strip any accidental markdown code fences the LLM might add
    if refined.startswith("```"):
        lines = refined.split("\n")
        # Remove first and last lines if they are fences
        if lines[-1].strip() == "```":
            lines = lines[1:-1]
        elif lines[0].startswith("```"):
            lines = lines[1:]
        refined = "\n".join(lines)

    return refined

