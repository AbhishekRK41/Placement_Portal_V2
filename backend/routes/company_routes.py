from datetime import datetime
from flask import Blueprint, request, jsonify
from extensions import db, cache
from models import User, CompanyProfile, PlacementDrive, Application, StudentProfile
from decorators import role_required, current_user_id

company_bp = Blueprint("company", __name__)


def get_company_profile():
    uid = current_user_id()
    user = User.query.get(uid)
    return user.company_profile if user else None


@company_bp.route("/profile", methods=["GET"])
@role_required("company")
def get_profile():
    profile = get_company_profile()
    if not profile:
        return jsonify({"error": "Company profile not found"}), 404
    return jsonify(profile.to_dict())


@company_bp.route("/profile", methods=["PUT"])
@role_required("company")
def update_profile():
    profile = get_company_profile()
    if not profile:
        return jsonify({"error": "Company profile not found"}), 404
    data = request.get_json(force=True) or {}
    profile.company_name = data.get("company_name", profile.company_name)
    profile.hr_contact = data.get("hr_contact", profile.hr_contact)
    profile.website = data.get("website", profile.website)
    db.session.commit()
    return jsonify({"message": "Profile updated", "profile": profile.to_dict()})


@company_bp.route("/dashboard", methods=["GET"])
@role_required("company")
def dashboard():
    profile = get_company_profile()
    if not profile:
        return jsonify({"error": "Company profile not found"}), 404
    drives = PlacementDrive.query.filter_by(company_id=profile.id).all()
    return jsonify({
        "company": profile.to_dict(),
        "created_drives": [d.to_dict() for d in drives],
        "total_drives": len(drives),
    })


@company_bp.route("/drives", methods=["POST"])
@role_required("company")
def create_drive():
    profile = get_company_profile()
    if not profile:
        return jsonify({"error": "Company profile not found"}), 404
    if profile.approval_status != "Approved":
        return jsonify({"error": "Your company must be approved by admin before creating placement drives"}), 403

    data = request.get_json(force=True) or {}
    required = ["job_title", "application_deadline"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    try:
        deadline = datetime.fromisoformat(data["application_deadline"])
    except ValueError:
        return jsonify({"error": "application_deadline must be ISO format e.g. 2026-08-01T23:59:00"}), 400

    drive = PlacementDrive(
        company_id=profile.id,
        job_title=data["job_title"],
        job_description=data.get("job_description", ""),
        eligible_branches=data.get("eligible_branches", ""),
        min_cgpa=data.get("min_cgpa", 0),
        eligible_year=data.get("eligible_year"),
        application_deadline=deadline,
        status="Pending",
    )
    db.session.add(drive)
    db.session.commit()
    cache.clear()
    return jsonify({"message": "Drive created, pending admin approval", "drive": drive.to_dict()}), 201


@company_bp.route("/drives", methods=["GET"])
@role_required("company")
def list_own_drives():
    profile = get_company_profile()
    if not profile:
        return jsonify({"error": "Company profile not found"}), 404
    drives = PlacementDrive.query.filter_by(company_id=profile.id).order_by(PlacementDrive.created_at.desc()).all()
    return jsonify([d.to_dict() for d in drives])


@company_bp.route("/drives/<int:drive_id>/applications", methods=["GET"])
@role_required("company")
def drive_applications(drive_id):
    profile = get_company_profile()
    drive = PlacementDrive.query.get_or_404(drive_id)
    if drive.company_id != profile.id:
        return jsonify({"error": "Not authorized for this drive"}), 403
    apps = Application.query.filter_by(drive_id=drive_id).all()
    return jsonify([a.to_dict() for a in apps])


@company_bp.route("/applications/<int:application_id>/status", methods=["PUT"])
@role_required("company")
def update_application_status(application_id):
    profile = get_company_profile()
    application = Application.query.get_or_404(application_id)
    if application.drive.company_id != profile.id:
        return jsonify({"error": "Not authorized for this application"}), 403

    data = request.get_json(force=True) or {}
    new_status = data.get("status")
    valid_statuses = ["Applied", "Shortlisted", "Selected", "Rejected"]
    if new_status not in valid_statuses:
        return jsonify({"error": f"Status must be one of {valid_statuses}"}), 400

    application.status = new_status
    db.session.commit()
    return jsonify({"message": "Application status updated", "application": application.to_dict()})
