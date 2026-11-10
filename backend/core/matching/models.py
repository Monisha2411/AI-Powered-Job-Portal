from django.db import models
import uuid


class Recommendation(models.Model):
    SOURCE_CHOICES = [
        ('ai', 'AI'),
        ('local', 'Local'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    resume = models.ForeignKey(
        'resumes.Resume', on_delete=models.CASCADE, related_name='recommendations'
    )
    job = models.ForeignKey(
        'jobs.Job', on_delete=models.CASCADE, related_name='recommendations'
    )
    match_score = models.FloatField(default=0.0)
    matched_skills = models.JSONField(default=list, blank=True)
    missing_skills = models.JSONField(default=list, blank=True)
    source = models.CharField(max_length=10, choices=SOURCE_CHOICES, default='local')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-match_score']
        constraints = [
            models.UniqueConstraint(
                fields=['resume', 'job'], name='unique_recommendation_per_resume_job'
            ),
        ]

    def __str__(self):
        return f'{self.resume_id} -> {self.job_id} ({self.match_score})'