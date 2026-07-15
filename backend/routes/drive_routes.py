from flask import Blueprint, request, jsonify
from extensions import cache
from models import PlacementDrive, CompanyProfile, User

drive_bp = Blueprint("drive", __name__)


@drive_bp.route("", methods=["GET"])
@cache.cached(timeout=60, query_string=True)
def list_approved_drives():
    """Publicly viewable list of approved placement drives (used pre-login too)."""
    search = request.args.get("search", "").strip()
    q = PlacementDrive.query.join(CompanyProfile).join(User).filter(
        PlacementDrive.status == "Approved",
        User.is_active == True,
        User.is_blacklisted == False,
    )
    if search:
        q = q.filter(PlacementDrive.job_title.ilike(f"%{search}%"))
    drives = q.order_by(PlacementDrive.application_deadline.asc()).all()
    return jsonify([d.to_dict() for d in drives])


@drive_bp.route("/<int:drive_id>", methods=["GET"])
def get_drive(drive_id):
    drive = PlacementDrive.query.get_or_404(drive_id)
    return jsonify(drive.to_dict())