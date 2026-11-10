import os
import re
import requests
from datetime import datetime, timedelta, timezone


# Only show external listings posted within this many days.
JOB_POSTED_WITHIN_DAYS = 60


FRESHER_PHRASES = [
    "fresher",
    "freshers",
    "entry level",
    "entry-level",
    "graduate trainee",
    "no experience",
    "without experience",
    "0 years of experience",
    "zero years of experience",
]

FRESHER_TITLE_KEYWORDS = [
    "junior",
    "trainee",
    "intern",
    "internship",
    "graduate",
]

SENIOR_TITLE_KEYWORDS = [
    "senior",
    "lead",
    "principal",
    "manager",
    "architect",
]

YEAR_UNIT = r"(?:years?|yrs?)"
ROLE_NOUN = r"(?:developers?|engineers?|programmers?|candidates?|professionals?)"

EXPERIENCE_RANGE_PATTERN = re.compile(
    rf"\b(\d+(?:\.\d+)?)\s*(?:-|–|—|to)\s*"
    rf"(\d+(?:\.\d+)?)\s*{YEAR_UNIT}\b",
    re.IGNORECASE,
)

EXPERIENCE_SINGLE_PATTERNS = [
    re.compile(
        rf"\bminimum\s+(\d+(?:\.\d+)?)\s*{YEAR_UNIT}\b",
        re.IGNORECASE,
    ),
    re.compile(
        rf"\bat\s+least\s+(\d+(?:\.\d+)?)\s*{YEAR_UNIT}\b",
        re.IGNORECASE,
    ),
    re.compile(
        rf"\b(\d+(?:\.\d+)?)\s*\+?\s*{YEAR_UNIT}"
        rf"(?:\s+of)?\s+(?:total\s+)?experience\b",
        re.IGNORECASE,
    ),
    re.compile(
        rf"\bexperience\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*{YEAR_UNIT}\b",
        re.IGNORECASE,
    ),
    # Matches "Looking for 2 Years of Java Developers".
    re.compile(
        rf"\b(\d+(?:\.\d+)?)\s*{YEAR_UNIT}"
        rf"(?:\s+of)?\s+(?:[a-zA-Z+#.]+\s+){{0,5}}{ROLE_NOUN}\b",
        re.IGNORECASE,
    ),
    # Matches "Java developer with 2 years" and similar wording.
    re.compile(
        rf"\b{ROLE_NOUN}\b.{{0,60}}?\b(?:with|having|of)\s+"
        rf"(\d+(?:\.\d+)?)\s*{YEAR_UNIT}\b",
        re.IGNORECASE,
    ),
]

EXPERIENCED_ROLE_PATTERN = re.compile(
    r"\bexperienced\s+(?:(?:python|java|software|backend|frontend|full[\s-]?stack)\s+)?"
    r"(?:developer|engineer|programmer|professional|candidate|consultant)\b",
    re.IGNORECASE,
)

SENIOR_DESCRIPTION_PATTERN = re.compile(
    r"\b(?:senior|lead|principal|architect)\s+"
    r"(?:(?:python|java|software|backend|frontend|full[\s-]?stack)\s+)?"
    r"(?:developer|engineer|programmer|role|position)\b",
    re.IGNORECASE,
)


def _required_experience_years(text):
    """Return the highest explicit experience requirement found, or None."""
    values = []

    for match in EXPERIENCE_RANGE_PATTERN.finditer(text):
        try:
            # For 2-4 years, the minimum requirement is 2.
            values.append(float(match.group(1)))
        except (TypeError, ValueError):
            continue

    for pattern in EXPERIENCE_SINGLE_PATTERNS:
        for match in pattern.finditer(text):
            try:
                values.append(float(match.group(1)))
            except (TypeError, ValueError):
                continue

    return max(values) if values else None


def classify_experience(job):
    """Classify a job using explicit experience requirements and role wording."""
    title = (job.get("title") or "").lower()
    description = (job.get("description") or "").lower()
    text = f"{title} {description}"

    if any(keyword in title for keyword in SENIOR_TITLE_KEYWORDS):
        return "Experienced"

    if SENIOR_DESCRIPTION_PATTERN.search(description):
        return "Experienced"

    # Explicit years take priority over generic words such as "fresher" or "junior".
    required_years = _required_experience_years(text)
    if required_years is not None:
        return "Fresher" if required_years <= 1 else "Experienced"

    if EXPERIENCED_ROLE_PATTERN.search(description):
        return "Experienced"

    if any(phrase in text for phrase in FRESHER_PHRASES):
        return "Fresher"

    if any(keyword in title for keyword in FRESHER_TITLE_KEYWORDS):
        return "Fresher"

    return "Experience not specified"


