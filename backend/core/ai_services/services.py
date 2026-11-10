import json
import logging
import re

from .gemini_client import get_gemini_client
from .schemas import (
    RESUME_ANALYSIS_SCHEMA,
    JOB_ANALYSIS_SCHEMA,
    RESUME_ANALYSIS_PROMPT,
    JOB_ANALYSIS_PROMPT,
    JOB_APPLICATION_MATCH_PROMPT,
    JOB_APPLICATION_MATCH_SCHEMA,
    RESUME_VALIDATION_SCHEMA,
    RESUME_VALIDATION_PROMPT,
)

logger = logging.getLogger(__name__)

# Stop repeated Gemini calls after a daily quota error.
_GEMINI_QUOTA_EXHAUSTED = False


def _is_quota_error(error):
    message = str(error).upper()
    return (
        "429" in message
        or "RESOURCE_EXHAUSTED" in message
        or "QUOTA EXCEEDED" in message
    )


def validate_resume_text(document_text):
    """Determine whether extracted document text appears to be a resume."""
    text = (document_text or "").strip()
    if not text:
        return _local_resume_validation(text)

    client = get_gemini_client()
    if not client.available:
        return _local_resume_validation(text)

    prompt = RESUME_VALIDATION_PROMPT.format(
        schema=json.dumps(RESUME_VALIDATION_SCHEMA),
        document_text=text[:40000] or "(empty)",
    )

    try:
        result = client.generate_content(
            prompt,
            response_schema=RESUME_VALIDATION_SCHEMA,
        )
        result = dict(result or {})
        result["is_resume"] = bool(result.get("is_resume"))
        result.setdefault("reason", "")
        return result
    except Exception:
        logger.exception("Gemini resume validation failed")
        return _local_resume_validation(text)


def analyze_resume(resume_text):
    """Analyze resume text with Gemini, using useful local extraction as fallback."""
    text = (resume_text or "").strip()
    client = get_gemini_client()

    if not client.available:
        return _local_resume_extraction(text)

    prompt = RESUME_ANALYSIS_PROMPT.format(
        schema=json.dumps(RESUME_ANALYSIS_SCHEMA),
        resume_text=text[:40000],
    )

    try:
        result = client.generate_content(
            prompt,
            response_schema=RESUME_ANALYSIS_SCHEMA,
        )
        # Do not accept an empty AI result when readable resume text exists.
        if isinstance(result, dict) and (
            result.get("skills")
            or result.get("full_name")
            or result.get("email")
            or result.get("education")
        ):
            return result
        return _merge_analysis(
            result if isinstance(result, dict) else {},
            _local_resume_extraction(text),
        )
    except Exception:
        logger.exception("Gemini resume analysis failed")
        return _local_resume_extraction(text)


def _merge_analysis(ai_result, local_result):
    """Fill missing AI fields with locally extracted values."""
    merged = dict(local_result)
    for key, value in (ai_result or {}).items():
        if value not in (None, "", []):
            merged[key] = value
    return merged


def analyze_job_description(job_description):
    """Analyze a job description with Gemini, with a local fallback."""
    client = get_gemini_client()

    if not client.available:
        return _local_job_extraction(job_description)

    prompt = JOB_ANALYSIS_PROMPT.format(
        schema=json.dumps(JOB_ANALYSIS_SCHEMA),
        job_description=(job_description or "")[:40000],
    )

    try:
        result = client.generate_content(
            prompt,
            response_schema=JOB_ANALYSIS_SCHEMA,
        )
        return result or _local_job_extraction(job_description)
    except Exception:
        logger.exception("Gemini job description analysis failed")
        return _local_job_extraction(job_description)


def analyze_job_application(job_description, resume_text, candidate_skills=None):
    """Analyze a candidate against a job, using local matching after quota errors."""
    global _GEMINI_QUOTA_EXHAUSTED

    if _GEMINI_QUOTA_EXHAUSTED:
        return _local_application_match(
            job_description, resume_text, candidate_skills
        )

    client = get_gemini_client()
    if not client.available:
        return _local_application_match(
            job_description, resume_text, candidate_skills
        )

    prompt = JOB_APPLICATION_MATCH_PROMPT.format(
        schema=json.dumps(JOB_APPLICATION_MATCH_SCHEMA),
        job_description=(job_description or "")[:30000],
        resume_text=(resume_text or "")[:30000],
        candidate_skills=json.dumps(candidate_skills or []),
    )

    try:
        return client.generate_content(
            prompt,
            response_schema=JOB_APPLICATION_MATCH_SCHEMA,
        )
    except Exception as exc:
        if _is_quota_error(exc):
            _GEMINI_QUOTA_EXHAUSTED = True
            logger.warning(
                "Gemini quota exhausted. Application analysis will use "
                "local matching until the backend restarts."
            )
            return _local_application_match(
                job_description, resume_text, candidate_skills
            )
        logger.exception("Gemini application analysis failed")
        return _local_application_match(
            job_description, resume_text, candidate_skills
        )


# ---------------------------------------------------------------------------
# Local resume extraction.
# ---------------------------------------------------------------------------

def _local_resume_validation(text):
    if not text:
        return {
            "is_resume": False,
            "reason": (
                "No readable text was extracted. Upload a text-based PDF, "
                "DOCX, or TXT resume."
            ),
        }

    keywords = [
        "experience", "education", "skill", "work", "employment",
        "resume", "curriculum", "objective", "summary", "project",
        "certification", "contact", "email", "phone",
    ]
    low = text.lower()
    hits = sum(1 for keyword in keywords if keyword in low)

    if hits < 3 or len(text) < 100:
        return {
            "is_resume": False,
            "reason": "This document does not appear to be a resume.",
        }

    return {"is_resume": True, "reason": ""}


