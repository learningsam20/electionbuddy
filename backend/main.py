from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import json
from dotenv import load_dotenv

from backend.database import engine, Base, SessionLocal
from backend.routers import auth, gemini, stats, quiz, leaderboard, timeline, candidate, admin
from backend.models import User, Election, TimelinePhase
from backend.core.security import get_password_hash

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

# Create database tables
Base.metadata.create_all(bind=engine)

from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from backend.core.telemetry_exporter import SQLiteSpanExporter

app = FastAPI(
    title="DemocraPlay API",
    description="Backend for the DemocraPlay interactive election assistant.",
    version="1.0.0"
)

# Configure OpenTelemetry Standard Tracer
provider = TracerProvider()
processor = BatchSpanProcessor(SQLiteSpanExporter())
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)

# Instrument the FastAPI app natively with OTel
FastAPIInstrumentor.instrument_app(app)

# Setup CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seed Database
def seed_db():
    db = SessionLocal()
    if db.query(User).first() is None:
        file_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'seed_users.json')
        try:
            with open(file_path, 'r') as f:
                users_data = json.load(f)
                for u in users_data:
                    user = User(
                        email=u["email"],
                        hashed_password=get_password_hash(u["password"]),
                        role=u["role"],
                        name=u["name"],
                        district=u["district"],
                        assembly_constituency=u["assembly_constituency"],
                        age=u.get("age"),
                        gender=u.get("gender"),
                        language=u.get("language", "en"),
                        voter_id=u.get("voter_id"),
                        family_group_id=u.get("family_group_id")
                    )
                    db.add(user)
                db.commit()
                print("Database seeded with default users.")
        except Exception as e:
            print(f"Error seeding database: {e}")
    db.close()

def seed_demo_data():
    db = SessionLocal()
    if db.query(Election).first() is None:
        try:
            print("Loading demo data...")
            election = Election(title="General Election 2024", type="national")
            db.add(election)
            db.commit()
            db.refresh(election)

            phases = [
                TimelinePhase(election_id=election.id, title="Voter Registration", description="Register to vote before the deadline and verify your details on the electoral roll.", order_idx=1, points=10),
                TimelinePhase(election_id=election.id, title="Candidate Nominations", description="Candidates file their nomination papers and affidavits.", order_idx=2, points=10),
                TimelinePhase(election_id=election.id, title="Campaigning", description="Candidates campaign for votes. Stay informed about their manifestos.", order_idx=3, points=10),
                TimelinePhase(election_id=election.id, title="Voting Day", description="Cast your vote at your designated polling station.", order_idx=4, points=50),
                TimelinePhase(election_id=election.id, title="Results", description="Counting of votes and declaration of election results.", order_idx=5, points=10),
            ]
            db.add_all(phases)
            db.commit()
            print("Demo data loaded successfully.")
        except Exception as e:
            print(f"Error loading demo data: {e}")
    else:
        print("Demo data already exists, skipping.")
    db.close()

@app.on_event("startup")
def on_startup():
    seed_db()
    if os.getenv("LOAD_DEMO_DATA") == "1":
        seed_demo_data()

# Include Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(gemini.router, prefix="/api/v1/chat", tags=["gemini"])
app.include_router(stats.router, prefix="/api/v1/stats", tags=["stats"])
app.include_router(quiz.router, prefix="/api/v1/quiz", tags=["quiz"])
app.include_router(leaderboard.router, prefix="/api/v1/leaderboard", tags=["leaderboard"])
app.include_router(timeline.router, prefix="/api/v1/timeline", tags=["timeline"])
app.include_router(candidate.router, prefix="/api/v1/candidate", tags=["candidate"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "DemocraPlay API is running"}

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
