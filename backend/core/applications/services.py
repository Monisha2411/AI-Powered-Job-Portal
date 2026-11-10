from core.ai_services.parser import extract_resume_text
from core.matching.matching_service import (
    extract_keywords,
    match_resume_to_job,
    resolve_required_skills,
)
from core.matching.models import Recommendation


def _candidate_skills(resume):
    """Return saved resume skills, or extract skills from the resume text."""
    saved_skills = resume.skills or []

    if isinstance(saved_skills, str):
        saved_skills = [
            item.strip()
            for item in saved_skills.replace(";", ",").split(",")
            if item.strip()
        ]

    if saved_skills:
        return list(saved_skills)

    text = resume.parsed_raw_text or ""

    if not text and resume.file:
        try:
            text = extract_resume_text(resume.file.path, resume.file_format)
        except Exception:
            text = ""

    return extract_keywords(text) if text else []


def _mirror_recommendation(application, recommendation):
    """Copy a saved resume/job recommendation onto an internal application."""
    is_ai = recommendation.source == "ai"

    unchanged = (
        application.match_score == recommendation.match_score
        and list(application.matched_skills or [])
        == list(recommendation.matched_skills or [])
        and list(application.missing_skills or [])
        == list(recommendation.missing_skills or [])
        and application.match_source == recommendation.source
        and application.is_ai_analyzed == is_ai
    )

    if unchanged:
        return

    application.match_score = recommendation.match_score
    application.matched_skills = recommendation.matched_skills or []
    application.missing_skills = recommendation.missing_skills or []
    application.ai_analysis = {
        "match_score": recommendation.match_score,
        "matched_skills": recommendation.matched_skills or [],
        "missing_skills": recommendation.missing_skills or [],
    }
    application.match_source = recommendation.source
    application.is_ai_analyzed = is_ai

    application.save(update_fields=[
        "match_score",
        "matched_skills",
        "missing_skills",
        "ai_analysis",
        "match_source",
        "is_ai_analyzed",
        "updated_at",
    ])


def ensure_application_match(application):
    """Refresh local match data when the resume or job has changed.

    This function does not call Gemini. External applications are skipped
    because they do not have an internal Job object.
    """
    resume = application.resume
    job = application.job

    if resume is None or job is None:
        return

    # A saved recommendation is reusable only when it is at least as new
    # as both the resume and the job.
    source_updated = job.updated_at
    if resume.updated_at and resume.updated_at > source_updated:
        source_updated = resume.updated_at

    recommendation = Recommendation.objects.filter(
        resume=resume,
        job=job,
    ).first()

    if recommendation is not None:
        recommendation_updated = getattr(
            recommendation, "updated_at", None
        )
        if (
            recommendation_updated is None
            or recommendation_updated >= source_updated
        ):
            _mirror_recommendation(application, recommendation)
            return

    # Keep an existing AI result when neither source record has changed.
    # If the resume or job changed later, refresh with local matching.
    if (
        application.is_ai_analyzed
        and application.updated_at
        and application.updated_at >= source_updated
    ):
        return

    # Keep a current local result instead of recalculating on every page load.
    if (
        application.match_score is not None
        and application.match_source == "local"
        and application.updated_at
        and application.updated_at >= source_updated
    ):
        return

    candidate_skills = _candidate_skills(resume)
    required_skills = resolve_required_skills(job)

    match = match_resume_to_job(
        candidate_skills,
        job_required_skills=required_skills,
        job_requirements_text=job.description,
    )

    application.match_score = match["match_score"]
    application.matched_skills = match["matched_skills"]
    application.missing_skills = match["missing_skills"]
    application.ai_analysis = match
    application.match_source = "local"
    application.is_ai_analyzed = False

    application.save(update_fields=[
        "match_score",
        "matched_skills",
        "missing_skills",
        "ai_analysis",
        "match_source",
        "is_ai_analyzed",
        "updated_at",
    ])
