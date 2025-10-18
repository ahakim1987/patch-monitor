"""Background tasks for the patch monitoring system."""

from celery import current_task
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import structlog
from app.database import SessionLocal
from app.models import Host, HostSnapshot, Alert, AlertType, SeverityLevel
from app.celery_app import celery

logger = structlog.get_logger()


@celery.task
def check_host_health():
    """Check health of all hosts and update their status."""
    db = SessionLocal()
    try:
        # Find hosts that haven't reported in the last 2 collection intervals
        cutoff_time = datetime.utcnow() - timedelta(hours=2)
        
        # Get hosts with recent snapshots
        recent_hosts = db.query(Host).join(HostSnapshot).filter(
            HostSnapshot.collected_at >= cutoff_time
        ).distinct().all()
        
        # Get hosts without recent snapshots
        stale_hosts = db.query(Host).outerjoin(HostSnapshot).filter(
            HostSnapshot.collected_at < cutoff_time
        ).distinct().all()
        
        # Update host statuses
        for host in recent_hosts:
            if host.status != "online":
                host.status = "online"
                logger.info("Host came back online", hostname=host.hostname)
        
        for host in stale_hosts:
            if host.status != "offline":
                host.status = "offline"
                logger.warning("Host went offline", hostname=host.hostname)
                
                # Create offline alert
                create_alert(
                    db=db,
                    host_id=host.id,
                    alert_type=AlertType.OFFLINE,
                    severity=SeverityLevel.HIGH,
                    message=f"Host {host.hostname} has not reported in over 2 hours"
                )
        
        db.commit()
        logger.info("Host health check completed", 
                   online_hosts=len(recent_hosts), 
                   offline_hosts=len(stale_hosts))
        
    except Exception as e:
        logger.error("Host health check failed", error=str(e))
        db.rollback()
    finally:
        db.close()


@celery.task
def check_patch_compliance():
    """Check patch compliance and create alerts for stale systems."""
    db = SessionLocal()
    try:
        # Get latest snapshots for all hosts
        latest_snapshots = db.query(HostSnapshot).join(Host).filter(
            HostSnapshot.collected_at >= datetime.utcnow() - timedelta(days=7)
        ).all()
        
        alerts_created = 0
        
        for snapshot in latest_snapshots:
            # Check if host needs patching (no patch in 30+ days)
            if snapshot.last_patch_time:
                days_since_patch = (datetime.utcnow() - snapshot.last_patch_time).days
                
                if days_since_patch >= 30:
                    # Check if alert already exists
                    existing_alert = db.query(Alert).filter(
                        Alert.host_id == snapshot.host_id,
                        Alert.alert_type == AlertType.PATCH_LAG,
                        Alert.acknowledged == False
                    ).first()
                    
                    if not existing_alert:
                        severity = SeverityLevel.CRITICAL if days_since_patch >= 60 else SeverityLevel.HIGH
                        create_alert(
                            db=db,
                            host_id=snapshot.host_id,
                            alert_type=AlertType.PATCH_LAG,
                            severity=severity,
                            message=f"Host has not been patched in {days_since_patch} days"
                        )
                        alerts_created += 1
            
            # Check for critical security updates
            if snapshot.pending_security_count > 0:
                existing_alert = db.query(Alert).filter(
                    Alert.host_id == snapshot.host_id,
                    Alert.alert_type == AlertType.CRITICAL_CVE,
                    Alert.acknowledged == False
                ).first()
                
                if not existing_alert:
                    create_alert(
                        db=db,
                        host_id=snapshot.host_id,
                        alert_type=AlertType.CRITICAL_CVE,
                        severity=SeverityLevel.CRITICAL,
                        message=f"Host has {snapshot.pending_security_count} pending security updates"
                    )
                    alerts_created += 1
            
            # Check if reboot is needed
            if snapshot.needs_reboot:
                existing_alert = db.query(Alert).filter(
                    Alert.host_id == snapshot.host_id,
                    Alert.alert_type == AlertType.REBOOT_NEEDED,
                    Alert.acknowledged == False
                ).first()
                
                if not existing_alert:
                    create_alert(
                        db=db,
                        host_id=snapshot.host_id,
                        alert_type=AlertType.REBOOT_NEEDED,
                        severity=SeverityLevel.MEDIUM,
                        message="Host requires a reboot to complete updates"
                    )
                    alerts_created += 1
        
        db.commit()
        logger.info("Patch compliance check completed", alerts_created=alerts_created)
        
    except Exception as e:
        logger.error("Patch compliance check failed", error=str(e))
        db.rollback()
    finally:
        db.close()


@celery.task
def update_cve_database():
    """Update CVE database from external sources."""
    # This would integrate with NVD API or other CVE sources
    # For now, just log that the task ran
    logger.info("CVE database update task executed")


def create_alert(db: Session, host_id: str, alert_type: AlertType, severity: SeverityLevel, message: str):
    """Create a new alert."""
    alert = Alert(
        host_id=host_id,
        alert_type=alert_type,
        severity=severity,
        message=message
    )
    db.add(alert)
    return alert


# Periodic tasks
@celery.task
def periodic_health_check():
    """Periodic task to check host health."""
    check_host_health.delay()


@celery.task
def periodic_compliance_check():
    """Periodic task to check patch compliance."""
    check_patch_compliance.delay()


@celery.task
def periodic_cve_update():
    """Periodic task to update CVE database."""
    update_cve_database.delay()
