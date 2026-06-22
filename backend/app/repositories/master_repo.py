import json
import uuid
from app.core.database import SessionLocal
from app.models.master_profile import MasterExperience, MasterProject, MasterSkill, MasterEducation

def get_master_profile(user_id: str) -> dict:
    db = SessionLocal()
    try:
        experiences = db.query(MasterExperience).filter(MasterExperience.user_id == user_id).order_by(MasterExperience.order_index).all()
        projects = db.query(MasterProject).filter(MasterProject.user_id == user_id).order_by(MasterProject.order_index).all()
        skills = db.query(MasterSkill).filter(MasterSkill.user_id == user_id).order_by(MasterSkill.order_index).all()
        education = db.query(MasterEducation).filter(MasterEducation.user_id == user_id).order_by(MasterEducation.order_index).all()
        return {
            "experiences": [{
                "id": e.id, "title": e.title, "company": e.company,
                "start_date": e.start_date, "end_date": e.end_date,
                "is_current": bool(e.is_current), "description": e.description or "",
                "bullets": json.loads(e.bullets_json or "[]"),
                "technologies": json.loads(e.technologies_json or "[]"),
                "order_index": e.order_index
            } for e in experiences],
            "projects": [{
                "id": p.id, "name": p.name, "description": p.description or "",
                "technologies": json.loads(p.technologies_json or "[]"),
                "url": p.url or "",
                "highlights": json.loads(p.highlights_json or "[]"),
                "order_index": p.order_index
            } for p in projects],
            "skills": [{
                "id": s.id, "category": s.category, "name": s.name,
                "proficiency": s.proficiency, "order_index": s.order_index
            } for s in skills],
            "education": [{
                "id": ed.id, "institution": ed.institution, "degree": ed.degree,
                "field": ed.field, "start_date": ed.start_date, "end_date": ed.end_date,
                "gpa": ed.gpa or "",
                "highlights": json.loads(ed.highlights_json or "[]"),
                "order_index": ed.order_index
            } for ed in education]
        }
    finally:
        db.close()


def save_master_experience(user_id: str, data: dict) -> str:
    db = SessionLocal()
    try:
        exp_id = data.get("id") or f"exp_{uuid.uuid4().hex[:8]}"
        existing = db.query(MasterExperience).filter(MasterExperience.id == exp_id).first()
        if existing:
            existing.title = data.get("title", existing.title)
            existing.company = data.get("company", existing.company)
            existing.start_date = data.get("start_date", existing.start_date)
            existing.end_date = data.get("end_date", existing.end_date)
            existing.is_current = 1 if data.get("is_current") else 0
            existing.description = data.get("description", existing.description)
            existing.bullets_json = json.dumps(data.get("bullets", []))
            existing.technologies_json = json.dumps(data.get("technologies", []))
            existing.order_index = data.get("order_index", existing.order_index)
        else:
            exp = MasterExperience(
                id=exp_id, user_id=user_id,
                title=data.get("title", ""), company=data.get("company", ""),
                start_date=data.get("start_date", ""), end_date=data.get("end_date", ""),
                is_current=1 if data.get("is_current") else 0,
                description=data.get("description", ""),
                bullets_json=json.dumps(data.get("bullets", [])),
                technologies_json=json.dumps(data.get("technologies", [])),
                order_index=data.get("order_index", 0)
            )
            db.add(exp)
        db.commit()
        return exp_id
    except Exception as e:
        print(f"Error saving experience: {e}")
        db.rollback()
        return ""
    finally:
        db.close()

def delete_master_experience(exp_id: str) -> bool:
    db = SessionLocal()
    try:
        exp = db.query(MasterExperience).filter(MasterExperience.id == exp_id).first()
        if exp:
            db.delete(exp)
            db.commit()
            return True
        return False
    except Exception as e:
        print(f"Error deleting experience: {e}")
        db.rollback()
        return False
    finally:
        db.close()


