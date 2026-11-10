from datetime import timedelta

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIRequestFactory

from core.users.models import User
from core.jobs.models import Job
from core.resumes.models import Resume
from core.applications.models import Application
from core.applications.serializers import ApplicationCreateSerializer
from core.applications.services import ensure_application_match
from core.matching.models import Recommendation


class ReapplyApplicationTests(TestCase):
    def setUp(self):
        self.recruiter = User.objects.create_user(
            username='rec', password='test123', role='recruiter')
        self.seeker = User.objects.create_user(
            username='seek', password='test123', role='jobseeker')
        self.job = Job.objects.create(
            recruiter=self.recruiter,
            title='Business Role',
            company='Test Co',
            status='open',
            is_active=True,
        )

    def _apply(self, cover_letter):
        factory = APIRequestFactory()
        request = factory.post('/api/applications/')
        request.user = self.seeker
        serializer = ApplicationCreateSerializer(
            data={'job': self.job.id, 'cover_letter': cover_letter},
            context={'request': request},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        return serializer.save()

    def test_reapply_after_withdraw_becomes_fresh_application(self):
        original = self._apply('first application')
        original.created_at = timezone.now() - timedelta(days=4)
        original.status = 'withdrawn'
        original.save(update_fields=['created_at', 'status'])
        old_created = original.created_at

        reapplied = self._apply('second application after cancel')

        self.assertEqual(
            Application.objects.filter(job=self.job, applicant=self.seeker).count(), 1)
        self.assertEqual(reapplied.pk, original.pk)
        self.assertEqual(reapplied.status, 'submitted')
        self.assertEqual(reapplied.cover_letter, 'second application after cancel')
        self.assertGreater(reapplied.created_at, old_created)

    def test_duplicate_active_application_is_rejected(self):
        self._apply('first application')

        factory = APIRequestFactory()
        request = factory.post('/api/applications/')
        request.user = self.seeker
        serializer = ApplicationCreateSerializer(
            data={'job': self.job.id, 'cover_letter': 'duplicate'},
            context={'request': request},
        )
        self.assertFalse(serializer.is_valid())


class ApplicationMatchServiceTests(TestCase):
    def setUp(self):
        self.recruiter = User.objects.create_user(
            username='match_rec', password='test123', role='recruiter')
        self.seeker = User.objects.create_user(
            username='match_seek', password='test123', role='jobseeker')
        self.job = Job.objects.create(
            recruiter=self.recruiter,
            title='Business Role',
            company='Test Co',
            status='open',
            is_active=True,
            requirements=['communication skill', 'analysis', '2 year experience'],
        )

    def _resume(self, skills):
        return Resume.objects.create(
            user=self.seeker,
            file=SimpleUploadedFile('resume.txt', b'hello'),
            file_name='resume.txt',
            file_format='txt',
            skills=skills,
        )

    def test_ensure_match_uses_job_requirements_fallback(self):
        application = Application.objects.create(
            job=self.job, applicant=self.seeker, resume=self._resume(
                ['Communication', 'Python', 'HTML']))

        ensure_application_match(application)
        application.refresh_from_db()

        self.assertGreater(application.match_score, 0)
        self.assertIn('communication skill', application.matched_skills)

    def test_ensure_match_mirrors_persisted_recommendation(self):
        resume = self._resume(['Communication', 'Python'])
        Recommendation.objects.create(
            resume=resume,
            job=self.job,
            match_score=35.0,
            matched_skills=['Communication', 'English language'],
            missing_skills=['business', 'analysis', '2 year experience'],
            source='ai',
        )
        application = Application.objects.create(
            job=self.job, applicant=self.seeker, resume=resume,
            match_score=20.0, match_source='local')

        ensure_application_match(application)
        application.refresh_from_db()

        self.assertEqual(application.match_score, 35.0)
        self.assertEqual(application.match_source, 'ai')
        self.assertTrue(application.is_ai_analyzed)
        self.assertIn('English language', application.matched_skills)