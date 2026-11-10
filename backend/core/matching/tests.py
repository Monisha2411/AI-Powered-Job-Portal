from django.test import TestCase

from core.matching.matching_service import match_resume_to_job, skill_similarity


class SkillSimilarityTests(TestCase):
    def test_multiword_phrase_matches_single_word(self):
        self.assertEqual(skill_similarity('Communication', 'communication skill'), 1.0)

    def test_distinct_skills_are_not_confused(self):
        self.assertLess(skill_similarity('Java', 'JavaScript'), 0.85)


class MatchResumeToJobTests(TestCase):
    def test_requirements_used_when_no_structured_skills(self):
        result = match_resume_to_job(
            ['Communication', 'Python', 'HTML'],
            job_required_skills=['communication skill', 'python'],
        )
        self.assertIn('communication skill', result['matched_skills'])
        self.assertIn('python', result['matched_skills'])
        self.assertGreater(result['match_score'], 0)