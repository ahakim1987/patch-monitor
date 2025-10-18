"""Celery configuration for background tasks."""

from celery import Celery
from app.config import settings

# Create Celery instance
celery = Celery(
    "patchmonitor",
    broker=settings.redis_url or "redis://localhost:6379/0",
    backend=settings.redis_url or "redis://localhost:6379/0",
    include=["app.tasks"]
)

# Celery configuration
celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

# Optional configuration for production
if settings.redis_url:
    celery.conf.update(
        broker_connection_retry_on_startup=True,
        result_expires=3600,  # 1 hour
    )
