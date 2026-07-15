from flask import Blueprint, request, jsonify
from extensions import db, cache
from models import User, StudentProfile, CompanyProfile, PlacementDrive, Application
from decorators import role_required

admin_bp = Blueprint("admin", __name__)


@admin_bp.route("/dashboard", methods=["GET"])
@role_required("admin")
@cache.cached(timeout=60, query_string=True)
def dashboard():
    total_students = StudentProfile.query.count()
    total_companies = CompanyProfile.query.count()
    total_drives = PlacementDrive.query.count()
    pending_companies = CompanyProfile.query.filter_by(approval_status="Pending").count()
    pending_drives = PlacementDrive.query.filter_by(status="Pending").count()
    total_applications = Application.query.count()
    selected = Application.query.filter_by(status="Selected").count()

    return jsonify({
        "total_students": total_students,
        "total_companies": total_companies,
        "total_placement_drives": total_drives,
        "pending_company_approvals": pending_companies,
        "pending_drive_approvals": pending_drives,
        "total_applications": total_applications,
        "total_selected": selected,
    })


# ---------------- Company approvals ----------------

@admin_bp.route("/companies", methods=["GET"])
@role_required("admin")
def list_companies():
    status = request.args.get("status")
    q = CompanyProfile.query
    if status:
        q = q.filter_by(approval_status=status)
    companies = q.order_by(CompanyProfile.created_at.desc()).all()
    return jsonify([c.to_dict() for c in companies])


@admin_bp.route("/companies/<int:company_id>/approve", methods=["PUT"])
@role_required("admin")
def approve_company(company_id):
    company = CompanyProfile.query.get_or_404(company_id)
    company.approval_status = "Approved"
    db.session.commit()
    cache.clear()
    return jsonify({"message": "Company approved", "company": company.to_dict()})


@admin_bp.route("/companies/<int:company_id>/reject", methods=["PUT"])
@role_required("admin")
def reject_company(company_id):
    company = CompanyProfile.query.get_or_404(company_id)
    company.approval_status = "Rejected"
    db.session.commit()
    cache.clear()
    return jsonify({"message": "Company rejected", "company": company.to_dict()})


# ---------------- Drive approvals ----------------

@admin_bp.route("/drives", methods=["GET"])
@role_required("admin")
def list_all_drives():
    status = request.args.get("status")
    q = PlacementDrive.query
    if status:
        q = q.filter_by(status=status)
    drives = q.order_by(PlacementDrive.created_at.desc()).all()
    return jsonify([d.to_dict() for d in drives])


@admin_bp.route("/drives/<int:drive_id>/approve", methods=["PUT"])
@role_required("admin")
def approve_drive(drive_id):
    drive = PlacementDrive.query.get_or_404(drive_id)
    drive.status = "Approved"
    db.session.commit()
    cache.clear()
    return jsonify({"message": "Drive approved", "drive": drive.to_dict()})


@admin_bp.route("/drives/<int:drive_id>/reject", methods=["PUT"])
@role_required("admin")
def reject_drive(drive_id):
    drive = PlacementDrive.query.get_or_404(drive_id)
    drive.status = "Rejected"
    db.session.commit()
    cache.clear()
    return jsonify({"message": "Drive rejected", "drive": drive.to_dict()})


# ---------------- Students management ----------------

@admin_bp.route("/students", methods=["GET"])
@role_required("admin")
def list_students():
    search = request.args.get("search", "").strip()
    q = StudentProfile.query
    if search:
        like = f"%{search}%"
        q = q.filter(db.or_(StudentProfile.full_name.ilike(like), StudentProfile.branch.ilike(like)))
    students = q.all()
    return jsonify([s.to_dict() for s in students])


@admin_bp.route("/students/<int:student_id>/applications", methods=["GET"])
@role_required("admin")
def student_applications(student_id):
    student = StudentProfile.query.get_or_404(student_id)
    return jsonify([a.to_dict() for a in student.applications])


# ---------------- Search (companies + students + drives) ----------------

@admin_bp.route("/search", methods=["GET"])
@role_required("admin")
def search_all():
    query = request.args.get("q", "").strip()
    if not query:
        return jsonify({"students": [], "companies": [], "drives": []})
    like = f"%{query}%"
    students = StudentProfile.query.filter(StudentProfile.full_name.ilike(like)).all()
    companies = CompanyProfile.query.filter(CompanyProfile.company_name.ilike(like)).all()
    drives = PlacementDrive.query.filter(PlacementDrive.job_title.ilike(like)).all()
    return jsonify({
        "students": [s.to_dict() for s in students],
        "companies": [c.to_dict() for c in companies],
        "drives": [d.to_dict() for d in drives],
    })


# ---------------- Blacklist / deactivate ----------------

@admin_bp.route("/users/<int:user_id>/deactivate", methods=["PUT"])
@role_required("admin")
def deactivate_user(user_id):
    user = User.query.get_or_404(user_id)
    if user.role == "admin":
        return jsonify({"error": "Cannot deactivate admin"}), 400
    user.is_active = False
    db.session.commit()
    cache.clear()
    return jsonify({"message": "User deactivated", "user": user.to_dict()})


@admin_bp.route("/users/<int:user_id>/activate", methods=["PUT"])
@role_required("admin")
def activate_user(user_id):
    user = User.query.get_or_404(user_id)
    user.is_active = True
    db.session.commit()
    cache.clear()
    return jsonify({"message": "User activated", "user": user.to_dict()})


@admin_bp.route("/users/<int:user_id>/blacklist", methods=["PUT"])
@role_required("admin")
def blacklist_user(user_id):
    user = User.query.get_or_404(user_id)
    if user.role == "admin":
        return jsonify({"error": "Cannot blacklist admin"}), 400
    user.is_blacklisted = True
    user.is_active = False
    db.session.commit()
    cache.clear()
    return jsonify({"message": "User blacklisted", "user": user.to_dict()})


@admin_bp.route("/users/<int:user_id>/unblacklist", methods=["PUT"])
@role_required("admin")
def unblacklist_user(user_id):
    user = User.query.get_or_404(user_id)
    user.is_blacklisted = False
    user.is_active = True
    db.session.commit()
    cache.clear()
    return jsonify({"message": "User un-blacklisted", "user": user.to_dict()})


# ---------------- Reports / statistics ----------------

@admin_bp.route("/reports/stats", methods=["GET"])
@role_required("admin")
def report_stats():
    """Data for charts: applications per status, drives per company etc."""
    status_counts = {}
    for status in ["Applied", "Shortlisted", "Selected", "Rejected"]:
        status_counts[status] = Application.query.filter_by(status=status).count()

    drives_per_company = []
    for company in CompanyProfile.query.filter_by(approval_status="Approved").all():
        drives_per_company.append({
            "company_name": company.company_name,
            "drive_count": len(company.drives)
        })

    return jsonify({
        "application_status_breakdown": status_counts,
        "drives_per_company": drives_per_company,
    })