def _local_resume_extraction(text):
    """Extract common resume fields without an external AI service."""
    text = (text or "").strip()
    if not text:
        return {
            "full_name": "",
            "email": "",
            "phone": "",
            "location": "",
            "summary": "",
            "skills": [],
            "education": [],
            "experience": [],
            "certifications": [],
        }

    lines = [re.sub(r"\s+", " ", line).strip() for line in text.splitlines()]
    lines = [line for line in lines if line]

    email_match = re.search(
        r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b",
        text,
        re.IGNORECASE,
    )
    phone_match = re.search(
        r"(?<!\w)(?:\+?91[\s.-]?)?[6-9]\d{9}(?!\w)",
        text,
    )

    full_name = ""
    for line in lines[:8]:
        cleaned = re.sub(r"[^A-Za-z .'-]", "", line).strip()
        words = cleaned.split()
        if 2 <= len(words) <= 4 and not any(
            word.lower() in {
                "resume", "curriculum", "vitae", "email", "phone",
                "linkedin", "github",
            }
            for word in words
        ):
            full_name = cleaned
            break

    # Use the project's deterministic skill vocabulary.
    try:
        from core.matching.matching_service import extract_keywords
        skills = extract_keywords(text)
    except Exception:
        logger.exception("Local skill extraction failed")
        skills = []

    # Add common Java skills often written in resumes.
    extra_skill_patterns = {
        "Core Java": r"\bcore\s+java\b",
        "OOP Concepts": (
            r"\b(?:oop|object[\s-]+oriented(?:\s+programming|\s+concepts)?)\b"
        ),
        "JDBC": r"\b(?:jdbc|java\s+database\s+connectivity)\b",
        "Spring Boot": r"\bspring\s+boot\b",
        "REST APIs": r"\brestful?\s+apis?\b|\brest\s+apis?\b",
        "Problem-solving": r"\bproblem[\s-]+solving\b",
    }
    existing = {str(skill).casefold() for skill in skills}
    for label, pattern in extra_skill_patterns.items():
        if re.search(pattern, text, re.IGNORECASE):
            if label.casefold() not in existing:
                skills.append(label)
                existing.add(label.casefold())

    education = _extract_section(
        lines,
        ["education", "academic qualification", "qualification"],
        [
            "technical skills", "skills", "projects", "work experience",
            "experience", "certifications", "achievements",
        ],
    )
    experience = _extract_section(
        lines,
        ["work experience", "professional experience", "experience", "internship"],
        [
            "education", "technical skills", "skills", "projects",
            "certifications", "achievements",
        ],
    )
    certifications = _extract_section(
        lines,
        ["certifications", "certificates"],
        ["education", "technical skills", "skills", "projects", "experience"],
    )

    summary = ""
    for heading in ["career objective", "objective", "professional summary", "summary"]:
        section = _extract_section(
            lines,
            [heading],
            ["education", "technical skills", "skills", "projects", "experience"],
        )
        if section:
            summary = " ".join(section)
            break

    location = ""
    for line in lines[:12]:
        if re.search(r"\b(bengaluru|bangalore|karnataka|india)\b", line, re.I):
            location = line
            break

    return {
        "full_name": full_name,
        "email": email_match.group(0) if email_match else "",
        "phone": phone_match.group(0) if phone_match else "",
        "location": location,
        "summary": summary,
        "skills": skills,
        "education": education,
        "experience": experience,
        "certifications": certifications,
    }


def _extract_section(lines, headings, stop_headings):
    """Collect lines below a section heading until the next known heading."""
    heading_set = {item.casefold() for item in headings}
    stop_set = {item.casefold() for item in stop_headings}
    start = None

    for index, line in enumerate(lines):
        normalized = re.sub(r"[:\s]+$", "", line).casefold()
        if normalized in heading_set:
            start = index + 1
            break

    if start is None:
        return []

    result = []
    for line in lines[start:]:
        normalized = re.sub(r"[:\s]+$", "", line).casefold()
        if normalized in stop_set:
            break
        if len(line) > 1:
            result.append(line)
    return result


def _local_job_extraction(text):
    """Return locally extracted job requirements."""
    try:
        from core.matching.matching_service import extract_keywords
        skills = extract_keywords(text or "")
    except Exception:
        logger.exception("Local job skill extraction failed")
        skills = []

    return {
        "required_skills": skills,
        "preferred_skills": [],
        "key_requirements": [],
        "experience_level": "",
        "qualifications": [],
    }


def _normalise_skill(skill):
    if isinstance(skill, str):
        return skill.strip()
    if isinstance(skill, dict):
        return str(
            skill.get("name")
            or skill.get("skill")
            or skill.get("title")
            or ""
        ).strip()
    return ""


def _local_application_match(job_text, resume_text, candidate_skills):
    """Compare candidate skills with requirements using local text matching."""
    try:
        from core.matching.matching_service import (
            extract_keywords,
            match_resume_to_job,
        )

        required = extract_keywords(job_text or "")
        skills = candidate_skills or extract_keywords(resume_text or "")
        result = match_resume_to_job(
            skills,
            job_required_skills=required,
            job_requirements_text=job_text,
        )
        matched = result["matched_skills"]
        missing = result["missing_skills"]
        return {
            **result,
            "strengths": matched,
            "gaps": missing,
            "recommendation": (
                "Local skill comparison completed. Review the resume and "
                "job requirements before making a hiring decision."
            ),
            "analysis_mode": "local_fallback",
        }
    except Exception:
        logger.exception("Local application matching failed")
        return {
            "match_score": 0,
            "matched_skills": [],
            "missing_skills": [],
            "strengths": [],
            "gaps": [],
            "recommendation": "Manual review is required.",
            "analysis_mode": "local_fallback",
        }
