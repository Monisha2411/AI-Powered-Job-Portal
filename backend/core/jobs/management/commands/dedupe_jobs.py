from django.core.management.base import BaseCommand
from django.db.models import Count
from core.jobs.models import Job
from core.applications.models import Application


class Command(BaseCommand):
    help = 'Remove duplicate job postings, keeping only the earliest record.'

    def handle(self, *args, **options):
        rows = (
            Job.objects
            .values('recruiter_id', 'title', 'company', 'description')
            .annotate(total=Count('id'))
            .filter(total__gt=1)
            .order_by('total')
        )

        deduped = 0
        for row in rows:
            candidates = list(
                Job.objects.filter(
                    recruiter_id=row['recruiter_id'],
                    title=row['title'],
                    company=row['company'],
                    description=row['description'],
                ).order_by('created_at', 'id')
            )
            keep = candidates[0]
            for dup in candidates[1:]:
                # Reassign applications when there is no (job, applicant) conflict.
                for application in dup.applications.all():
                    exists = Application.objects.filter(
                        job=keep, applicant=application.applicant).exists()
                    if not exists:
                        application.job = keep
                        application.save(update_fields=['job'])
                # Harmless duplicate skill rows; keep only unique names.
                keep_names = set(keep.job_skills.values_list('name', flat=True))
                for skill in dup.job_skills.all():
                    if skill.name not in keep_names:
                        skill.job = keep
                        skill.save(update_fields=['job'])
                        keep_names.add(skill.name)
                dup.delete()
                deduped += 1
                self.stdout.write(f"Removed duplicate job '{dup.title}' ({dup.id}) -> kept {keep.id}")

        self.stdout.write(self.style.SUCCESS(f"Done. Removed {deduped} duplicate job(s)."))