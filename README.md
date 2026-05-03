# ElectionBuddy - Interactive Election Assistant

> An AI-powered full-stack platform for democratic participation, voter education, and election management.

---

## Project Structure

```
electionbuddy/
├── backend/               # FastAPI Python Backend
│   ├── core/              # Config, Security (JWT), Seeding
│   ├── routers/           # FastAPI route handlers (RBAC optimized)
│   ├── models.py          # SQLAlchemy ORM models
│   ├── schemas.py         # Pydantic V2 request/response schemas
│   └── database.py        # DB engine & session factory
├── frontend/              # Vite + React Frontend
│   ├── src/
│   │   ├── components/    # Accessible (ARIA) UI components
│   │   ├── pages/         # Dashboard & Role-specific views
│   │   └── store/         # Zustand global state
├── data/                  # SQLite DB file + JSON seed data
├── docs/                  # Architecture & feature documentation
├── infra/                 # Docker & Firebase configuration
├── scripts/               # Management & testing scripts
├── start.ps1              # Windows dev launcher (Root entry)
├── test_report.md         # Comprehensive quality & test report
└── .env.example           # Environment variable template
```

---

## Docker

Multi-stage build with Node 20 and Python 3.12.

### Build
`ash
docker build --build-arg VITE_API_BASE_URL=/ -t electionbuddy:latest .
`

### Run
`ash
docker run -p 8573:8573 -e GEMINI_API_KEY=your_key -e SECRET_KEY=your_secret electionbuddy:latest
`
