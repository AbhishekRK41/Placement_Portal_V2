from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db


class User(db.Model):
    """Unified user model to differentiate all types of user roles."""
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'admin' | 'company' | 'student'
    is_active = db.Column(db.Boolean, default=True)  # deactivated/blacklisted flag
    is_blacklisted = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    student_profile = db.relationship("StudentProfile", backref="user", uselist=False, cascade="all, delete-orphan")
    company_profile = db.relationship("CompanyProfile", backref="user", uselist=False, cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "role": self.role,
            "is_active": self.is_active,
            "is_blacklisted": self.is_blacklisted,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class StudentProfile(db.Model):
    __tablename__ = "student_profiles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True)
    email = db.Column(db.String(120), nullable=False) 
    full_name = db.Column(db.String(120), nullable=False)
    branch = db.Column(db.String(80))
    year = db.Column(db.Integer)  # graduation year
    cgpa = db.Column(db.Float)
    phone = db.Column(db.String(20))
    resume_path = db.Column(db.String(255))

    applications = db.relationship("Application", backref="student", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "email": self.user.email if self.user else None,
            "full_name": self.full_name,
            "branch": self.branch,
            "year": self.year,
            "cgpa": self.cgpa,
            "phone": self.phone,
            "resume_path": self.resume_path,
            "is_active": self.user.is_active if self.user else None,
            "is_blacklisted": self.user.is_blacklisted if self.user else None,
        }


class CompanyProfile(db.Model):
    __tablename__ = "company_profiles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True)
    email = db.Column(db.String(120), nullable=False)
    company_name = db.Column(db.String(150), nullable=False)
    hr_contact = db.Column(db.String(120))
    website = db.Column(db.String(200))
    approval_status = db.Column(db.String(20), default="Pending")  # Pending / Approved / Rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    drives = db.relationship("PlacementDrive", backref="company", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "email": self.user.email if self.user else None,
            "company_name": self.company_name,
            "hr_contact": self.hr_contact,
            "website": self.website,
            "approval_status": self.approval_status,
            "is_active": self.user.is_active if self.user else None,
            "is_blacklisted": self.user.is_blacklisted if self.user else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class PlacementDrive(db.Model):
    __tablename__ = "placement_drives"

    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey("company_profiles.id"), nullable=False)
    job_title = db.Column(db.String(150), nullable=False)
    job_description = db.Column(db.Text)
    eligible_branches = db.Column(db.String(255))  # comma separated
    min_cgpa = db.Column(db.Float, default=0)
    eligible_year = db.Column(db.Integer)
    application_deadline = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default="Pending")  # Pending / Approved / Rejected / Closed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    applications = db.relationship("Application", backref="drive", cascade="all, delete-orphan")

    def to_dict(self, include_company=True):
        data = {
            "id": self.id,
            "company_id": self.company_id,
            "job_title": self.job_title,
            "job_description": self.job_description,
            "eligible_branches": self.eligible_branches,
            "min_cgpa": self.min_cgpa,
            "eligible_year": self.eligible_year,
            "application_deadline": self.application_deadline.isoformat() if self.application_deadline else None,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "applicant_count": len(self.applications),
        }
        if include_company and self.company:
            data["company_name"] = self.company.company_name
        return data


class Application(db.Model):
    __tablename__ = "applications"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("student_profiles.id"), nullable=False)
    drive_id = db.Column(db.Integer, db.ForeignKey("placement_drives.id"), nullable=False)
    application_date = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default="Applied")  # Applied / Shortlisted / Selected / Rejected

    __table_args__ = (db.UniqueConstraint("student_id", "drive_id", name="uix_student_drive"),)

    def to_dict(self):
        return {
            "id": self.id,
            "student_id": self.student_id,
            "student_name": self.student.full_name if self.student else None,
            "student_email": self.student.user.email if self.student and self.student.user else None,
            "resume_path": self.student.resume_path if self.student else None,
            "drive_id": self.drive_id,
            "job_title": self.drive.job_title if self.drive else None,
            "company_name": self.drive.company.company_name if self.drive and self.drive.company else None,
            "application_date": self.application_date.isoformat() if self.application_date else None,
            "status": self.status,
        }