def _parse_job_date(job):
    """Parse Adzuna's created timestamp. Return None when missing or invalid."""
    created = job.get("created")

    if not created:
        return None

    try:
        parsed = datetime.fromisoformat(str(created).replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc)
    except (TypeError, ValueError):
        return None


def _is_recent_job(job, days=JOB_POSTED_WITHIN_DAYS, now=None):
    """Return True only when the listing has a valid date within the recent window."""
    posted_at = _parse_job_date(job)
    if posted_at is None:
        return False

    current_time = now or datetime.now(timezone.utc)
    cutoff = current_time - timedelta(days=days)
    return cutoff <= posted_at <= current_time


def _build_search_queries(query):
    """Build related searches to find more entry-level job listings."""
    base = (query or "").strip()
    base = re.sub(
        r"\b(freshers?|entry[\s-]?level|junior|trainee|internship|intern)\b",
        "",
        base,
        flags=re.IGNORECASE,
    )
    base = re.sub(r"\s+", " ", base).strip()

    if not base:
        return []

    lowered = base.lower()

    if "java" in lowered:
        skill = "Java"
        return [
            base,
            f"{skill} Fresher",
            f"Junior {skill} Developer",
            f"{skill} Trainee",
            f"Entry Level {skill} Developer",
        ]

    if "python" in lowered:
        skill = "Python"
        return [
            base,
            f"{skill} Fresher",
            f"Junior {skill} Developer",
            f"{skill} Trainee",
            f"Entry Level {skill} Developer",
        ]

    return [
        base,
        f"{base} Fresher",
        f"Junior {base}",
        f"{base} Trainee",
        f"Entry Level {base}",
    ]


def search_adzuna_jobs(query, location="Bengaluru", page=1):
    app_id = os.getenv("ADZUNA_APP_ID")
    app_key = os.getenv("ADZUNA_APP_KEY")

    if not app_id or not app_key:
        raise ValueError("Adzuna API credentials are missing.")

    url = f"https://api.adzuna.com/v1/api/jobs/in/search/{page}"
    search_queries = _build_search_queries(query)

    if not search_queries:
        return []

    combined_jobs = []
    seen_jobs = set()
    last_error = None

    for search_term in search_queries:
        params = {
            "app_id": app_id,
            "app_key": app_key,
            "results_per_page": 50,
            "what": search_term,
            "where": location,
            "content-type": "application/json",
        }

        try:
            response = requests.get(url, params=params, timeout=20)
            response.raise_for_status()
            data = response.json()
        except requests.RequestException as exc:
            last_error = exc
            continue

        for job in data.get("results", []):
            # Exclude listings older than 60 days or without a valid posted date.
            if not _is_recent_job(job):
                continue

            unique_key = (
                str(job.get("id") or "").strip()
                or str(job.get("redirect_url") or "").strip()
            )

            if not unique_key:
                unique_key = "|".join([
                    str(job.get("title") or "").strip().lower(),
                    str((job.get("company") or {}).get("display_name") or "").strip().lower(),
                    str((job.get("location") or {}).get("display_name") or "").strip().lower(),
                ])

            if unique_key in seen_jobs:
                continue

            seen_jobs.add(unique_key)
            job["experience_level"] = classify_experience(job)
            job["matched_search_term"] = search_term
            job["posted_date"] = _parse_job_date(job).isoformat()
            combined_jobs.append(job)

    if not combined_jobs and last_error is not None:
        raise last_error

    priority = {
        "Fresher": 0,
        "Experience not specified": 1,
        "Experienced": 2,
    }

    # Sort by experience category first, then newest posting date.
    combined_jobs.sort(
        key=lambda job: (
            priority.get(job.get("experience_level"), 1),
            _parse_job_date(job) or datetime.min.replace(tzinfo=timezone.utc),
        ),
        reverse=False,
    )

    # Keep experience groups in order, but show newest jobs first inside each group.
    combined_jobs.sort(
        key=lambda job: (
            priority.get(job.get("experience_level"), 1),
            -_parse_job_date(job).timestamp(),
        )
    )

    return combined_jobs
