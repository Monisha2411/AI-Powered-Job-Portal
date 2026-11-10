from django.db import models
from django.conf import settings
import uuid


class Resume(models.Model):
    RESUME_FORMAT_CHOICES = [
        ('pdf', 'PDF'),
        ('docx', 'DOCX'),
        ('txt', 'TXT'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='resumes'
    )
    file = models.FileField(upload_to='resumes/')
    file_name = models.CharField(max_length=255)
    file_format = models.CharField(max_length=10, choices=RESUME_FORMAT_CHOICES, default='other')
    file_size = models.PositiveIntegerField(default=0)

    # Extracted structured data from AI analysis
    full_name = models.CharField(max_length=255, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    phone = models.CharField(max_length=50, blank=True, default='')
    location = models.CharField(max_length=255, blank=True, default='')
    summary = models.TextField(blank=True, default='')
    skills = models.JSONField(default=list, blank=True)
    education = models.JSONField(default=list, blank=True)
    experience = models.JSONField(default=list, blank=True)
    certifications = models.JSONField(default=list, blank=True)
    parsed_raw_text = models.TextField(blank=True, default='')

    is_analyzed = models.BooleanField(default=False)
    analysis_status = models.CharField(
        max_length=20,
        choices=[('pending', 'Pending'), ('processing', 'Processing'),
                 ('completed', 'Completed'), ('failed', 'Failed')],
        default='pending'
    )
    analysis_error = models.TextField(blank=True, default='')

    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.file_name} - {self.user.username}"


class ProfileMatch(models.Model):
    """Persisted skill gap / match analysis per resume."""
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='match_results')
    job = models.ForeignKey('jobs.Job', on_delete=models.CASCADE, related_name='match_results', null=True, blank=True)
    matched_skills = models.JSONField(default=list, blank=True)
    missing_skills = models.JSONField(default=list, blank=True)
    match_score = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-match_score']

    def __str__(self):
        return f"{self.resume} - {self.match_score}"
