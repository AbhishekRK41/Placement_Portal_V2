"""
Optional helper to populate the database with demo data for quick testing/demo videos.
Run with:  python seed_demo_data.py
(Run this AFTER starting the app at least once so tables + admin already exist.)
"""
from datetime import datetime, timedelta
from app import create_app
from extensions import db
from models import User, StudentProfile, CompanyProfile, PlacementDrive, Application

app = create_app()

with app.app_context():
    # --- Students ---
    students_data = [
        {"email": "asha.rao@example.com", "name": "Asha Rao", "branch": "CSE", "year": 2026, "cgpa": 8.7},
        {"email": "rahul.verma@example.com", "name": "Rahul Verma", "branch": "ECE", "year": 2026, "cgpa": 7.9},
        {"email": "priya.singh@example.com", "name": "Priya Singh", "branch": "EEE", "year": 2027, "cgpa": 9.1},
    ]
    students = []
    for s in students_data:
        if User.query.filter_by(email=s["email"]).first():
            continue
        u = User(email=s["email"], role="student")
        u.set_password("pass123")
        db.session.add(u)
        db.session.flush()
        p = StudentProfile(user_id=u.id, full_name=s["name"], branch=s["branch"], year=s["year"], cgpa=s["cgpa"])
        db.session.add(p)
        students.append(p)
    db.session.commit()

    # --- Companies ---
    companies_data = [
        {"email": "hr@brightsoft.com", "name": "BrightSoft Technologies", "status": "Approved"},
        {"email": "hr@novacore.com", "name": "NovaCore Systems", "status": "Pending"},
    ]
    companies = []
    for c in companies_data:
        if User.query.filter_by(email=c["email"]).first():
            continue
        u = User(email=c["email"], role="company")
        u.set_password("pass123")
        db.session.add(u)
        db.session.flush()
        p = CompanyProfile(user_id=u.id, company_name=c["name"], approval_status=c["status"])
        db.session.add(p)
        companies.append(p)
    db.session.commit()

    approved_company = CompanyProfile.query.filter_by(approval_status="Approved").first()
    if approved_company and PlacementDrive.query.count() == 0:
        drive = PlacementDrive(
            company_id=approved_company.id,
            job_title="Graduate Software Engineer",
            job_description="Work on backend systems using Python and Flask.",
            eligible_branches="CSE,ECE",
            min_cgpa=7.5,
            eligible_year=2026,
            application_deadline=datetime.utcnow() + timedelta(days=20),
            status="Approved",
        )
        db.session.add(drive)
        db.session.commit()
        print(f"Created demo drive: {drive.job_title}")

    print("Demo data seeded successfully.")
    print("Sample logins (password: pass123):")
    for s in students_data:
        print(f"  Student -> {s['email']}")
    for c in companies_data:
        print(f"  Company -> {c['email']}")
