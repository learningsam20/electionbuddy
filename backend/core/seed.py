import os
import json
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend.models import User, Election, TimelinePhase, CampaignMessage, BoothResource
from backend.core.security import get_password_hash

logger = logging.getLogger(__name__)

def seed_db():
    """Seeds the database with initial users from seed_users.json."""
    db = SessionLocal()
    try:
        if db.query(User).first() is None:
            file_path = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'seed_users.json')
            if os.path.exists(file_path):
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
                    logger.info("Database seeded with default users.")
            else:
                logger.warning(f"Seed file not found at {file_path}")
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
    finally:
        db.close()

def seed_demo_data():
    """Populates the database with demo elections, phases, and messages."""
    db = SessionLocal()
    try:
        if db.query(Election).filter(Election.title == "Indian General Election 2026").first() is None:
            logger.info("Loading demo data...")
            election = Election(title="Indian General Election 2026", type="national")
            db.add(election)
            db.commit()
            db.refresh(election)

            phases = [
                TimelinePhase(
                    election_id=election.id, title="Voter Registration", order_idx=1, points=10,
                    start_date=datetime(2026, 1, 1), end_date=datetime(2026, 3, 1),
                    description="Ensure you are on the electoral roll.",
                    requirements_json=json.dumps(["Verify Voter ID", "Link Family Members"])
                ),
                TimelinePhase(
                    election_id=election.id, title="Candidate Nominations", order_idx=2, points=10,
                    start_date=datetime(2026, 3, 2), end_date=datetime(2026, 3, 15),
                    description="Candidates file their papers.",
                    requirements_json=json.dumps(["View 2 Candidate Profiles", "Read 1 Affidavit"])
                ),
                TimelinePhase(
                    election_id=election.id, title="Campaigning", order_idx=3, points=20,
                    start_date=datetime(2026, 3, 16), end_date=datetime(2026, 4, 15),
                    description="Political rallies and manifesto releases.",
                    requirements_json=json.dumps(["Summarize 2 Manifestos", "Take Ethics Quiz"])
                ),
                TimelinePhase(
                    election_id=election.id, title="Voting Day", order_idx=4, points=50,
                    start_date=datetime(2026, 4, 20), end_date=datetime(2026, 4, 20),
                    description="Head to your polling booth.",
                    requirements_json=json.dumps(["Verify Polling Booth Location", "Mark Vote Done"])
                ),
            ]
            db.add_all(phases)
            
            # Additional State/District Data
            pune_election = Election(title="Maharashtra State Assembly 2026", type="state", district="Pune")
            db.add(pune_election)
            db.commit()
            db.refresh(pune_election)
            
            # Booth Resources
            booths = [
                BoothResource(booth_id="PNE-01", district="Pune", name="Booth 1 - Central School", type="booth", latitude=18.5204, longitude=73.8567),
                BoothResource(booth_id="PNE-02", district="Pune", name="Booth 2 - Municipal Hall", type="booth", latitude=18.5300, longitude=73.8400),
            ]
            db.add_all(booths)
            
            db.commit()
            logger.info("Demo data loaded successfully.")
    except Exception as e:
        logger.error(f"Error loading demo data: {e}")
    finally:
        db.close()
