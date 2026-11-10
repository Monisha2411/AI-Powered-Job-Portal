from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count, Avg
from core.users.models import User
from core.jobs.models import Job
from core.applications.models import Application
from core.resumes.models import Resume


class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.is_admin_user:
            return self._admin_stats()
        if user.is_recruiter:
            return self._recruiter_stats(user)
        return self._jobseeker_stats(user)

    def _admin_stats(self):
        return Response({
            'total_users': User.objects.count(),
            'total_recruiters': User.objects.filter(role='recruiter').count(),
            'total_jobseekers': User.objects.filter(role='jobseeker').count(),
            'total_jobs': Job.objects.count(),
            'open_jobs': Job.objects.filter(status='open', is_active=True).count(),
            'total_applications': Application.objects.count(),
            'total_resumes': Resume.objects.count(),
            'jobseekers_with_resume': User.objects.filter(role='jobseeker', resumes__isnull=False).distinct().count(),
            'recent_users': list(User.objects.order_by('-date_joined')[:5].values(
                'id', 'username', 'email', 'role', 'date_joined')),
            'recent_jobs': list(Job.objects.order_by('-created_at')[:5].values(
                'id', 'title', 'company', 'status', 'created_at')),
            'recent_applications': list(Application.objects.order_by('-created_at')[:5].values(
                'id', 'status', 'match_score', 'created_at')),
        })

    def _recruiter_stats(self, user):
        my_jobs = Job.objects.filter(recruiter=user)
        my_job_ids = my_jobs.values_list('id', flat=True)
        my_apps = Application.objects.filter(job_id__in=my_job_ids)

        return Response({
            'total_jobs': my_jobs.count(),
            'open_jobs': my_jobs.filter(status='open', is_active=True).count(),
            'total_applications': my_apps.count(),
            'ai_analyzed_applications': my_apps.filter(is_ai_analyzed=True).count(),
            'avg_match_score': self._avg(my_apps, 'match_score'),
            'job_status_breakdown': list(my_jobs.values('status').annotate(count=Count('id'))),
            'application_status_breakdown': list(my_apps.values('status').annotate(count=Count('id'))),
            'top_jobs': list(my_jobs.annotate(apps=Count('applications')).order_by('-apps')[:5].values(
                'id', 'title', 'status', 'apps')),
            'recent_applications': list(my_apps.order_by('-created_at')[:5].values(
                'id', 'status', 'match_score', 'created_at')),
        })

    def _jobseeker_stats(self, user):
        my_resumes = Resume.objects.filter(user=user)
        my_apps = Application.objects.filter(applicant=user)
        analyzed_resume = my_resumes.filter(is_primary=True, is_analyzed=True).first()

        return Response({
            'total_resumes': my_resumes.count(),
            'has_analyzed_resume': analyzed_resume is not None,
            'total_skills': len(analyzed_resume.skills) if analyzed_resume else 0,
            'total_applications': my_apps.count(),
            'application_status_breakdown': list(my_apps.values('status').annotate(count=Count('id'))),
            'recent_applications': list(my_apps.order_by('-created_at')[:5].values(
                'id', 'status', 'match_score', 'created_at', 'job__title')),
            'avg_match_score': self._avg(my_apps, 'match_score'),
        })

    def _avg(self, qs, field):
        agg = qs.aggregate(avg=Avg(field))['avg']
        return round(agg, 2) if agg is not None else 0
