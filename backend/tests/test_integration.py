"""
test_integration.py — Integration test for prompt template rendering,
JSON-to-HTML parsing, ATS scoring, and recruiter assets generation.
"""

import os
import json
import dotenv

import sys
# Load environment variables first
dir_path = os.path.dirname(os.path.abspath(__file__))
dotenv.load_dotenv(os.path.join(dir_path, "..", ".env"))
sys.path.append(os.path.join(dir_path, ".."))

import analyzer as az
import generator as gen

# Mock inputs
MOCK_JOB_DESC = """
Position: Senior React Developer
Location: Hybrid — Munich, Germany
Experience: 5+ years
Required Skills:
- React
- TypeScript
- Next.js
- Redux
- REST APIs
Preferred Skills:
- Docker
- AWS
- GraphQL
Responsibilities:
- Build responsive, beautiful, high-performance web applications using React and Next.js.
- Optimize application speed, accessibility, and Core Web Vitals.
- Collaborate with backend engineers to integrate REST APIs.
"""

MOCK_RESUME = """
Varshit Madisetti
Email: varshit@email.com
Phone: +49 155 1234
Location: Munich, Germany
LinkedIn: linkedin.com/in/varshitmadisetti
Portfolio: github.com/varshit

SUMMARY
========================================
Front-End Engineer with 4 years of experience building scalable web applications with React, TypeScript, and modern state management.

SKILLS
========================================
React, TypeScript, Redux, HTML5, CSS3, Git, REST APIs, Jest

WORK EXPERIENCE
========================================
Frontend Engineer | Tech Corp | Jan 2022 - Present
- Built and maintained several web pages using React, Redux, and TypeScript.
- Integrated REST APIs with Redux for state management, improving load times by 20%.
- Refactored legacy codebase, removing unused dependencies and improving performance.

Junior Developer | Web Agency | Jun 2020 - Dec 2021
- Developed responsive websites using HTML, CSS, and basic JavaScript.
- Collaborated with UI designers to implement custom animations.

EDUCATION
========================================
B.S. in Computer Science | Technical University of Munich | 2017 - 2020
"""

def test_integration():
    print("🚀 Starting End-to-End Integration Test...")

    # 1. Job Analysis
    print("\n🔍 1. Running Job Description Analysis...")
    job_analysis = az.analyze_job_description(MOCK_JOB_DESC)
    print("Job Analysis Keys:", list(job_analysis.keys()))
    print("Mapped Role:", job_analysis.get("role_information"))
    print("Required Skills:", job_analysis.get("required_skills"))
    print("ATS Keywords:", job_analysis.get("ats_keywords"))
    assert "role_information" in job_analysis
    assert "required_skills" in job_analysis

    # 2. Resume Analysis
    print("\n🔍 2. Running Resume Analysis...")
    resume_analysis = az.analyze_resume(MOCK_RESUME)
    print("Resume Analysis Keys:", list(resume_analysis.keys()))
    print("Mapped Candidate Name:", resume_analysis.get("candidate_name"))
    print("Parsed Skills:", resume_analysis.get("skills"))
    print("Structured Experience:", json.dumps(resume_analysis.get("experience_structured", []), indent=2))
    assert "candidate_name" in resume_analysis
    assert "skills" in resume_analysis
    assert "experience_structured" in resume_analysis

    # 3. ATS Scoring
    print("\n🔍 3. Running ATS Match Scorer...")
    ats_results = az.run_ats_scoring(job_analysis, resume_analysis, MOCK_JOB_DESC, MOCK_RESUME)
    print("ATS Score:", ats_results.get("final_score"))
    print("Matched Skills:", ats_results.get("matched_skills"))
    print("Missing Skills:", ats_results.get("missing_skills"))
    print("Breakdown Scores:", ats_results.get("scores"))
    assert "final_score" in ats_results
    assert "matched_skills" in ats_results

    # 4. Suggestions
    print("\n🔍 4. Generating suggestions...")
    suggestions = az.generate_suggestions(job_analysis, resume_analysis, ats_results)
    print(f"Generated {len(suggestions)} suggestions:")
    for i, sug in enumerate(suggestions, 1):
        print(f"  {i}. {sug}")
    assert isinstance(suggestions, list)
    assert 5 <= len(suggestions) <= 8

    # 5. Optimize Resume (JSON-to-HTML)
    print("\n🔍 5. Optimizing Resume (JSON-to-HTML)...")
    optimized_html = gen.optimize_resume(
        original_resume=MOCK_RESUME,
        job_desc=MOCK_JOB_DESC,
        accepted_suggestions=suggestions[:3],
        user_prefs={"style_preference": "Technical"},
        custom_instructions="Highlight TypeScript skills",
        job_analysis=job_analysis,
        resume_analysis=resume_analysis
    )
    print("Optimized HTML Length:", len(optimized_html))
    assert "<!DOCTYPE html>" in optimized_html
    assert "Varshit Madisetti" in optimized_html
    assert "Skills" in optimized_html
    assert "Work Experience" in optimized_html
    
    # 6. Validate Optimized Resume
    print("\n🔍 6. Validating Optimized HTML...")
    validation = gen.validate_resume(optimized_html, "Varshit Madisetti")
    print("Validation Result:", validation)
    assert validation.get("valid") is True or len(validation.get("errors", [])) == 0

    # 7. Cover Letter
    print("\n🔍 7. Generating Cover Letter...")
    cover_letter = gen.generate_cover_letter(
        optimized_resume=MOCK_RESUME,
        job_desc=MOCK_JOB_DESC,
        style="Technical",
        job_analysis=job_analysis,
        resume_analysis=resume_analysis,
        ats_results=ats_results
    )
    print("Cover Letter HTML snippet:")
    print(cover_letter[:300] + "...")
    assert "<p>" in cover_letter

    # 8. Recruiter outreach email
    print("\n🔍 8. Generating Recruiter Email...")
    email_data = gen.generate_recruiter_email(
        candidate_name="Varshit Madisetti",
        role_info="Senior React Developer",
        company="Tech Corp",
        resume_summary="Front-End Engineer with 4 years of experience",
        job_analysis=job_analysis,
        resume_analysis=resume_analysis,
        ats_results=ats_results
    )
    print("Email Data:")
    print("Subject:", email_data.get("subject"))
    print("Body snippet:\n", email_data.get("body", "")[:200] + "...")
    assert "subject" in email_data
    assert "body" in email_data

    print("\n🎉 All tests passed successfully!")

if __name__ == "__main__":
    test_integration()
