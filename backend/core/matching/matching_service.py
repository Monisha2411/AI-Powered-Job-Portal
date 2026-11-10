"""Deterministic resume-to-job skill matching.

Gemini may extract structured skills when its quota is available.
This module handles normalization, skill comparison, keyword extraction,
and match scoring without requiring an external AI service.
"""

import re
from difflib import SequenceMatcher


SKILL_ALIASES = {
    "js": "javascript",
    "javascript es6": "javascript",
    "javascript es 6": "javascript",
    "ts": "typescript",
    "node.js": "nodejs",
    "node js": "nodejs",
    "node": "nodejs",
    "react.js": "react",
    "react js": "react",
    "next.js": "nextjs",
    "next js": "nextjs",
    "vue.js": "vue",
    "vue js": "vue",
    "postgres": "postgresql",
    "postgre sql": "postgresql",
    "mongo": "mongodb",
    "mongo db": "mongodb",
    "restful api": "rest api",
    "rest apis": "rest api",
    "api development": "rest api",
    "ml": "machine learning",
    "dl": "deep learning",
    "artificial intelligence": "ai",
    "ui ux": "ui/ux",
    "user interface": "ui",
    "user experience": "ux",
    "amazon web services": "aws",
    "google cloud platform": "gcp",
    "microsoft azure": "azure",
    "structured query language": "sql",
    "core java": "java",
    "oop": "object oriented programming",
    "oop concepts": "object oriented programming",
    "object-oriented programming": "object oriented programming",
    "object oriented concepts": "object oriented programming",
    "object-oriented concepts": "object oriented programming",
    "java database connectivity": "jdbc",
    "problem-solving": "problem solving",
    "problem solving skills": "problem solving",
}

COMMON_SKILLS = [
    "object oriented programming", "object-oriented programming",
    "object oriented concepts", "object-oriented concepts",
    "problem solving", "problem-solving", "problem solving skills",
    "java database connectivity", "machine learning", "deep learning",
    "data science", "data analysis", "artificial intelligence",
    "project management", "rest api", "postgresql", "javascript",
    "typescript", "kubernetes", "tensorflow", "communication",
    "critical thinking", "computer networks", "operating systems",
    "spring boot", "amazon web services", "google cloud platform",
    "cloud computing", "version control", "tailwind css", "node.js",
    "nodejs", "fastapi", "bootstrap", "python", "react", "django",
    "flask", "mysql", "mongodb", "docker", "azure", "aws", "github",
    "java", "jdbc", "c++", "c#", "go", "rust", "ruby", "sql", "nlp",
    "pytorch", "html", "css", "graphql", "redis", "agile", "scrum",
    "php", "angular", "vue", "linux", "excel",
]


def _skill_name(skill):
    """Read a skill represented as text or an extracted-skill dictionary."""
    if isinstance(skill, dict):
        return (
            skill.get("name")
            or skill.get("skill")
            or skill.get("title")
            or skill.get("label")
            or ""
        )
    return skill or ""


def _as_skill_list(skills):
    """Convert a string, iterable, or missing value into a safe list."""
    if not skills:
        return []
    if isinstance(skills, str):
        return [
            item.strip()
            for item in re.split(r"[,;\n]", skills)
            if item.strip()
        ]
    if isinstance(skills, dict):
        return [skills]
    try:
        return list(skills)
    except TypeError:
        return [skills]


def normalize_skill(name):
    """Normalize a skill name for consistent comparison."""
    text = str(_skill_name(name)).strip().lower()
    text = text.replace("&", " and ")
    text = re.sub(r"\s+", " ", text).strip()
    return SKILL_ALIASES.get(text, text)


def tokenize_skills(skills):
    """Return unique normalized skill names."""
    return {
        normalized
        for skill in _as_skill_list(skills)
        if (normalized := normalize_skill(skill))
    }


