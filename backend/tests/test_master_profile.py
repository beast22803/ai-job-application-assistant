import os
import sys
import unittest
from fastapi.testclient import TestClient

# Set database path to a test file for testing
os.environ["MEMORY_DB_PATH"] = "test_memory.db"

dir_path = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(dir_path, ".."))

import database as db
import server

class TestMasterProfile(unittest.TestCase):
    def setUp(self):
        # Create database tables
        db.Base.metadata.create_all(bind=db.engine)
        self.client = TestClient(server.app)
        self.user_id = "test_user"

    def tearDown(self):
        # Drop all tables after test
        db.Base.metadata.drop_all(bind=db.engine)
        db.engine.dispose()
        if os.path.exists("test_memory.db"):
            try:
                os.remove("test_memory.db")
            except Exception as e:
                print(f"Error removing test database file: {e}")

    def test_experience_crud(self):
        # 1. Test saving experience
        exp_data = {
            "title": "Software Engineer",
            "company": "Google",
            "start_date": "2020-01",
            "end_date": "2023-01",
            "is_current": False,
            "description": "Coding stuff",
            "bullets": ["Wrote code", "Fixed bugs"],
            "technologies": ["Python", "C++"],
            "order_index": 1
        }
        
        # Via DB CRUD directly
        exp_id = db.save_master_experience(self.user_id, exp_data)
        self.assertTrue(exp_id.startswith("exp_"))
        
        # 2. Test getting profile
        profile = db.get_master_profile(self.user_id)
        self.assertEqual(len(profile["experiences"]), 1)
        self.assertEqual(profile["experiences"][0]["title"], "Software Engineer")
        self.assertEqual(profile["experiences"][0]["bullets"], ["Wrote code", "Fixed bugs"])
        self.assertEqual(profile["experiences"][0]["technologies"], ["Python", "C++"])

        # 3. Test deleting experience
        success = db.delete_master_experience(exp_id)
        self.assertTrue(success)
        
        profile_after = db.get_master_profile(self.user_id)
        self.assertEqual(len(profile_after["experiences"]), 0)

    def test_project_crud(self):
        proj_data = {
            "name": "Cool App",
            "description": "An awesome application",
            "technologies": ["React", "Node"],
            "url": "https://coolapp.example.com",
            "highlights": ["10k users", "Fast load time"],
            "order_index": 2
        }
        
        proj_id = db.save_master_project(self.user_id, proj_data)
        self.assertTrue(proj_id.startswith("proj_"))
        
        profile = db.get_master_profile(self.user_id)
        self.assertEqual(len(profile["projects"]), 1)
        self.assertEqual(profile["projects"][0]["name"], "Cool App")
        self.assertEqual(profile["projects"][0]["highlights"], ["10k users", "Fast load time"])

        success = db.delete_master_project(proj_id)
        self.assertTrue(success)

    def test_skill_crud(self):
        skill_data = {
            "category": "Languages",
            "name": "JavaScript",
            "proficiency": 5,
            "order_index": 0
        }
        
        skill_id = db.save_master_skill(self.user_id, skill_data)
        self.assertTrue(skill_id.startswith("skill_"))
        
        profile = db.get_master_profile(self.user_id)
        self.assertEqual(len(profile["skills"]), 1)
        self.assertEqual(profile["skills"][0]["name"], "JavaScript")
        self.assertEqual(profile["skills"][0]["proficiency"], 5)

        success = db.delete_master_skill(skill_id)
        self.assertTrue(success)

    def test_education_crud(self):
        edu_data = {
            "institution": "MIT",
            "degree": "B.S.",
            "field": "EECS",
            "start_date": "2016-09",
            "end_date": "2020-06",
            "gpa": "4.0",
            "highlights": ["Deans List"],
            "order_index": 0
        }
        
        edu_id = db.save_master_education(self.user_id, edu_data)
        self.assertTrue(edu_id.startswith("edu_"))
        
        profile = db.get_master_profile(self.user_id)
        self.assertEqual(len(profile["education"]), 1)
        self.assertEqual(profile["education"][0]["institution"], "MIT")
        self.assertEqual(profile["education"][0]["highlights"], ["Deans List"])

        success = db.delete_master_education(edu_id)
        self.assertTrue(success)

    def test_api_routes(self):
        # Add experience via API
        response = self.client.post(
            f"/api/profile/{self.user_id}/experience",
            json={
                "title": "Staff Architect",
                "company": "Amazon",
                "start_date": "2023-01",
                "end_date": "",
                "is_current": True,
                "description": "Designing cloud systems",
                "bullets": ["Led team of 10", "Designed migration plan"],
                "technologies": ["AWS", "Java"]
            }
        )
        self.assertEqual(response.status_code, 200)
        exp_id = response.json()["id"]
        
        # Get profile via API
        get_response = self.client.get(f"/api/profile/{self.user_id}")
        self.assertEqual(get_response.status_code, 200)
        profile = get_response.json()
        self.assertEqual(len(profile["experiences"]), 1)
        self.assertEqual(profile["experiences"][0]["title"], "Staff Architect")
        
        # Delete experience via API
        del_response = self.client.delete(f"/api/profile/{self.user_id}/experience/{exp_id}")
        self.assertEqual(del_response.status_code, 200)
        
        # Check empty profile
        get_response_2 = self.client.get(f"/api/profile/{self.user_id}")
        self.assertEqual(len(get_response_2.json()["experiences"]), 0)

if __name__ == "__main__":
    unittest.main()
