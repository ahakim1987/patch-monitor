"""Celery configuration for the application."""

from app.celery_app import celery
from app.tasks import periodic_health_check, periodic_compliance_check, periodic_cve_update

# Configure periodic tasks
celery.conf.beat_schedule = {
    'health-check-every-5-minutes': {
        'task': 'app.tasks.periodic_health_check',
        'schedule': 300.0,  # 5 minutes
    },
    'compliance-check-every-hour': {
        'task': 'app.tasks.periodic_compliance_check',
        'schedule': 3600.0,  # 1 hour
    },
    'cve-update-daily': {
        'task': 'app.tasks.periodic_cve_update',
        'schedule': 86400.0,  # 24 hours
    },
}
