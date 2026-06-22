import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Import models from the current database.py
import database as db_module
from database import (
    Base,
    MasterExperience,
    MasterProject,
    MasterSkill,
    MasterEducation,
    UserPreference
)

# SQLite setup
SQLITE_URL = "sqlite:///agent_memory.db"
sqlite_engine = create_engine(SQLITE_URL)
SqliteSession = sessionmaker(bind=sqlite_engine)

# MySQL setup
MYSQL_URL = "mysql+pymysql://root:varshitm@localhost/agent"
mysql_engine = create_engine(MYSQL_URL)
MysqlSession = sessionmaker(bind=mysql_engine)

def migrate():
    print("Creating tables in MySQL...")
    # Bind the Base to mysql engine to create tables there
    Base.metadata.create_all(bind=mysql_engine)
    print("Tables created.")

    sqlite_session = SqliteSession()
    mysql_session = MysqlSession()

    try:
        # Migrate UserPreferences
        print("Migrating UserPreference...")
        prefs = sqlite_session.query(UserPreference).all()
        for pref in prefs:
            new_pref = UserPreference(
                user_id=pref.user_id,
                preferences_json=pref.preferences_json
            )
            mysql_session.merge(new_pref)

        # Migrate MasterExperience
        print("Migrating MasterExperience...")
        exps = sqlite_session.query(MasterExperience).all()
        for e in exps:
            new_e = MasterExperience(
                id=e.id, user_id=e.user_id, title=e.title, company=e.company,
                start_date=e.start_date, end_date=e.end_date, is_current=e.is_current,
                description=e.description, bullets_json=e.bullets_json,
                technologies_json=e.technologies_json, order_index=e.order_index,
                created_at=e.created_at
            )
            mysql_session.merge(new_e)

        # Migrate MasterProject
        print("Migrating MasterProject...")
        projs = sqlite_session.query(MasterProject).all()
        for p in projs:
            new_p = MasterProject(
                id=p.id, user_id=p.user_id, name=p.name, description=p.description,
                technologies_json=p.technologies_json, url=p.url,
                highlights_json=p.highlights_json, order_index=p.order_index,
                created_at=p.created_at
            )
            mysql_session.merge(new_p)

        # Migrate MasterSkill
        print("Migrating MasterSkill...")
        skills = sqlite_session.query(MasterSkill).all()
        for s in skills:
            new_s = MasterSkill(
                id=s.id, user_id=s.user_id, category=s.category, name=s.name,
                proficiency=s.proficiency, order_index=s.order_index,
                created_at=s.created_at
            )
            mysql_session.merge(new_s)

        # Migrate MasterEducation
        print("Migrating MasterEducation...")
        edus = sqlite_session.query(MasterEducation).all()
        for ed in edus:
            new_ed = MasterEducation(
                id=ed.id, user_id=ed.user_id, institution=ed.institution, degree=ed.degree,
                field=ed.field, start_date=ed.start_date, end_date=ed.end_date,
                gpa=ed.gpa, highlights_json=ed.highlights_json, order_index=ed.order_index,
                created_at=ed.created_at
            )
            mysql_session.merge(new_ed)

        # Commit all merges
        mysql_session.commit()
        print("Migration completed successfully!")
    
    except Exception as e:
        mysql_session.rollback()
        print(f"Error during migration: {e}")
    finally:
        sqlite_session.close()
        mysql_session.close()

if __name__ == "__main__":
    migrate()
