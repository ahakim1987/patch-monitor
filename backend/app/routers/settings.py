"""Settings router."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Settings
from app.schemas import SettingsResponse, SettingsUpdate
from app.auth import require_role, get_current_user
from app.models import User

router = APIRouter()


@router.get("", response_model=SettingsResponse)
async def get_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("viewer"))
):
    """Get all application settings."""
    settings = db.query(Settings).all()
    
    # Convert to dictionary
    settings_dict = {setting.key: setting.value for setting in settings}
    
    # Set default values if not exists
    defaults = {
        "application_name": "Linux Patch Monitor",
        "collection_interval": "60",
        "data_retention_days": "90",
        "email_notifications_enabled": "true",
        "email_address": "",
        "alert_threshold_patch_lag_days": "30",
        "alert_threshold_security_updates": "1",
        "session_timeout_minutes": "30",
        "require_strong_passwords": "true",
        "enable_mfa": "false",
        "enable_rate_limiting": "true",
        "require_https": "true",
        "database_type": "PostgreSQL with TimescaleDB",
        "database_connection_string": "",
        "backup_schedule": "daily",
    }
    
    # Merge defaults with actual settings
    for key, value in defaults.items():
        if key not in settings_dict:
            settings_dict[key] = value
    
    return SettingsResponse(settings=settings_dict)


@router.put("", response_model=SettingsResponse)
async def update_settings(
    settings_update: SettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    """Update application settings. Requires admin role."""
    
    # Update or create each setting
    for key, value in settings_update.settings.items():
        existing_setting = db.query(Settings).filter(Settings.key == key).first()
        
        if existing_setting:
            existing_setting.value = value
            existing_setting.updated_by = current_user.id
        else:
            new_setting = Settings(
                key=key,
                value=value,
                updated_by=current_user.id
            )
            db.add(new_setting)
    
    db.commit()
    
    # Return updated settings
    settings = db.query(Settings).all()
    settings_dict = {setting.key: setting.value for setting in settings}
    
    return SettingsResponse(settings=settings_dict)

