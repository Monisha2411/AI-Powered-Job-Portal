import logging

from django.shortcuts import get_object_or_404

from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action

from django_filters.rest_framework import DjangoFilterBackend, FilterSet
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Application
from .serializers import (
    ApplicationSerializer,
    ApplicationCreateSerializer,
    ApplicationStatusUpdateSerializer,
)
from .services import ensure_application_match

from core.ai_services.services import analyze_job_application
from core.ai_services.parser import extract_resume_text
from core.matching.matching_service import (
    compare_skills,
    extract_keywords,
    resolve_required_skills,
)

logger = logging.getLogger(__name__)


class IsRecruiterForJob(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_admin_user:
            return True

        if request.method in ["GET", "POST"]:
            return True

        return obj.job.recruiter == request.user


class ApplicationFilter(FilterSet):
    class Meta:
        model = Application
        fields = ["status", "job", "is_ai_analyzed"]


def _clean_skill_values(values):
    """Convert saved skill data into a flat list of readable skill names."""
    if not values:
        return []

    if isinstance(values, str):
        values = [values]

    if isinstance(values, dict):
        values = [values]

    cleaned = []
    for item in values:
        if isinstance(item, str):
            name = item.strip()
        elif isinstance(item, dict):
            name = (
                item.get("name")
                or item.get("skill")
                or item.get("title")
                or item.get("label")
                or ""
            )
            name = str(name).strip()
        else:
            name = ""

        if name and name.casefold() not in {
            existing.casefold() for existing in cleaned
        }:
            cleaned.append(name)

    return cleaned


def _candidate_skills(resume, resume_text):
    """Combine saved skills with skills extracted from the full resume text."""
    saved = _clean_skill_values(resume.skills or [])
    extracted = extract_keywords(resume_text) if resume_text else []

    combined = []
    seen = set()

    for skill in saved + extracted:
        key = str(skill).strip().casefold()
        if key and key not in seen:
            seen.add(key)
            combined.append(str(skill).strip())

    return combined


def _expand_required_skills(required_skills):
    """Split grouped requirements into individual skills for fair scoring."""
    expanded = []
    seen = set()

    for item in required_skills or []:
        if isinstance(item, dict):
            value = (
                item.get("name")
                or item.get("skill")
                or item.get("title")
                or item.get("label")
                or ""
            )
        else:
            value = item

        value = str(value).strip()
        if not value:
            continue

        # Expand comma/and-separated groups such as
        # "HTML, CSS and JavaScript" into separate requirements.
        extracted = extract_keywords(value)
        parts = extracted if len(extracted) > 1 else [value]

        for skill in parts:
            key = skill.casefold()
            if key not in seen:
                seen.add(key)
                expanded.append(skill)

    return expanded


class ApplicationViewSet(viewsets.ModelViewSet):
    queryset = Application.objects.all()
    serializer_class = ApplicationSerializer

    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter,
    ]

    filterset_class = ApplicationFilter

    search_fields = [
        "job__title",
        "applicant__username",
        "applicant__first_name",
        "applicant__last_name",
        "matched_skills",
    ]

    ordering_fields = ["created_at", "match_score"]

    def get_serializer_class(self):
        if self.action == "create":
            return ApplicationCreateSerializer

        if self.action in ["partial_update", "update"]:
            if (
                self.request.user.is_recruiter
                or self.request.user.is_admin_user
            ):
                return ApplicationStatusUpdateSerializer

        return ApplicationSerializer

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user

        if user.is_admin_user:
            return Application.objects.all()

        if user.is_recruiter:
            return Application.objects.filter(job__recruiter=user)

        return Application.objects.filter(applicant=user)

    def _ensure_matches(self, queryset):
        apps = queryset.filter(
            is_ai_analyzed=False
        ).select_related("resume", "job")

        for application in apps:
            ensure_application_match(application)

        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        self._ensure_matches(queryset)
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        application = self.get_object()
        ensure_application_match(application)
        return Response(ApplicationSerializer(application).data)

    def perform_create(self, serializer):
        application = serializer.save(applicant=self.request.user)
        ensure_application_match(application)

    def _get_resume_text(self, resume):
        resume_text = resume.parsed_raw_text or ""

        if not resume_text:
            if not resume.file:
                raise ValueError("Resume file is missing.")

            resume_text = extract_resume_text(
                resume.file.path,
                resume.file_format,
            )

        return resume_text

    def _local_fallback_analysis(self, application, resume_text):
        """Compare resume skills with job requirements without Gemini."""
        resume = application.resume

        # Merge stored skills with keyword extraction from the entire resume.
        # This prevents incomplete saved skill data from hiding resume skills.
        candidate_skills = _candidate_skills(resume, resume_text)

        required_skills = resolve_required_skills(application.job)

        if not required_skills:
            job_text = "\n".join([
                str(application.job.title or ""),
                str(application.job.description or ""),
                str(application.job.requirements or ""),
            ])
            required_skills = extract_keywords(job_text)

        # Split combined requirements so each skill receives its own match.
        required_skills = _expand_required_skills(required_skills)

        # Core Java is represented as Java in many fresher resumes.
        # Add the equivalent label for comparison while preserving the
        # job's original requirement label in the result.
        comparison_skills = list(candidate_skills)
        if any(
            str(skill).strip().casefold() == "java"
            for skill in candidate_skills
        ):
            comparison_skills.append("Core Java")

        matched_skills, missing_skills = compare_skills(
            comparison_skills,
            required_skills,
            threshold=0.90,
        )

        if required_skills:
            score = round(
                len(matched_skills) / len(required_skills) * 100,
                2,
            )
        else:
            score = 0.0

        return {
            "match_score": score,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "analysis_mode": "local_fallback",
            "candidate_skills": candidate_skills,
            "message": (
                "Gemini was unavailable. Local resume keyword matching "
                "was used."
            ),
        }

    @action(
        detail=True,
        methods=["post"],
        url_path="analyze_with_ai",
    )
    def analyze_with_ai(self, request, pk=None):
        application = get_object_or_404(
            Application.objects.select_related(
                "job",
                "resume",
                "applicant",
            ),
            pk=pk,
        )

        if not (
            request.user.is_admin_user
            or application.job.recruiter_id == request.user.id
        ):
            return Response(
                {
                    "error": (
                        "You do not have permission to analyze "
                        "this application."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if not application.resume:
            return Response(
                {"error": "Applicant has no resume to analyze."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            requirements = application.job.requirements

            if isinstance(requirements, list):
                requirements_text = ", ".join(
                    str(item) for item in requirements
                )
            else:
                requirements_text = str(requirements or "")

            job_text = "\n".join([
                str(application.job.title or ""),
                str(application.job.description or ""),
                f"Requirements: {requirements_text}",
            ])

            try:
                resume_text = self._get_resume_text(application.resume)
            except Exception as exc:
                logger.exception(
                    "Could not read resume for application %s",
                    application.pk,
                )
                return Response(
                    {"error": f"Could not read applicant resume: {exc}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                result = analyze_job_application(
                    job_text,
                    resume_text,
                    application.resume.skills or [],
                )
                analysis_mode = "gemini"
                message = "AI analysis completed successfully."

            except Exception:
                logger.exception(
                    "Gemini analysis failed for application %s. "
                    "Using local skill matching.",
                    application.pk,
                )
                result = self._local_fallback_analysis(
                    application,
                    resume_text,
                )
                analysis_mode = "local_fallback"
                message = result.get("message")

            application.match_score = result.get("match_score", 0)
            application.matched_skills = result.get("matched_skills", [])
            application.missing_skills = result.get("missing_skills", [])
            application.ai_analysis = result
            application.is_ai_analyzed = True
            application.match_source = (
                "ai" if analysis_mode == "gemini" else "local"
            )
            application.save()

            response_data = ApplicationSerializer(application).data
            response_data["analysis_mode"] = analysis_mode
            response_data["analysis_message"] = message

            return Response(response_data)

        except Exception:
            logger.exception(
                "Application analysis failed for application %s",
                application.pk,
            )
            return Response(
                {
                    "error": (
                        "Application analysis failed. "
                        "Please try again later."
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(
        detail=False,
        methods=["get"],
        url_path="my_applications",
    )
    def my_applications(self, request):
        applications = Application.objects.filter(
            applicant=request.user
        )
        self._ensure_matches(applications)

        serializer = ApplicationSerializer(
            applications,
            many=True,
        )
        return Response(serializer.data)

    @action(
        detail=True,
        methods=["post"],
        url_path="withdraw",
    )
    def withdraw(self, request, pk=None):
        application = self.get_object()

        if not (
            request.user.is_admin_user
            or request.user == application.applicant
        ):
            return Response(
                {
                    "error": (
                        "You do not have permission to withdraw "
                        "this application."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if application.status == "withdrawn":
            return Response(
                {"error": "This application is already withdrawn."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        application.status = "withdrawn"
        application.save()

        return Response(ApplicationSerializer(application).data)


