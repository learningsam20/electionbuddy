# ElectionBuddy - Interactive Election Assistant

> An AI-powered full-stack platform for democratic participation, voter education, and election management.

---

## Project Structure

`
electionbuddy/
├── backend/
│   ├── core/              # Security (JWT), telemetry exporter
│   ├── routers/           # FastAPI route handlers (14 routers)
│   │   ├── auth.py        # Login, register, JWT
│   │   ├── timeline.py    # Election phases + progress tracking
│   │   ├── citizen.py     # Citizen-specific actions
│   │   ├── candidate.py   # Candidate profile & progress
│   │   ├── candidate_ext.py # Extended candidate features
│   │   ├── officer_ext.py # Officer command centre
│   │   ├── officer.py     # Officer endpoints
│   │   ├── admin_ext.py   # Admin telemetry & management
│   │   ├── admin.py       # Admin user/role management
│   │   ├── family.py      # Family group linking
│   │   ├── game.py        # Gamification & leaderboard helpers
│   │   ├── quiz.py        # Quiz generation
│   │   ├── gemini.py      # Gemini AI chat endpoints
│   │   ├── stats.py       # Statistics aggregation
│   │   └── leaderboard.py # User rankings
│   ├── models.py          # SQLAlchemy ORM models
│   ├── schemas.py         # Pydantic request/response schemas
│   ├── database.py        # DB engine & session factory
│   ├── main.py            # FastAPI app, middleware, startup seeding
│   ├── seed_data.py       # Standalone seeding script
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/    # Shared UI components
│   │   ├── pages/         # Route-level pages
│   │   ├── store/         # Zustand global state
│   │   └── App.jsx        # Router setup
│   ├── package.json
│   └── vite.config.js
├── data/                  # SQLite DB file (gitignored) + seed data
├── Dockerfile             # Multi-stage production build
├── start.ps1              # Windows dev launcher
└── .env.example           # Environment variable reference
`

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
