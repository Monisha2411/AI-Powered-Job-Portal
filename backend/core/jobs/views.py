import logging

from django.db.models import Q
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import Job
from .serializers import JobSerializer, JobCreateSerializer
from core.adzuna_service import search_adzuna_jobs

logger = logging.getLogger(__name__)


class IsRecruiterOrReadOnly(permissions.BasePermission):
    """
    Allow read access to job seekers.
    Only recruiters who own a job and admins may change that job.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        user = request.user
        return (
            user.is_authenticated
            and (getattr(user, 'is_recruiter', False)
                 or getattr(user, 'is_admin_user', False))
        )

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        user = request.user
        return (
            getattr(user, 'is_admin_user', False)
            or obj.recruiter_id == user.id
        )


class JobViewSet(viewsets.ModelViewSet):
    serializer_class = JobSerializer
    permission_classes = [IsRecruiterOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        queryset = Job.objects.select_related('recruiter')

        if getattr(user, 'is_admin_user', False):
            pass
        elif getattr(user, 'is_recruiter', False):
            # Recruiters see their own postings, including closed postings.
            queryset = queryset.filter(recruiter=user)
        else:
            # Job seekers see only currently open and active postings.
            queryset = queryset.filter(is_active=True, status='open')

        params = self.request.query_params

        search = params.get('search') or params.get('query')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(company__icontains=search)
                | Q(description__icontains=search)
                | Q(location__icontains=search)
            )

        location = params.get('location')
        if location:
            queryset = queryset.filter(location__icontains=location)

        job_type = params.get('job_type')
        if job_type:
            queryset = queryset.filter(job_type=job_type)

        experience_level = params.get('experience_level')
        if experience_level:
            queryset = queryset.filter(experience_level=experience_level)

        job_status = params.get('status')
        if job_status:
            queryset = queryset.filter(status=job_status)

        ordering = params.get('ordering')
        allowed_ordering = {
            'created_at', '-created_at', 'title', '-title',
            'salary_min', '-salary_min', 'salary_max', '-salary_max',
        }
        if ordering in allowed_ordering:
            queryset = queryset.order_by(ordering)

        return queryset.distinct()

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return JobCreateSerializer
        return JobSerializer

    def perform_create(self, serializer):
        serializer.save(recruiter=self.request.user)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def external_jobs(request):
    """
    Search live external listings through Adzuna.
    Example: /api/jobs/external/?query=Python%20Developer&location=Bengaluru
    """
    query = (request.query_params.get('query') or
             request.query_params.get('search') or '').strip()
    location = (request.query_params.get('location') or 'Bengaluru').strip()
    page_value = request.query_params.get('page', '1')

    if not query:
        return Response(
            {'error': 'Please provide a job search query using the query parameter.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        page = int(page_value)
        if page < 1:
            raise ValueError
    except (TypeError, ValueError):
        return Response(
            {'error': 'Page must be a positive integer.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        jobs = search_adzuna_jobs(query=query, location=location, page=page)
        return Response({
            'count': len(jobs),
            'results': jobs,
            'source': 'Adzuna',
        })
    except ValueError as exc:
        logger.warning('Adzuna configuration error: %s', exc)
        return Response(
            {'error': 'External job search is not configured. Check the Adzuna environment settings.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    except Exception:
        logger.exception('Adzuna external job search failed')
        return Response(
            {'error': 'External job search is temporarily unavailable. Please try again.'},
            status=status.HTTP_502_BAD_GATEWAY,
        )
