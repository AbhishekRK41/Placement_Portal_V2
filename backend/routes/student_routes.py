import os
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from werkzeug.utils import secure_filename
from extensions import db
from models import User, PlacementDrive, Application, CompanyProfile
from decorators import role_required, current_user_id

student_bp = Blueprint("student", __name__)

ALLOWED_RESUME_EXT = {"pdf", "doc", "docx"}


def get_student_profile():
    uid = current_user_id()
    user = User.query.get(uid)
    return user.student_profile if user else None


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_RESUME_EXT


@student_bp.route("/profile", methods=["GET"])
@role_required("student")
def get_profile():
    profile = get_student_profile()
    if not profile:
        return jsonify({"error": "Student profile not found"}), 404
    return jsonify(profile.to_dict())


@student_bp.route("/profile", methods=["PUT"])
@role_required("student")
def update_profile():
    profile = get_student_profile()
    if not profile:
        return jsonify({"error": "Student profile not found"}), 404
    data = request.get_json(force=True) or {}
    profile.full_name = data.get("full_name", profile.full_name)
    profile.branch = data.get("branch", profile.branch)
    profile.year = data.get("year", profile.year)
    profile.cgpa = data.get("cgpa", profile.cgpa)
    profile.phone = data.get("phone", profile.phone)
    db.session.commit()
    return jsonify({"message": "Profile updated", "profile": profile.to_dict()})


@student_bp.route("/resume", methods=["POST"])
@role_required("student")
def upload_resume():
    profile = get_student_profile()
    if not profile:
        return jsonify({"error": "Student profile not found"}), 404
    if "resume" not in request.files:
        return jsonify({"error": "No file part named 'resume'"}), 400
    file = request.files["resume"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400
    if not allowed_file(file.filename):
        return jsonify({"error": "Only pdf/doc/docx files are allowed"}), 400

    filename = secure_filename(f"resume_{profile.user_id}_{file.filename}")
    filepath = os.path.join(current_app.config["UPLOAD_FOLDER"], filename)
    file.save(filepath)
    profile.resume_path = filename
    db.session.commit()
    return jsonify({"message": "Resume uploaded", "resume_path": filename})


@student_bp.route("/resume/<path:filename>", methods=["GET"])
@role_required("student", "company", "admin")
def download_resume(filename):
    return send_from_directory(current_app.config["UPLOAD_FOLDER"], filename)


@student_bp.route("/dashboard", methods=["GET"])
@role_required("student")
def dashboard():
    profile = get_student_profile()
    if not profile:
        return jsonify({"error": "Student profile not found"}), 404

    approved_drives = PlacementDrive.query.filter_by(status="Approved").all()
    applications = Application.query.filter_by(student_id=profile.id).all()

    return jsonify({
        "profile": profile.to_dict(),
        "total_approved_drives": len(approved_drives),
        "total_applications": len(applications),
        "applications": [a.to_dict() for a in applications],
    })


@student_bp.route("/drives", methods=["GET"])
@role_required("student")
def eligible_drives():
    """List approved drives with eligibility flag + optional filtering/search."""
    profile = get_student_profile()
    branch = request.args.get("branch")
    search = request.args.get("search", "").strip()

    q = PlacementDrive.query.join(CompanyProfile).join(User).filter(
    PlacementDrive.status == "Approved",
    User.is_active == True,
    User.is_blacklisted == False,
    )
    if branch:
        q = q.filter(PlacementDrive.eligible_branches.ilike(f"%{branch}%"))
    if search:
        q = q.filter(PlacementDrive.job_title.ilike(f"%{search}%"))

    drives = q.order_by(PlacementDrive.application_deadline.asc()).all()
    applied_drive_ids = {a.drive_id for a in profile.applications} if profile else set()

    result = []
    for d in drives:
        data = d.to_dict()
        data["already_applied"] = d.id in applied_drive_ids
        data["is_eligible"] = check_eligibility(profile, d)
        data["deadline_passed"] = d.application_deadline < datetime.utcnow()
        result.append(data)
    return jsonify(result)


def check_eligibility(profile, drive):
    if not profile:
        return False
    if drive.min_cgpa and profile.cgpa is not None and profile.cgpa < drive.min_cgpa:
        return False
    if drive.eligible_branches:
        allowed = [b.strip().lower() for b in drive.eligible_branches.split(",")]
        if profile.branch and profile.branch.lower() not in allowed:
            return False
    if drive.eligible_year and profile.year and drive.eligible_year != profile.year:
        return False
    return True


@student_bp.route("/drives/<int:drive_id>/apply", methods=["POST"])
@role_required("student")
def apply_to_drive(drive_id):
    profile = get_student_profile()
    if not profile:
        return jsonify({"error": "Student profile not found"}), 404

    drive = PlacementDrive.query.get_or_404(drive_id)
    if drive.status != "Approved":
        return jsonify({"error": "This drive is not open for applications"}), 400
    if drive.application_deadline < datetime.utcnow():
        return jsonify({"error": "Application deadline has passed"}), 400

    # Prevent duplicate applications
    existing = Application.query.filter_by(student_id=profile.id, drive_id=drive_id).first()
    if existing:
        return jsonify({"error": "You have already applied to this drive"}), 409

    if not check_eligibility(profile, drive):
        return jsonify({"error": "You do not meet the eligibility criteria for this drive"}), 403

    application = Application(student_id=profile.id, drive_id=drive_id, status="Applied")
    db.session.add(application)
    db.session.commit()
    return jsonify({"message": "Application submitted", "application": application.to_dict()}), 201


@student_bp.route("/applications", methods=["GET"])
@role_required("student")
def my_applications():
    profile = get_student_profile()
    if not profile:
        return jsonify({"error": "Student profile not found"}), 404
    apps = Application.query.filter_by(student_id=profile.id).order_by(Application.application_date.desc()).all()
    return jsonify([a.to_dict() for a in apps])


@student_bp.route("/export", methods=["POST"])
@role_required("student")
def trigger_export():
    """User-triggered async job: export application history as CSV via Celery."""
    profile = get_student_profile()
    if not profile:
        return jsonify({"error": "Student profile not found"}), 404

    from tasks import export_applications_csv
    task = export_applications_csv.delay(profile.id)
    return jsonify({"message": "Export job started", "task_id": task.id}), 202


@student_bp.route("/export/status/<task_id>", methods=["GET"])
@role_required("student")
def export_status(task_id):
    from celery_app import celery
    task = celery.AsyncResult(task_id)
    response = {"task_id": task_id, "state": task.state}
    if task.state == "SUCCESS":
        response["result"] = task.result
    elif task.state == "FAILURE":
        response["error"] = str(task.info)
    return jsonify(response)


@student_bp.route("/export/download/<path:filename>", methods=["GET"])
@role_required("student")
def download_export(filename):
    return send_from_directory(current_app.config["EXPORT_FOLDER"], filename, as_attachment=True)
