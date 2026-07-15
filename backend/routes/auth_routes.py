from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from extensions import db
from models import User, StudentProfile, CompanyProfile

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register/student", methods=["POST"])
def register_student():
    data = request.get_json(force=True) or {}
    required = ["email", "password", "full_name"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already registered"}), 409

    user = User(email=data["email"], role="student")
    user.set_password(data["password"])
    db.session.add(user)
    db.session.flush()

    profile = StudentProfile(
        user_id=user.id,
        email=data["email"],
        full_name=data["full_name"],
        branch=data.get("branch"),
        year=data.get("year"),
        cgpa=data.get("cgpa"),
        phone=data.get("phone"),
    )
    db.session.add(profile)
    db.session.commit()

    return jsonify({"message": "Student registered successfully", "user": user.to_dict()}), 201


@auth_bp.route("/register/company", methods=["POST"])
def register_company():
    data = request.get_json(force=True) or {}
    required = ["email", "password", "company_name"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already registered"}), 409

    user = User(email=data["email"], role="company")
    user.set_password(data["password"])
    db.session.add(user)
    db.session.flush()

    profile = CompanyProfile(
        user_id=user.id,
        email=data["email"],
        company_name=data["company_name"],
        hr_contact=data.get("hr_contact"),
        website=data.get("website"),
        approval_status="Pending",
    )
    db.session.add(profile)
    db.session.commit()

    return jsonify({
        "message": "Company registered successfully. Awaiting admin approval.",
        "user": user.to_dict()
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(force=True) or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401

    if user.is_blacklisted:
        return jsonify({"error": "Your account has been blacklisted. Contact admin."}), 403
    if not user.is_active:
        return jsonify({"error": "Your account has been deactivated. Contact admin."}), 403

    if user.role == "company" and user.company_profile and user.company_profile.approval_status == "Rejected":
        return jsonify({"error": "Your company registration was rejected by admin."}), 403

    identity = str(user.id)
    additional_claims = {"role": user.role, "email": user.email}
    access_token = create_access_token(identity=identity, additional_claims=additional_claims)

    profile = None
    if user.role == "student" and user.student_profile:
        profile = user.student_profile.to_dict()
    elif user.role == "company" and user.company_profile:
        profile = user.company_profile.to_dict()

    return jsonify({
        "access_token": access_token,
        "user": user.to_dict(),
        "profile": profile
    }), 200
