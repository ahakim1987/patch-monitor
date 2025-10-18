"""Alert management router."""

from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Alert, Host
from app.schemas import AlertResponse, AlertAcknowledge, UserResponse
from app.auth import require_role, get_current_active_user

router = APIRouter()


@router.get("/", response_model=List[AlertResponse])
async def get_alerts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    acknowledged: bool = Query(None),
    severity: str = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(require_role("viewer"))
):
    """Get list of alerts."""
    query = db.query(Alert)
    
    # Apply filters
    if acknowledged is not None:
        query = query.filter(Alert.acknowledged == acknowledged)
    if severity:
        query = query.filter(Alert.severity == severity)
    
    alerts = query.order_by(Alert.triggered_at.desc()).offset(skip).limit(limit).all()
    return alerts


@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("viewer"))
):
    """Get specific alert by ID."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    return alert


@router.put("/{alert_id}/acknowledge", response_model=AlertResponse)
async def acknowledge_alert(
    alert_id: str,
    acknowledge_data: AlertAcknowledge,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(require_role("operator"))
):
    """Acknowledge or unacknowledge an alert."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    alert.acknowledged = acknowledge_data.acknowledged
    if acknowledge_data.acknowledged:
        alert.acknowledged_by = current_user.id
        alert.acknowledged_at = datetime.utcnow()
    else:
        alert.acknowledged_by = None
        alert.acknowledged_at = None
    
    db.commit()
    db.refresh(alert)
    
    return alert


@router.delete("/{alert_id}")
async def delete_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("admin"))
):
    """Delete an alert."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    db.delete(alert)
    db.commit()
    
    return {"message": "Alert deleted successfully"}
