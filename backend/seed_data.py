import os
import json
import sys
from sqlalchemy.orm import Session
from datetime import datetime

# Add the project root to sys.path to allow imports from backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.database import SessionLocal, engine
from backend.models import User, CandidateProfile, VoterIssue, SystemAlert, CloudUsage, AuditLog, Telemetry, Base, Election, TimelinePhase
from backend.core.security import get_password_hash

def seed_base_data(db: Session):
    # Seed Users
    if db.query(User).count() == 0:
        file_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'seed_users.json')
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
                    family_group_id=u.get("family_group_id"),
                    maturity_level=5 if u["role"] == "citizen" else None
                )
                db.add(user)
        db.commit()
        print("Users seeded.")

    # Seed Elections
    if db.query(Election).count() == 0:
        election = Election(title="General Election 2024", type="national")
        db.add(election)
        db.commit()
        db.refresh(election)
        
        phases = [
            TimelinePhase(election_id=election.id, title="Voter Registration", description="Ensure you are on the voter list.", order_idx=1, points=10, target_role="citizen", requirements_json=json.dumps(["Verify Voter ID"])),
            TimelinePhase(election_id=election.id, title="Candidate Nomination", description="Candidates must file their papers.", order_idx=2, points=50, target_role="candidate", requirements_json=json.dumps(["Submit Manifesto"])),
            TimelinePhase(election_id=election.id, title="Election Awareness", description="Complete the maturity assessment.", order_idx=3, points=20, target_role="both", requirements_json=json.dumps(["Complete Maturity Quiz"])),
            TimelinePhase(election_id=election.id, title="Voting Day", description="Cast your vote at your assigned booth.", order_idx=4, points=100, target_role="citizen", requirements_json=json.dumps(["Verify Voter ID"])),
        ]
        db.add_all(phases)
        
        pune_election = Election(title="Maharashtra State Assembly 2024", type="state", district="Pune")
        db.add(pune_election)
        db.commit()
        print("Elections seeded.")

def seed_role_data():
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    seed_base_data(db)
    
    # 1. Seed Candidate Profiles for existing candidates
    candidates = db.query(User).filter(User.role == "candidate").all()
    for c in candidates:
        if db.query(CandidateProfile).filter(CandidateProfile.user_id == c.id).first() is None:
            profile = CandidateProfile(
                user_id=c.id,
                master_profile_json=json.dumps({
                    "bio": f"Candidate {c.name} is dedicated to the development of {c.assembly_constituency}.",
                    "top_promises": ["Better Roads", "Clean Water", "Youth Employment"],
                    "track_record": "Built 2 schools and 1 community center in the last 5 years."
                }),
                youtube_urls=json.dumps(["https://youtube.com/watch?v=demo1", "https://youtube.com/watch?v=demo2"]),
                news_urls=json.dumps(["https://news.com/candidate-profile", "https://elections.in/candidates/rajesh-singh"]),
                verified_quiz_results=json.dumps([{"quiz": "Ethics", "score": 9, "date": "2024-05-01"}])
            )
            db.add(profile)

    # 2. Seed Voter Issues
    if db.query(VoterIssue).count() == 0:
        issues = [
            VoterIssue(content="Frequent power cuts in Kothrud area.", constituency="Kothrud"),
            VoterIssue(content="Water shortage in Shivajinagar during mornings.", constituency="Shivajinagar"),
            VoterIssue(content="Need better traffic management near the main junction.", constituency="Kothrud"),
            VoterIssue(content="Poor street lighting in Kasba Peth.", constituency="Kasba Peth")
        ]
        db.add_all(issues)

    # 3. Seed System Alerts
    officer = db.query(User).filter(User.role == "officer").first()
    if officer and db.query(SystemAlert).count() == 0:
        alert = SystemAlert(
            officer_id=officer.id,
            content_json=json.dumps({
                "en": "Polling time extended by 1 hour in Shivajinagar.",
                "mr": "शिवाजीनगरमध्ये मतदानाची वेळ १ तास वाढवण्यात आली आहे.",
                "hi": "शिवाजीनगर में मतदान का समय 1 घंटे बढ़ा दिया गया है।"
            }),
            constituency="Shivajinagar"
        )
        db.add(alert)

    # 4. Seed Cloud Usage
    if db.query(CloudUsage).count() == 0:
        usage = [
            CloudUsage(service_name="Gemini 1.5 Pro", usage_value=1200000, cost=14.20),
            CloudUsage(service_name="Google Maps API", usage_value=4200, cost=8.50),
            CloudUsage(service_name="Storage", usage_value=125, cost=2.10)
        ]
        db.add_all(usage)

    # 5. Seed Audit Logs
    admin = db.query(User).filter(User.role == "admin").first()
    if admin and db.query(AuditLog).count() == 0:
        logs = [
            AuditLog(user_id=admin.id, action="role_change", details="Changed User 2 role to candidate"),
            AuditLog(user_id=officer.id, action="profile_approved", details="Approved Rajesh Singh's profile") if officer else None
        ]
        db.add_all([l for l in logs if l])

    # 6. Seed Telemetry
    if db.query(Telemetry).count() == 0:
        for i in range(10):
            t = Telemetry(endpoint="/api/v1/stats", method="GET", status_code=200, latency_ms=45.5 + i)
            db.add(t)

    db.commit()
    db.close()
    print("Role-based demo data seeded successfully.")

if __name__ == "__main__":
    seed_role_data()
