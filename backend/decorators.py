from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt, get_jwt_identity


def role_required(*roles):
    """Decorator to restrict endpoint access to specific role(s)."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            if claims.get("role") not in roles:
                return jsonify({"error": "Access forbidden: insufficient role privileges"}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def current_user_id():
    return int(get_jwt_identity())
