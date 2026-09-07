# Enrollify

> Enrollment, sorted before the deadline hits.

Enrollify is an enrollment planning tool for MAJU students. It takes the course sections a student is considering, removes schedules with time conflicts, scores the remaining combinations against personal preferences, and returns the best options in a visual weekly timetable.

The project is split into a Next.js web app and a FastAPI service. It also includes an AI-assisted timetable screenshot parser so section data can be extracted from an image instead of entered by hand.

## Product Preview

| Landing page | Dark theme | Planner input |
| --- | --- | --- |
| ![Enrollify light theme](Screenshots/Screenshot%202026-09-07%20154300.png) | ![Enrollify dark theme](Screenshots/Screenshot%202026-09-07%20154310.png) | ![Planner section input](Screenshots/Screenshot%202026-09-07%20154321.png) |

## What It Does

- **Builds conflict-free schedules** by choosing one section for each required course.
- **Ranks schedule options** using preferences such as preferred days off, maximum daily classes, gap limits, instructor exclusions, and preferred sections.
- **Displays a weekly timetable** with color-coded courses, meeting times, rooms, and section labels.
- **Accepts pasted section text** and parses common course/section formats in the planner.
- **Parses timetable screenshots** through the Gemini API and converts them into structured course data.
- **Stores selected plans** through the API for future semester views.
- **Collects product feedback** with a rating and optional comment.
- **Supports light and dark themes** with a responsive interface.

The CGPA Calculator and MAJU Bot are visible as planned features in the current product interface, but are not implemented yet.

## How Scheduling Works

1. Group available sections by course code.
2. Use backtracking to choose one section per required course.
3. Prune combinations as soon as two sections overlap on the same day.
4. Remove combinations that violate hard constraints such as maximum gaps, maximum classes per day, or preferred days off.
5. Score and rank the remaining schedules, returning up to four plans with an explanation for each result.

## Tech Stack

### Frontend

- Next.js 16 with the App Router
- React 19
- TypeScript
- Tailwind CSS 4
- `next/font` with Space Grotesk and Inter

### Backend

- FastAPI 0.115
- Python 3.11 or 3.12
- Pydantic 2
- SQLAlchemy 2
- PostgreSQL via Psycopg
- Google Gemini for screenshot parsing
- Pytest for solver tests

## Repository Structure

```text
enrollify/
├── apps/
│   ├── api/
│   │   ├── app/
│   │   │   ├── db/          # SQLAlchemy engine and database models
│   │   │   ├── models/      # Pydantic course and schedule models
│   │   │   ├── parsing/     # Gemini timetable screenshot parser
│   │   │   ├── routers/     # Enrollment, plans, parsing, and review APIs
│   │   │   └── solver/      # Backtracking search and preference scoring
│   │   └── tests/            # Solver tests
│   └── web/
│       ├── app/
│       │   ├── admin/       # Review administration view
│       │   └── planner/     # Interactive schedule planner
│       └── public/
├── Screenshots/              # Product screenshots used in this README
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 20 or newer
- Python 3.11 or 3.12
- PostgreSQL, or another SQLAlchemy-compatible database configured through `DATABASE_URL`
- A Google Gemini API key for screenshot parsing

### 1. Start the API

From `apps/api`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create `apps/api/.env`:

```env
DATABASE_URL=postgresql+psycopg://postgres:password@localhost:5432/enrollify
GEMINI_API_KEY=your_gemini_api_key
ADMIN_SECRET_KEY=choose_a_private_admin_key
```

Run the development server:

```powershell
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://127.0.0.1:8000`. Interactive OpenAPI documentation is available at [`/docs`](http://127.0.0.1:8000/docs), and the health check is [`/health`](http://127.0.0.1:8000/health).

### 2. Start the web app

In a second terminal, from `apps/web`:

```powershell
npm install
```

Optionally create `apps/web/.env.local` when the API is not running on the default address:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Start the frontend:

```powershell
npm run dev
```

Open [`http://localhost:3000`](http://localhost:3000).

## API Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | API health check |
| `POST` | `/enrollment/generate-plans` | Generate and rank conflict-free plans |
| `POST` | `/parsing/screenshot` | Parse an uploaded timetable image |
| `POST` | `/plans/save` | Save a selected plan |
| `GET` | `/plans/user/{user_id}` | Retrieve saved plans for a user |
| `POST` | `/reviews` | Submit a rating and optional comment |
| `GET` | `/reviews/admin?key=...` | Retrieve reviews with the admin secret |

The complete request and response schemas are available through FastAPI's generated documentation at `/docs`.

## Testing and Quality Checks

Run the backend solver tests from `apps/api`:

```powershell
pytest
```

Run the frontend lint check from `apps/web`:

```powershell
npm run lint
```

Create a production frontend build with:

```powershell
npm run build
npm run start
```

## Deployment Notes

- Deploy the Next.js app from `apps/web` and set `NEXT_PUBLIC_API_URL` to the public API URL.
- Deploy the FastAPI app from `apps/api` with Python 3.11 or 3.12.
- Configure `DATABASE_URL`, `GEMINI_API_KEY`, and `ADMIN_SECRET_KEY` in the API environment. Do not commit `.env` files or expose server-side secrets to the frontend.
- Update the API CORS allowlist in `apps/api/app/main.py` when using a frontend domain other than the currently configured local and Netlify origins.

## Roadmap

- Import course data directly from university enrollment sources.
- Add the CGPA calculator.
- Add the MAJU Bot campus assistant.
- Add authenticated student accounts and a polished saved-plans workflow.
- Expand test coverage for API routes, parsing failures, and preference scoring.

## Project Status

Enrollify is an active work in progress built for MAJU students. The enrollment planner and its scheduling engine are the current focus; other product areas are intentionally marked as coming soon while the core workflow is developed.

## License

No open-source license has been specified yet.
