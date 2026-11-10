import logging
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import serializers
from .services import analyze_job_description, analyze_resume, analyze_job_application
from .parser import extract_resume_text
from core.jobs.models import Job
from core.resumes.models import Resume

logger = logging.getLogger(__name__)


class JobAnalysisSerializer(serializers.Serializer):
    job_id = serializers.UUIDField()


class ResumeAnalysisSerializer(serializers.Serializer):
    resume_id = serializers.UUIDField()


class MatchCreateSerializer(serializers.Serializer):
    job_id = serializers.UUIDField()
    resume_id = serializers.UUIDField(required=False, allow_null=True)


class JobAnalysisViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request):
        serializer = JobAnalysisSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            job = Job.objects.get(id=serializer.validated_data['job_id'])
        except Job.DoesNotExist:
            return Response({'error': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Permission check: only the owning recruiter or an admin may analyze
        if not (request.user.is_admin_user or job.recruiter == request.user):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        job_text = f"{job.title}\n{job.description}\n" \
                   f"Requirements: {json_or_empty(job.requirements)}"
        try:
            result = analyze_job_description(job_text)
        except Exception:
            logger.exception('AI job analysis failed for job %s', job.pk)
            return Response({'error': 'AI analysis failed. Please try again later.'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Persist the analysis on the job so AI status can be shown on the UI
        job.ai_analyzed = True
        job.ai_analysis = result
        job.save(update_fields=['ai_analyzed', 'ai_analysis', 'updated_at'])

        return Response(result)


class ResumeAnalysisViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request):
        serializer = ResumeAnalysisSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            resume = Resume.objects.get(id=serializer.validated_data['resume_id'])
        except Resume.DoesNotExist:
            return Response({'error': 'Resume not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Permission check
        if not (request.user.is_admin_user or resume.user == request.user):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        text = resume.parsed_raw_text or extract_resume_text(resume.file.path, resume.file_format)
        try:
            result = analyze_resume(text)
        except Exception as e:
          print("RESUME AI ERROR:", repr(e))
        logger.exception('AI resume analysis failed for resume %s', resume.pk)
        return Response({'error': 'AI analysis failed. Please try again later.'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(result)


class MatchRequestsViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request):
        serializer = MatchCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            job = Job.objects.get(id=serializer.validated_data['job_id'])
        except Job.DoesNotExist:
            return Response({'error': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)

        resume = None
        resume_id = serializer.validated_data.get('resume_id')
        if resume_id:
            try:
                resume = Resume.objects.get(id=resume_id)
            except Resume.DoesNotExist:
                return Response({'error': 'Resume not found.'}, status=status.HTTP_404_NOT_FOUND)

        # If no resume specified, use user's primary resume
        if resume is None:
            resume = Resume.objects.filter(user=request.user, is_primary=True).first()

        if not resume:
            return Response(
                {'error': 'No resume available. Please upload and analyze a resume first.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        job_text = f"{job.title}\n{job.description}\n" \
                   f"Requirements: {json_or_empty(job.requirements)}"
        resume_text = resume.parsed_raw_text or extract_resume_text(
            resume.file.path, resume.file_format)

        try:
            result = analyze_job_application(job_text, resume_text, resume.skills)
        except Exception:
            logger.exception('AI match analysis failed for resume %s', resume.pk)
            return Response({'error': 'AI analysis failed. Please try again later.'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        result['job_id'] = str(job.id)
        result['job_title'] = job.title
        result['job_company'] = job.company
        result['resume_id'] = str(resume.id)
        return Response(result)


def json_or_empty(value):
    if isinstance(value, list):
        return ', '.join(str(x) for x in value)
    return str(value or '')
