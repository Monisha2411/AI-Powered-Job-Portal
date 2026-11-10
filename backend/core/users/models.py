
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('recruiter', 'Recruiter'),
        ('jobseeker', 'Job Seeker'),
    ]

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='jobseeker'
    )

    phone_number = models.CharField(max_length=20, blank=True)
    company = models.CharField(max_length=200, blank=True)
    profile_photo = models.ImageField(
        upload_to='profile_photos/',
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date_joined']

    def save(self, *args, **kwargs):
        # Automatically assign the Admin role to Django superusers.
        if self.is_superuser:
            self.role = 'admin'

        super().save(*args, **kwargs)

    @property
    def is_recruiter(self):
        return self.role == 'recruiter'

    @property
    def is_jobseeker(self):
        return self.role == 'jobseeker'

    @property
    def is_admin_user(self):
        return self.role == 'admin' or self.is_superuser