def save_master_project(user_id: str, data: dict) -> str:
    db = SessionLocal()
    try:
        proj_id = data.get("id") or f"proj_{uuid.uuid4().hex[:8]}"
        existing = db.query(MasterProject).filter(MasterProject.id == proj_id).first()
        if existing:
            existing.name = data.get("name", existing.name)
            existing.description = data.get("description", existing.description)
            existing.technologies_json = json.dumps(data.get("technologies", []))
            existing.url = data.get("url", existing.url)
            existing.highlights_json = json.dumps(data.get("highlights", []))
            existing.order_index = data.get("order_index", existing.order_index)
        else:
            proj = MasterProject(
                id=proj_id, user_id=user_id,
                name=data.get("name", ""), description=data.get("description", ""),
                technologies_json=json.dumps(data.get("technologies", [])),
                url=data.get("url", ""),
                highlights_json=json.dumps(data.get("highlights", [])),
                order_index=data.get("order_index", 0)
            )
            db.add(proj)
        db.commit()
        return proj_id
    except Exception as e:
        print(f"Error saving project: {e}")
        db.rollback()
        return ""
    finally:
        db.close()

def delete_master_project(proj_id: str) -> bool:
    db = SessionLocal()
    try:
        proj = db.query(MasterProject).filter(MasterProject.id == proj_id).first()
        if proj:
            db.delete(proj)
            db.commit()
            return True
        return False
    except Exception as e:
        print(f"Error deleting project: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def save_master_skill(user_id: str, data: dict) -> str:
    db = SessionLocal()
    try:
        skill_id = data.get("id") or f"skill_{uuid.uuid4().hex[:8]}"
        existing = db.query(MasterSkill).filter(MasterSkill.id == skill_id).first()
        if existing:
            existing.category = data.get("category", existing.category)
            existing.name = data.get("name", existing.name)
            existing.proficiency = data.get("proficiency", existing.proficiency)
            existing.order_index = data.get("order_index", existing.order_index)
        else:
            skill = MasterSkill(
                id=skill_id, user_id=user_id,
                category=data.get("category", "General"),
                name=data.get("name", ""),
                proficiency=data.get("proficiency", 3),
                order_index=data.get("order_index", 0)
            )
            db.add(skill)
        db.commit()
        return skill_id
    except Exception as e:
        print(f"Error saving skill: {e}")
        db.rollback()
        return ""
    finally:
        db.close()

def delete_master_skill(skill_id: str) -> bool:
    db = SessionLocal()
    try:
        skill = db.query(MasterSkill).filter(MasterSkill.id == skill_id).first()
        if skill:
            db.delete(skill)
            db.commit()
            return True
        return False
    except Exception as e:
        print(f"Error deleting skill: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def save_master_education(user_id: str, data: dict) -> str:
    db = SessionLocal()
    try:
        edu_id = data.get("id") or f"edu_{uuid.uuid4().hex[:8]}"
        existing = db.query(MasterEducation).filter(MasterEducation.id == edu_id).first()
        if existing:
            existing.institution = data.get("institution", existing.institution)
            existing.degree = data.get("degree", existing.degree)
            existing.field = data.get("field", existing.field)
            existing.start_date = data.get("start_date", existing.start_date)
            existing.end_date = data.get("end_date", existing.end_date)
            existing.gpa = data.get("gpa", existing.gpa)
            existing.highlights_json = json.dumps(data.get("highlights", []))
            existing.order_index = data.get("order_index", existing.order_index)
        else:
            edu = MasterEducation(
                id=edu_id, user_id=user_id,
                institution=data.get("institution", ""),
                degree=data.get("degree", ""),
                field=data.get("field", ""),
                start_date=data.get("start_date", ""),
                end_date=data.get("end_date", ""),
                gpa=data.get("gpa", ""),
                highlights_json=json.dumps(data.get("highlights", [])),
                order_index=data.get("order_index", 0)
            )
            db.add(edu)
        db.commit()
        return edu_id
    except Exception as e:
        print(f"Error saving education: {e}")
        db.rollback()
        return ""
    finally:
        db.close()

def delete_master_education(edu_id: str) -> bool:
    db = SessionLocal()
    try:
        edu = db.query(MasterEducation).filter(MasterEducation.id == edu_id).first()
        if edu:
            db.delete(edu)
            db.commit()
            return True
        return False
    except Exception as e:
        print(f"Error deleting education: {e}")
        db.rollback()
        return False
    finally:
        db.close()
