
from django.db import models
from django.conf import settings
from django.db.models import Q
import uuid


class Application(models.Model):
    STATUS_CHOICES = [
        ('submitted', 'Submitted'),
        ('under_review', 'Under Review'),
        ('interview', 'Interview'),
        ('offer', 'Offer Given'),
        ('hired', 'Hired'),
        ('rejected', 'Rejected'),
        ('withdrawn', 'Withdrawn'),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    # Internal job
    job = models.ForeignKey(
        'jobs.Job',
        on_delete=models.CASCADE,
        related_name='applications',
        null=True,
        blank=True
    )

    # External Adzuna job
    external_job_id = models.CharField(
        max_length=100,
        blank=True,
        default=''
    )
    external_job_url = models.URLField(
        blank=True,
        default=''
    )
    external_job_title = models.CharField(
        max_length=255,
        blank=True,
        default=''
    )
    external_company = models.CharField(
        max_length=255,
        blank=True,
        default=''
    )
    external_location = models.CharField(
        max_length=255,
        blank=True,
        default=''
    )

    applicant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='applications'
    )

    resume = models.ForeignKey(
        'resumes.Resume',
        on_delete=models.SET_NULL,
        related_name='applications',
        null=True,
        blank=True
    )

    cover_letter = models.TextField(blank=True, default='')

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='submitted'
    )

    notes = models.TextField(blank=True, default='')

    # AI matching results
    match_score = models.FloatField(null=True, blank=True)
    matched_skills = models.JSONField(default=list, blank=True)
    missing_skills = models.JSONField(default=list, blank=True)
    ai_analysis = models.JSONField(default=dict, blank=True)

    is_ai_analyzed = models.BooleanField(default=False)

    match_source = models.CharField(
        max_length=10,
        choices=[('ai', 'AI'), ('local', 'Local')],
        default='local'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

        constraints = [
            models.UniqueConstraint(
                fields=['job', 'applicant'],
                condition=Q(job__isnull=False),
                name='unique_internal_job_application'
            ),
            models.UniqueConstraint(
                fields=['applicant', 'external_job_id'],
                condition=~Q(external_job_id=''),
                name='unique_external_job_application_per_user'
            )
        ]

    def __str__(self):
        if self.job:
            job_title = self.job.title
        else:
            job_title = self.external_job_title or 'External Job'

        return f"{self.applicant.username} - {job_title}"
