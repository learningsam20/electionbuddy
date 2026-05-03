import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

from backend.database import engine, Base
from backend.routers import auth, gemini, stats, quiz, leaderboard, timeline, candidate, admin, citizen, candidate_ext, officer_ext, admin_ext, family, game
from backend.core.config import settings
from backend.core.seed import seed_db, seed_demo_data

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    seed_db()
    if settings.LOAD_DEMO_DATA:
        seed_demo_data()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend for the ElectionBuddy interactive election assistant.",
    version=settings.VERSION,
    lifespan=lifespan
)

# Late instrumentation and middleware
FastAPIInstrumentor.instrument_app(app)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
from fastapi.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler to catch all unhandled errors.
    Returns a clean JSON response instead of a raw traceback.
    """
    return JSONResponse(
        status_code=500,
        content={"status": "error", "message": "An unexpected server error occurred. Please try again later.", "detail": str(exc) if os.getenv("DEBUG") == "1" else None},
    )

# Include Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(gemini.router, prefix="/api/v1/chat", tags=["gemini"])
app.include_router(stats.router, prefix="/api/v1/stats", tags=["stats"])
app.include_router(quiz.router, prefix="/api/v1/quiz", tags=["quiz"])
app.include_router(leaderboard.router, prefix="/api/v1/leaderboard", tags=["leaderboard"])
app.include_router(timeline.router, prefix="/api/v1/timeline", tags=["timeline"])
app.include_router(candidate.router, prefix="/api/v1/candidate", tags=["candidate"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])
app.include_router(citizen.router, prefix="/api/v1/citizen", tags=["citizen"])
app.include_router(candidate_ext.router, prefix="/api/v1/candidate/ext", tags=["candidate-ext"])
app.include_router(officer_ext.router, prefix="/api/v1/officer/ext", tags=["officer-ext"])
app.include_router(admin_ext.router, prefix="/api/v1/admin/ext", tags=["admin-ext"])
app.include_router(family.router, prefix="/api/v1/family", tags=["family"])
app.include_router(game.router, prefix="/api/v1/game", tags=["game"])

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "ElectionBuddy API is running"}

# Mount React App (if built)
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(static_dir, "assets")), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        # Serve index.html for all other routes to let React Router handle them
        return FileResponse(os.path.join(static_dir, "index.html"))
