# AI Job Portal — Intelligent Recruitment Platform

A full-stack job marketplace that connects job seekers and recruiters through role-based dashboards, job management, applications, resume handling, and AI-assisted recommendations. Built with a **Django REST Framework** backend and a **React (Vite)** frontend.

## Overview

The platform provides separate experiences for **administrators**, **recruiters**, and **job seekers**. Authentication is JWT-based, while the backend exposes REST APIs consumed by the React frontend.

## Video Demo

[![Watch the demo](docs/screenshots/01-home.png)](docs/recordings/ai-jobportal-full-app-session.mp4)

Recorded walkthrough covering registration, recruiter job posting, resume upload, job recommendations, applying, and the admin console.

<video controls width="100%">
  <source src="docs/recordings/ai-jobportal-full-app-session.mp4" type="video/mp4" />
  View the demo recording: <a href="docs/recordings/ai-jobportal-full-app-session.mp4">ai-jobportal-full-app-session.mp4</a>
</video>

## Screenshots

### Home & Authentication

| | |
|---|---|
| ![AI-JobPortal home page](docs/screenshots/01-home.png) | ![Registration page](docs/screenshots/02-register.png) |
| **Home** — public landing page | **Registration** — create a recruiter or job seeker account |
| ![Login page](docs/screenshots/03-login.png) | |
| **Login** — sign in with application credentials | |

### Recruiter

| | |
|---|---|
| ![Recruiter dashboard](docs/screenshots/05-recruiter-dashboard.png) | ![Recruiter jobs list](docs/screenshots/06-recruiter-jobs.png) |
| **Recruiter Dashboard** — job stats and recent applicants | **Recruiter Jobs** — manage posted openings |
| ![Create job form](docs/screenshots/07-recruiter-new-job-filled.png) | ![Recruiter applicants](docs/screenshots/08-recruiter-applicants-after-post.png) |
| **Create Job** — post a new job with AI-assist | **Recruiter Applicants** — candidates and match data |

### Job Seeker

| | |
|---|---|
| ![Job seeker dashboard](docs/screenshots/11-seeker-dashboard.png) | ![Resume management](docs/screenshots/12-seeker-resume.png) |
| **Job Seeker Dashboard** — profile overview | **Resume Management** — upload and analyze resumes |
| ![Job recommendations](docs/screenshots/13-seeker-recommendations.png) | ![Browse jobs](docs/screenshots/14-seeker-browse-jobs.png) |
| **Job Recommendations** — ranked matches and skill gaps | **Browse Jobs** — search and filter open roles |
| ![Job details modal](docs/screenshots/15-seeker-job-detail-modal.png) | ![Job application modal](docs/screenshots/16-seeker-apply-modal.png) |
| **Job Details** — requirements and responsibilities | **Job Application** — apply with a resume and cover letter |
| ![Applications list](docs/screenshots/17-seeker-applications.png) | |
| **Applications** — track statuses and match scores | |

### Admin

| | |
|---|---|
| ![Admin dashboard](docs/screenshots/20-admin-dashboard.png) | ![Admin user management](docs/screenshots/21-admin-users.png) |
| **Admin Dashboard** — platform-wide statistics | **Admin User Management** — manage user accounts |

## Features

### Job seekers

- Account registration and authentication
- Job browsing
- Personalized job recommendations
- Resume management
- Application tracking and application details
- Profile management

### Recruiters

- Recruiter dashboard
- Create and manage job listings
- View job details
- Review applicants
- Manage recruitment workflows

### Administrators

- User management
- Job management
- Application management
- Administrative dashboard

## AI & Document Processing

The backend includes Google Gemini integration and document-processing dependencies for resume-oriented workflows. Resume uploads support PDF, DOC/DOCX, and TXT formats with a configured 10 MB upload limit.

Matching and analysis are AI-assisted and degrade gracefully: when no `GEMINI_API_KEY` is configured, the platform falls back to deterministic local matching and skill extraction so the core workflows keep working.

## Tech Stack