def skill_similarity(s1, s2):
    """Return conservative text similarity between two skill names."""
    n1 = normalize_skill(s1)
    n2 = normalize_skill(s2)
    if not n1 or not n2:
        return 0.0
    if n1 == n2:
        return 1.0
    if min(len(n1), len(n2)) < 5:
        return 0.0
    length_ratio = min(len(n1), len(n2)) / max(len(n1), len(n2))
    if length_ratio < 0.80:
        return 0.0
    return SequenceMatcher(None, n1, n2).ratio()


def _is_skill_match(candidate, required, threshold=0.90):
    """Check whether a candidate skill satisfies a required skill.

    MySQL experience includes practical SQL usage, so MySQL satisfies an SQL
    requirement. SQL alone does not prove experience with the MySQL database.
    """
    candidate_name = normalize_skill(candidate)
    required_name = normalize_skill(required)

    if not candidate_name or not required_name:
        return False
    if candidate_name == required_name:
        return True
    if required_name == "sql" and candidate_name == "mysql":
        return True
    return skill_similarity(candidate_name, required_name) >= threshold


def compare_skills(candidate_skills, required_skills, threshold=0.90):
    """Split required skills into matched and missing lists."""
    matched = []
    missing = []
    candidates = _as_skill_list(candidate_skills)

    for required in _as_skill_list(required_skills):
        if not normalize_skill(required):
            continue
        is_match = any(
            _is_skill_match(candidate, required, threshold)
            for candidate in candidates
        )
        (matched if is_match else missing).append(required)

    return matched, missing


def calculate_match_score(
    matched_count,
    required_count,
    candidate_skills,
    required_skills,
    preferred_skills=None,
):
    """Calculate a match score from 0 to 100."""
    if required_count <= 0:
        return 0.0

    base_score = (matched_count / required_count) * 100.0
    preferred = [
        skill for skill in _as_skill_list(preferred_skills)
        if normalize_skill(skill)
    ]
    preferred_bonus = 0.0

    if preferred:
        _, preferred_missing = compare_skills(candidate_skills, preferred)
        preferred_matched = len(preferred) - len(preferred_missing)
        preferred_bonus = (preferred_matched / len(preferred)) * 5.0

    return round(min(100.0, base_score + preferred_bonus), 2)


def match_resume_to_job(
    candidate_skills,
    job_required_skills=None,
    job_preferred_skills=None,
    job_requirements_text=None,
):
    """Compare candidate skills with a job and return score details."""
    required_skills = _as_skill_list(job_required_skills)
    preferred_skills = _as_skill_list(job_preferred_skills)

    if not required_skills and job_requirements_text:
        required_skills = extract_keywords(job_requirements_text)

    matched, missing = compare_skills(candidate_skills, required_skills)
    score = calculate_match_score(
        matched_count=len(matched),
        required_count=len(required_skills),
        candidate_skills=candidate_skills,
        required_skills=required_skills,
        preferred_skills=preferred_skills,
    )

    return {
        "match_score": score,
        "matched_skills": matched,
        "missing_skills": missing,
        "required_skill_total": len(required_skills),
    }


def extract_keywords(text):
    """Extract known technical and workplace skills from text locally."""
    if not text:
        return []

    text_lower = str(text).lower()
    found = []
    found_normalized = set()

    for skill in COMMON_SKILLS:
        words = re.split(r"[\s-]+", skill.lower())
        pattern_body = r"[\s-]+".join(re.escape(word) for word in words)
        pattern = r"(?<![a-z0-9])" + pattern_body + r"(?![a-z0-9])"

        if re.search(pattern, text_lower):
            normalized = normalize_skill(skill)
            if normalized and normalized not in found_normalized:
                found.append(skill)
                found_normalized.add(normalized)

    return found


def resolve_required_skills(job):
    """Resolve skills in priority order: job fields, AI analysis, requirements."""
    required = _as_skill_list(getattr(job, "skills_required", None))

    if not required:
        analysis = getattr(job, "ai_analysis", None) or {}
        if isinstance(analysis, dict):
            required = _as_skill_list(analysis.get("required_skills"))

    if not required:
        requirements = getattr(job, "requirements", None)
        if isinstance(requirements, str):
            required = extract_keywords(requirements)
        else:
            required = _as_skill_list(requirements)

    return required
