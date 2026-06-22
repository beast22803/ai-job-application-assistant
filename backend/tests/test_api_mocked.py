import os
import json
import unittest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

import sys
dir_path = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(dir_path, ".."))

import database as db
import server

class TestAPIRoutes(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(server.app)
        self.session_id = "test_session_123"

    @patch("database.get_session")
    @patch("analyzer.run_ats_scoring")
    def test_score_endpoint(self, mock_scoring, mock_get_session):
        # Setup mocks
        mock_get_session.return_value = {
            "session_id": self.session_id,
            "job_description": "We need a Python developer.",
            "resume_text": "I am a dev.",
            "job_analysis": {"skills_required": ["Python"]},
            "resume_analysis": {"skills": ["Python"]},
            "ats_results": {"final_score": 75}
        }
        mock_scoring.return_value = {
            "final_score": 85,
            "missing_skills": [],
            "matched_skills": ["Python"],
            "scores": {
                "skill_match": 100,
                "experience_match": 85,
                "semantic_match": 80,
                "formatting_score": 90,
                "penalty": 0
            }
        }

        # Call endpoint
        response = self.client.post(
            f"/api/session/{self.session_id}/score",
            json={"resume_html": "<html><body>Python Dev</body></html>"}
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["ats_score"], 85)
        self.assertEqual(data["ats_gain"], 10)
        self.assertEqual(data["matched_skills"], ["Python"])
        self.assertEqual(data["missing_skills"], [])

    @patch("database.get_session")
    @patch("analyzer.run_ats_scoring")
    @patch("generator.validate_resume")
    @patch("database.get_next_resume_version")
    @patch("database.save_resume_version")
    def test_save_version_endpoint(self, mock_save_ver, mock_next_ver, mock_val, mock_scoring, mock_get_session):
        # Setup mocks
        mock_get_session.return_value = {
            "session_id": self.session_id,
            "job_description": "Python dev",
            "resume_text": "I am a dev",
            "job_analysis": {},
            "resume_analysis": {},
            "ats_results": {"final_score": 70}
        }
        mock_scoring.return_value = {
            "final_score": 80,
            "missing_skills": [],
            "matched_skills": ["Python"],
            "scores": {}
        }
        mock_val.return_value = {"valid": True, "errors": []}
        mock_next_ver.return_value = 2

        response = self.client.post(
            f"/api/session/{self.session_id}/version",
            json={"resume_html": "<html><body>Python</body></html>"}
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["resume_version"], 2)
        self.assertEqual(data["ats_score"], 80)
        mock_save_ver.assert_called_once()

    @patch("database.get_resume_versions")
    def test_get_versions_endpoint(self, mock_get_vers):
        mock_get_vers.return_value = [
            {"version_num": 1, "ats_score": 70, "timestamp": "2026-06-12T12:00:00"}
        ]

        response = self.client.get(f"/api/session/{self.session_id}/versions")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["versions"]), 1)
        self.assertEqual(data["versions"][0]["version_num"], 1)

    @patch("database.get_resume_versions")
    @patch("database.get_next_resume_version")
    @patch("database.save_resume_version")
    def test_restore_version_endpoint(self, mock_save_ver, mock_next_ver, mock_get_vers):
        mock_get_vers.return_value = [
            {
                "version_num": 1,
                "resume_text": "Text 1",
                "resume_html": "HTML 1",
                "validation": {"valid": True},
                "ats_score": 70,
                "timestamp": "2026-06-12T12:00:00"
            }
        ]
        mock_next_ver.return_value = 2

        response = self.client.post(f"/api/session/{self.session_id}/version/1/restore")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["resume_version"], 2)
        self.assertEqual(data["resume_html"], "HTML 1")
        self.assertEqual(data["ats_score"], 70)
        mock_save_ver.assert_called_once()

if __name__ == "__main__":
    unittest.main()
