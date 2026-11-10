import os
import logging
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.conf import settings
from .models import Resume
from .serializers import ResumeSerializer
from core.ai_services.services import analyze_resume, validate_resume_text
from core.ai_services.parser import extract_resume_text

logger = logging.getLogger(__name__)


class IsOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_admin_user:
            return True
        return obj.user == request.user


class ResumeViewSet(viewsets.ModelViewSet):
    serializer_class = ResumeSerializer
    permission_classes = [IsOwnerOrAdmin]

    def get_queryset(self):
        if self.request.user.is_admin_user:
            return Resume.objects.all()
        return Resume.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        file = serializer.validated_data.get('file')
        file_name = file.name
        file_size = file.size
        ext = os.path.splitext(file_name)[1].lower().lstrip('.')
        resume = serializer.save(
            user=self.request.user,
            file_name=file_name,
            file_size=file_size,
            file_format=ext if ext in ['pdf', 'docx', 'doc', 'txt'] else 'other'
        )
        # Set as primary if first resume
        if not Resume.objects.filter(user=self.request.user, is_primary=True).exclude(id=resume.id).exists():
            resume.is_primary = True
            resume.save(update_fields=['is_primary'])

    @action(detail=True, methods=['post'])
    def analyze(self, request, pk=None):
        resume = self.get_object()
        if resume.analysis_status == 'processing':
            return Response({'error': 'Analysis is already in progress.'}, status=status.HTTP_400_BAD_REQUEST)

        resume.analysis_status = 'processing'
        resume.save(update_fields=['analysis_status'])

        try:
            # Extract text from file based on format
            text = extract_resume_text(resume.file.path, resume.file_format)
            resume.parsed_raw_text = text
            resume.save(update_fields=['parsed_raw_text'])

            # Validate that the document is actually a resume before analyzing
            validation = validate_resume_text(text)
            if not validation.get('is_resume'):
                reason = validation.get('reason') or 'The uploaded document is not a valid resume.'
                resume.analysis_status = 'failed'
                resume.analysis_error = reason
                resume.save(update_fields=['analysis_status', 'analysis_error'])
                return Response({'error': reason}, status=status.HTTP_400_BAD_REQUEST)

            # Analyze with Gemini
            result = analyze_resume(text)

            resume.full_name = result.get('full_name', '')
            resume.email = result.get('email', '')
            resume.phone = result.get('phone', '')
            resume.location = result.get('location', '')
            resume.summary = result.get('summary', '')
            resume.skills = result.get('skills', [])
            resume.education = result.get('education', [])
            resume.experience = result.get('experience', [])
            resume.certifications = result.get('certifications', [])
            resume.is_analyzed = True
            resume.analysis_status = 'completed'
            resume.analysis_error = ''
            resume.save()

            return Response(ResumeSerializer(resume).data)
        except Exception as e:
            resume.analysis_status = 'failed'
            resume.analysis_error = str(e)
            resume.save(update_fields=['analysis_status', 'analysis_error'])
            logger.exception('Resume analysis failed for resume %s', resume.pk)
            return Response({'error': 'Resume analysis failed. Please try again later.'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def set_primary(self, request, pk=None):
        resume = self.get_object()
        self.get_queryset().exclude(id=resume.id).update(is_primary=False)
        resume.is_primary = True
        resume.save(update_fields=['is_primary'])
        return Response({'message': 'Resume set as primary.'})
