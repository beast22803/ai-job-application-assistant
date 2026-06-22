import json
from typing import Any
from app.core.database import SessionLocal
from app.models.user import UserPreference, AuditLog

def log_event(event_type: str, user_id: str, details: Any = None) -> None:
    session = SessionLocal()
    try:
        details_str = json.dumps(details) if details is not None else ""
        log = AuditLog(event_type=event_type, user_id=user_id, details=details_str)
        session.add(log)
        session.commit()
    except Exception as e:
        print(f"Error logging event: {e}")
        session.rollback()
    finally:
        session.close()

def get_user_preferences(user_id: str) -> dict:
    db = SessionLocal()
    try:
        pref = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
        if not pref:
            default_pref = {
                "accepted": [],
                "rejected": [],
                "suggestion_weights": {},
                "style_preference": "Formal",
                "custom_instructions": []
            }
            pref = UserPreference(user_id=user_id, preferences_json=json.dumps(default_pref))
            db.add(pref)
            db.commit()
            return default_pref
        return json.loads(pref.preferences_json)
    finally:
        db.close()

def save_user_preferences(user_id: str, prefs: dict) -> None:
    db = SessionLocal()
    try:
        pref = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
        if not pref:
            pref = UserPreference(user_id=user_id)
            db.add(pref)
        pref.preferences_json = json.dumps(prefs)
        db.commit()
    except Exception as e:
        print(f"Error saving preferences: {e}")
        db.rollback()
    finally:
        db.close()
