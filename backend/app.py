import os
from flask import Flask, jsonify
from config import Config
from extensions import db, jwt, cache, cors


def create_app(config_class=Config):
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(config_class)

    os.makedirs(os.path.join(app.root_path, "instance"), exist_ok=True)
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    os.makedirs(app.config["EXPORT_FOLDER"], exist_ok=True)

    # init extensions
    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    redis_available = False
    try:
        import redis as redis_lib
        r = redis_lib.Redis(host=app.config["REDIS_HOST"], port=app.config["REDIS_PORT"],
                             db=app.config["REDIS_DB"], socket_connect_timeout=1)
        r.ping()
        redis_available = True
    except Exception as e:
        app.logger.warning(f"Redis unavailable, falling back to SimpleCache (in-memory, single-process only): {e}")

    if not redis_available:
        app.config["CACHE_TYPE"] = "SimpleCache"
    cache.init_app(app)

    # register blueprints
    from routes.auth_routes import auth_bp
    from routes.admin_routes import admin_bp
    from routes.company_routes import company_bp
    from routes.student_routes import student_bp
    from routes.drive_routes import drive_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(company_bp, url_prefix="/api/company")
    app.register_blueprint(student_bp, url_prefix="/api/student")
    app.register_blueprint(drive_bp, url_prefix="/api/drives")

    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok", "message": "Placement Portal API running"})

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Internal server error"}), 500

    with app.app_context():
        db.create_all()
        seed_admin(app)

    return app


def seed_admin(app):
    """Programmatically create the single pre-existing admin user if not present."""
    from models import User

    admin_email = app.config["ADMIN_EMAIL"]
    existing = User.query.filter_by(role="admin").first()
    if not existing:
        admin = User(email=admin_email, role="admin", is_active=True)
        admin.set_password(app.config["ADMIN_PASSWORD"])
        db.session.add(admin)
        db.session.commit()
        print(f"[seed] Admin created -> email: {admin_email} password: {app.config['ADMIN_PASSWORD']}")


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="0.0.0.0", port=5000)