- **Frontend:** React 18, React Router, Axios, Vite
- **Backend:** Django 4.2+, Django REST Framework
- **Authentication:** Simple JWT
- **Database:** PostgreSQL
- **AI:** Google GenAI / Gemini
- **Documents:** PyPDF2, python-docx
- **Production:** Gunicorn, WhiteNoise

## Architecture

```text
ai_jobPortal/
├── backend/                      # Django REST framework API
│   ├── core/
│   │   ├── users/                # User accounts and roles
│   │   ├── jobs/                 # Job listings
│   │   ├── applications/         # Job applications
│   │   ├── resumes/              # Resume workflows
│   │   ├── matching/             # Matching / recommendation logic
│   │   ├── ai_services/          # Gemini client, prompts, text parsers
│   │   └── stats.py              # Role-aware dashboard statistics
│   ├── manage.py
│   └── requirements.txt
├── frontend/                     # React + Vite single-page app
│   ├── src/
│   │   ├── components/           # Shared layouts and UI
│   │   ├── pages/                # Admin, recruiter and seeker views
│   │   ├── api/                  # Axios API client modules
│   │   └── context/              # Auth and theme providers
│   └── package.json
├── .env.example
├── docs/                         # README assets (screenshots, recordings)
│   ├── screenshots/
│   └── recordings/
└── README.md
```

## API Overview

All endpoints live under the `/api/` prefix and (unless noted) require a `Bearer` JWT.

| Endpoint | Methods | Description |
|---|---|---|
| `/api/auth/register/` | POST | Create an account; returns user + JWT tokens |
| `/api/auth/login/` | POST | Obtain JWT tokens |
| `/api/auth/refresh/` | POST | Refresh the access token |
| `/api/auth/me/` | GET/PATCH | View / update the current profile |
| `/api/auth/change-password/` | POST | Change password |
| `/api/users/`, `/api/users/<id>/` | GET/POST, GET/PUT/DELETE | Admin user management |
| `/api/users/<id>/toggle-active/` | POST | Admin: activate/deactivate a user |
| `/api/jobs/`, `/api/jobs/<id>/` | CRUD | Job postings (recruiters/admins create; seekers read open jobs) with search & filters |
| `/api/applications/`, `/api/applications/<id>/` | CRUD | Applications with match scoring |
| `/api/applications/my_applications/` | GET | Job seeker: own applications |
| `/api/applications/<id>/withdraw/` | POST | Withdraw an application |
| `/api/applications/<id>/analyze_with_ai/` | POST | Recruiter/admin: AI analysis of an application |
| `/api/resumes/` | CRUD | Resume upload & management |
| `/api/resumes/<id>/analyze/` | POST | AI / local resume analysis |
| `/api/resumes/<id>/set_primary/` | POST | Mark resume as primary |
| `/api/ai/jobs/` | POST | Analyze a job description (skills, requirements) |
| `/api/ai/resumes/` | POST | Analyze a resume into structured data |
| `/api/ai/match/` | POST | Match a resume against a job |
| `/api/matching/recommendations/` | POST | Job seeker: ranked job recommendations |
| `/api/matching/skill-gap/` | POST | Skill-gap analysis for a job |
| `/api/matching/applicants/` | GET | Recruiter/admin: applicants with match data |
| `/api/stats/dashboard/` | GET | Role-aware dashboard statistics |

## Authentication & Security

- JWT authentication with short-lived access tokens and refresh tokens
- Authenticated API permissions by default
- Role-restricted admin, recruiter, and seeker routes
- Environment-based secrets and database configuration
- Configurable upload validation and size limits

## Local Development

### Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Configure the environment using `.env.example` before running the application.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

For a production build:

```bash
npm run build
```

## Environment Variables

The project provides `.env.example` with configuration for Django, PostgreSQL, the Gemini API, allowed hosts, and the frontend API URL. Never commit real secrets or production credentials.

## Documentation

The rendered assets for this README — screenshots and the video demo — live in `docs/`. The full raw capture session (including a WebM source) is available under `captures/`.

## Project Status

The repository contains a functional multi-role application structure with dedicated admin, recruiter, and job-seeker workflows. Deployment and environment-specific settings should be configured separately for production.

## License

No license file is currently defined in the repository. Please contact the repository owner for reuse or licensing questions.