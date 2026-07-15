from celery import Celery
from celery.schedules import crontab
from config import Config

celery = Celery(
    "placement_portal",
    broker=Config.CELERY_BROKER_URL,
    backend=Config.CELERY_RESULT_BACKEND,
    include=["tasks"],
)

celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
)

# Scheduled (periodic) jobs
celery.conf.beat_schedule = {
    "daily-deadline-reminders": {
        "task": "tasks.send_daily_reminders",
        "schedule": crontab(hour=9, minute=0),  # runs daily at 9:00 AM
    },
    "monthly-activity-report": {
        "task": "tasks.generate_monthly_report",
        "schedule": crontab(hour=6, minute=0, day_of_month=1),  # 1st of every month
    },
}


def init_celery(app):
    """Bind Flask app context to Celery tasks so they can use db, config etc."""
    class ContextTask(celery.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)

    celery.Task = ContextTask
    return celery
