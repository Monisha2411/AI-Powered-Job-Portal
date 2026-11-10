"""JSON schemas and prompts for structured AI analysis.

These schemas ensure Gemini returns machine-parseable, validated JSON
instead of free-form text, which lets us rely on our own application code
for skill comparison, gap calculation, scoring, ranking, and filtering.
"""

RESUME_ANALYSIS_SCHEMA = {
    "type": "object",
    "properties": {
        "full_name": {"type": "string"},
        "email": {"type": "string"},
        "phone": {"type": "string"},
        "location": {"type": "string"},
        "summary": {"type": "string"},
        "skills": {
            "type": "array",
            "items": {"type": "string"},
            "description": "List of skills, technologies, tools, frameworks, languages"
        },
        "education": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "degree": {"type": "string"},
                    "institution": {"type": "string"},
                    "years": {"type": "string"}
                }
            }
        },
        "experience": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "company": {"type": "string"},
                    "duration": {"type": "string"},
                    "description": {"type": "string"}
                }
            }
        },
        "certifications": {
            "type": "array",
            "items": {"type": "string"}
        }
    }
}

JOB_ANALYSIS_SCHEMA = {
    "type": "object",
    "properties": {
        "required_skills": {
            "type": "array",
            "items": {"type": "string"}
        },
        "preferred_skills": {
            "type": "array",
            "items": {"type": "string"}
        },
        "key_requirements": {
            "type": "array",
            "items": {"type": "string"}
        },
        "experience_level": {"type": "string"},
        "qualifications": {
            "type": "array",
            "items": {"type": "string"}
        }
    }
}


RESUME_ANALYSIS_PROMPT = """You are an expert resume parser. Extract structured information from the following resume text.

Return ONLY valid JSON matching this schema:
{schema}

Resume Text:
---
{resume_text}
---

Extract all skills, education, work experience, and certifications accurately. Do not invent information. If something is not present, return an empty string or empty array."""


JOB_ANALYSIS_PROMPT = """You are an expert technical recruiter. Analyze the following job description and extract the key skills and requirements.

Return ONLY valid JSON matching this schema:
{schema}

Job Description:
---
{job_description}
---

Extract required skills (must-have), preferred skills (nice-to-have), key requirements, experience level, and qualifications."""


JOB_APPLICATION_MATCH_PROMPT = """You are an expert hiring assistant. Compare the candidate's resume against the job description and provide a detailed match analysis.

Job Description:
---
{job_description}
---

Candidate Resume:
---
{resume_text}
---

Candidate Extracted Skills:
{candidate_skills}

Return ONLY valid JSON matching this schema:
{schema}

The match_score should be an integer from 0 to 100 representing overall suitability. Provide concise and accurate skill matches and gaps."""


JOB_APPLICATION_MATCH_SCHEMA = {
    "type": "object",
    "properties": {
        "match_score": {"type": "integer"},
        "matched_skills": {
            "type": "array",
            "items": {"type": "string"}
        },
        "missing_skills": {
            "type": "array",
            "items": {"type": "string"}
        },
        "strengths": {
            "type": "array",
            "items": {"type": "string"}
        },
        "gaps": {
            "type": "array",
            "items": {"type": "string"}
        },
        "recommendation": {"type": "string"}
    }
}


RESUME_VALIDATION_SCHEMA = {
    "type": "object",
    "properties": {
        "is_resume": {"type": "boolean"},
        "reason": {"type": "string"}
    }
}


RESUME_VALIDATION_PROMPT = """You are an expert document classifier. Determine whether the following document text is a person's resume/CV used for a job application.

A resume/CV typically contains sections such as contact details, a professional summary, work experience, education, and skills.

The document is NOT a valid resume if it is, for example:
- an image-only or scanned file with no readable text
- a presentation or slides (PPT) deck
- a video transcript or script
- an academic paper, article, invoice, contract, report, or other non-resume document
- empty or unreadable content

Return ONLY valid JSON matching this schema:
{schema}

Document Text:
---
{document_text}
---

Respond with "is_resume" = true only if the document is genuinely a resume/CV. Always provide a clear, friendly "reason" explaining the decision."""


RESUME_JOB_MATCH_SCHEMA = {
    "type": "object",
    "properties": {
        "match_score": {"type": "integer"},
        "matched_skills": {
            "type": "array",
            "items": {"type": "string"}
        },
        "missing_skills": {
            "type": "array",
            "items": {"type": "string"}
        },
        "summary": {"type": "string"}
    }
}
