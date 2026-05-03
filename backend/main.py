from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import json
from datetime import datetime
from dotenv import load_dotenv

from backend.database import engine, Base, SessionLocal
from backend.routers import auth, gemini, stats, quiz, leaderboard, timeline, candidate, admin, citizen, candidate_ext, officer_ext, admin_ext, family, game
from backend.models import User, Election, TimelinePhase, CampaignMessage, BoothResource
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
    title="ElectionBuddy API",
    description="Backend for the ElectionBuddy interactive election assistant.",
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
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

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
    if db.query(Election).filter(Election.title == "Indian General Election 2026").first() is None:
        try:
            print("Loading demo data...")
            election = Election(title="Indian General Election 2026", type="national")
            db.add(election)
            db.commit()
            db.refresh(election)

            phases = [
                TimelinePhase(
                    election_id=election.id, 
                    title="Voter Registration", 
                    description="Ensure you are on the electoral roll. Verify your details and download your digital voter slip.", 
                    order_idx=1, points=10,
                    start_date=datetime(2026, 1, 1), end_date=datetime(2026, 3, 1),
                    requirements_json=json.dumps(["Verify Voter ID", "Link Family Members"])
                ),
                TimelinePhase(
                    election_id=election.id, 
                    title="Candidate Nominations", 
                    description="Candidates file their papers. Review affidavits to see their education, assets, and criminal records.", 
                    order_idx=2, points=10,
                    start_date=datetime(2026, 3, 2), end_date=datetime(2026, 3, 15),
                    requirements_json=json.dumps(["View 2 Candidate Profiles", "Read 1 Affidavit"])
                ),
                TimelinePhase(
                    election_id=election.id, 
                    title="Campaigning", 
                    description="Political rallies and manifesto releases. Use the AI assistant to compare party promises.", 
                    order_idx=3, points=20,
                    start_date=datetime(2026, 3, 16), end_date=datetime(2026, 4, 15),
                    requirements_json=json.dumps(["Summarize 2 Manifestos", "Take Ethics Quiz"])
                ),
                TimelinePhase(
                    election_id=election.id, 
                    title="Voting Day", 
                    description="Head to your polling booth. Check live wait times on the app to avoid long queues.", 
                    order_idx=4, points=50,
                    start_date=datetime(2026, 4, 20), end_date=datetime(2026, 4, 20),
                    requirements_json=json.dumps(["Verify Polling Booth Location", "Mark Vote Done"])
                ),
            ]
            db.add_all(phases)
            
            # Add a State Assembly Election for Pune
            pune_election = Election(title="Maharashtra State Assembly 2026", type="state", district="Pune")
            db.add(pune_election)
            db.commit()
            db.refresh(pune_election)
            
            pune_phases = [
                TimelinePhase(
                    election_id=pune_election.id, 
                    title="Draft Electoral Roll", 
                    description="Draft rolls published for Pune district. File claims/objections.", 
                    order_idx=1, points=15,
                    start_date=datetime(2026, 6, 1), end_date=datetime(2026, 7, 1),
                    requirements_json=json.dumps(["Check Name in Draft Roll"])
                ),
                TimelinePhase(
                    election_id=pune_election.id, 
                    title="Model Code of Conduct", 
                    description="MCC comes into effect. Report any violations using the 'Report' tool.", 
                    order_idx=2, points=20,
                    start_date=datetime(2026, 8, 1), end_date=datetime(2026, 10, 15),
                    requirements_json=json.dumps(["Read MCC Guidelines"])
                ),
            ]
            db.add_all(pune_phases)
            # Add Booth Resources for Pune
            booths = [
                BoothResource(booth_id="PNE-01", district="Pune", name="Booth 1 - Central School", type="booth", latitude=18.5204, longitude=73.8567),
                BoothResource(booth_id="PNE-01", district="Pune", name="Central Control Room", type="control_room", latitude=18.5210, longitude=73.8575),
                BoothResource(booth_id="PNE-01", district="Pune", name="Guard Room A", type="guard_room", latitude=18.5195, longitude=73.8560),
                BoothResource(booth_id="PNE-02", district="Pune", name="Booth 2 - Municipal Hall", type="booth", latitude=18.5300, longitude=73.8400),
                BoothResource(booth_id="PNE-02", district="Pune", name="Safety Outpost", type="guard_room", latitude=18.5305, longitude=73.8405),
            ]
            db.add_all(booths)
            
            # Add Pending Campaign Messages
            candidate = db.query(User).filter(User.role == "candidate").first()
            if candidate:
                msgs = [
                    CampaignMessage(
                        candidate_id=candidate.id,
                        content="Working for a better tomorrow. Join our rally at Kasba Peth!",
                        media_url="https://www.w3schools.com/html/mov_bbb.mp4",
                        status="pending",
                        ai_review_json=json.dumps({
                            "safety_score": 0.95,
                            "comments": "Content is positive. No MCC violations found. Highlights development work.",
                            "flagged_keywords": []
                        })
                    ),
                    CampaignMessage(
                        candidate_id=candidate.id,
                        content="Vote for us to get free vouchers! (Potentially violating MCC)",
                        status="pending",
                        ai_review_json=json.dumps({
                            "safety_score": 0.35,
                            "comments": "Warning: Offering financial incentives/vouchers violates the Model Code of Conduct section 1.1.",
                            "flagged_keywords": ["free vouchers", "incentive"]
                        })
                    )
                ]
                db.add_all(msgs)

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
