import os
import csv
import json
import urllib.request
from datetime import datetime, timedelta
from celery_app import celery
from flask import current_app

from app import create_app
from extensions import db
from models import StudentProfile, PlacementDrive, Application, CompanyProfile

# Bind tasks to a Flask app context so they can access db/models/config
flask_app = create_app()


def send_email(to_email, subject, html_body):
    """Send an email via SMTP using Flask config. No-ops gracefully if not configured."""
    import smtplib
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText

    cfg = flask_app.config
    if not cfg.get("MAIL_USERNAME") or not cfg.get("MAIL_PASSWORD"):
        print(f"[mail:skip - not configured] Would send to {to_email}: {subject}")
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = cfg["MAIL_DEFAULT_SENDER"]
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(cfg["MAIL_SERVER"], cfg["MAIL_PORT"]) as server:
            server.starttls()
            server.login(cfg["MAIL_USERNAME"], cfg["MAIL_PASSWORD"])
            server.sendmail(cfg["MAIL_DEFAULT_SENDER"], to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"[mail:error] {e}")
        return False


def send_gchat_webhook(text):
    cfg = flask_app.config
    webhook_url = cfg.get("GCHAT_WEBHOOK_URL")
    if not webhook_url:
        print(f"[gchat:skip - not configured] Would send: {text}")
        return False
    try:
        data = json.dumps({"text": text}).encode("utf-8")
        req = urllib.request.Request(webhook_url, data=data, headers={"Content-Type": "application/json; charset=UTF-8"})
        urllib.request.urlopen(req, timeout=5)
        return True
    except Exception as e:
        print(f"[gchat:error] {e}")
        return False


@celery.task(name="tasks.send_daily_reminders")
def send_daily_reminders():
    """Scheduled Job (a): Daily reminders to students about upcoming application deadlines."""
    with flask_app.app_context():
        upcoming_window = datetime.utcnow() + timedelta(days=3)
        drives = PlacementDrive.query.filter(
            PlacementDrive.status == "Approved",
            PlacementDrive.application_deadline >= datetime.utcnow(),
            PlacementDrive.application_deadline <= upcoming_window,
        ).all()

        if not drives:
            return {"message": "No upcoming deadlines within 3 days", "reminders_sent": 0}

        applied_pairs = {(a.student_id, a.drive_id) for a in Application.query.all()}
        students = StudentProfile.query.all()
        sent_count = 0

        for student in students:
            for drive in drives:
                if (student.id, drive.id) in applied_pairs:
                    continue  # already applied, no need to remind
                subject = f"Reminder: {drive.job_title} application closes soon"
                body = (
                    f"<p>Hi {student.full_name},</p>"
                    f"<p>The application deadline for <b>{drive.job_title}</b> at "
                    f"<b>{drive.company.company_name}</b> is on "
                    f"{drive.application_deadline.strftime('%d %b %Y, %I:%M %p')}.</p>"
                    f"<p>Don't miss out — apply now on the Placement Portal.</p>"
                )
                if student.user:
                    send_email(student.user.email, subject, body)
                send_gchat_webhook(f"Reminder sent to {student.full_name} for drive '{drive.job_title}'")
                sent_count += 1

        return {"message": "Daily reminders sent", "reminders_sent": sent_count}


@celery.task(name="tasks.generate_monthly_report")
def generate_monthly_report():
    """Scheduled Job (b): Monthly HTML activity report emailed to admin, generated on 1st of month."""
    with flask_app.app_context():
        from models import User

        today = datetime.utcnow()
        first_of_this_month = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        first_of_last_month = (first_of_this_month - timedelta(days=1)).replace(day=1)

        drives_conducted = PlacementDrive.query.filter(
            PlacementDrive.created_at >= first_of_last_month,
            PlacementDrive.created_at < first_of_this_month,
        ).count()

        applications_last_month = Application.query.filter(
            Application.application_date >= first_of_last_month,
            Application.application_date < first_of_this_month,
        ).all()

        applied_count = len(applications_last_month)
        selected_count = len([a for a in applications_last_month if a.status == "Selected"])

        html_report = f"""
        <html>
        <body style="font-family: Arial, sans-serif;">
            <h2>Monthly Placement Activity Report</h2>
            <p><b>Period:</b> {first_of_last_month.strftime('%B %Y')}</p>
            <table border="1" cellpadding="8" cellspacing="0">
                <tr><td><b>Number of drives conducted</b></td><td>{drives_conducted}</td></tr>
                <tr><td><b>Number of students applied</b></td><td>{applied_count}</td></tr>
                <tr><td><b>Number of students selected</b></td><td>{selected_count}</td></tr>
            </table>
            <p>Generated automatically by the Placement Portal Application.</p>
        </body>
        </html>
        """

        admin_user = User.query.filter_by(role="admin").first()
        if admin_user:
            send_email(admin_user.email, f"Monthly Placement Report - {first_of_last_month.strftime('%B %Y')}", html_report)

        # Also save to disk for reference
        os.makedirs(flask_app.config["EXPORT_FOLDER"], exist_ok=True)
        report_path = os.path.join(
            flask_app.config["EXPORT_FOLDER"],
            f"monthly_report_{first_of_last_month.strftime('%Y_%m')}.html"
        )
        with open(report_path, "w") as f:
            f.write(html_report)

        return {"message": "Monthly report generated", "path": report_path}


@celery.task(name="tasks.export_applications_csv", bind=True)
def export_applications_csv(self, student_id):
    """User-triggered async job (c): export a student's application history as CSV."""
    with flask_app.app_context():
        student = StudentProfile.query.get(student_id)
        if not student:
            return {"error": "Student not found"}

        applications = Application.query.filter_by(student_id=student_id).all()

        os.makedirs(flask_app.config["EXPORT_FOLDER"], exist_ok=True)
        filename = f"applications_{student_id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.csv"
        filepath = os.path.join(flask_app.config["EXPORT_FOLDER"], filename)

        with open(filepath, "w", newline="") as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(["Student ID", "Company Name", "Drive Title", "Application Status", "Application Date"])
            for app_ in applications:
                writer.writerow([
                    student_id,
                    app_.drive.company.company_name if app_.drive and app_.drive.company else "",
                    app_.drive.job_title if app_.drive else "",
                    app_.status,
                    app_.application_date.strftime("%Y-%m-%d %H:%M:%S") if app_.application_date else "",
                ])

        # Alert the student that export is done (e.g. via email)
        if student.user:
            send_email(
                student.user.email,
                "Your placement application export is ready",
                f"<p>Hi {student.full_name}, your CSV export is ready: {filename}</p>"
            )

        return {"message": "Export completed", "filename": filename}
