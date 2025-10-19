"""Host management router."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from datetime import datetime, timedelta, timezone
from app.database import get_db
from app.models import Host, HostSnapshot, HostStatus
from app.schemas import (
    HostResponse, HostCreate, HostUpdate, HostSummary, HostDetailResponse,
    DashboardMetrics
)
from app.auth import require_role

router = APIRouter()


@router.get("/", response_model=List[HostSummary])
async def get_hosts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[HostStatus] = None,
    os_name: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("viewer"))
):
    """Get list of hosts with optional filtering."""
    query = db.query(Host)
    
    # Apply filters
    if status:
        query = query.filter(Host.status == status)
    if os_name:
        query = query.filter(Host.os_name.ilike(f"%{os_name}%"))
    if search:
        query = query.filter(
            Host.hostname.ilike(f"%{search}%") |
            Host.fqdn.ilike(f"%{search}%")
        )
    
    # Get hosts with latest snapshot data
    hosts = query.offset(skip).limit(limit).all()
    
    result = []
    for host in hosts:
        # Get latest snapshot
        latest_snapshot = db.query(HostSnapshot).filter(
            HostSnapshot.host_id == host.id
        ).order_by(desc(HostSnapshot.collected_at)).first()
        
        # Calculate days since last patch
        days_since_patch = None
        if latest_snapshot and latest_snapshot.last_patch_time:
            # Handle both timezone-aware and naive datetimes
            now = datetime.now(timezone.utc)
            last_patch = latest_snapshot.last_patch_time
            if last_patch.tzinfo is None:
                # If last_patch_time is naive, make it UTC-aware
                last_patch = last_patch.replace(tzinfo=timezone.utc)
            days_since_patch = (now - last_patch).days
        
        host_summary = HostSummary(
            id=host.id,
            hostname=host.hostname,
            fqdn=host.fqdn,
            ip_addresses=host.ip_addresses,
            os_name=host.os_name,
            os_version=host.os_version,
            status=host.status,
            last_patch_time=latest_snapshot.last_patch_time if latest_snapshot else None,
            pending_updates_count=latest_snapshot.pending_updates_count if latest_snapshot else 0,
            pending_security_count=latest_snapshot.pending_security_count if latest_snapshot else 0,
            needs_reboot=latest_snapshot.needs_reboot if latest_snapshot else False,
            days_since_patch=days_since_patch
        )
        result.append(host_summary)
    
    return result


@router.get("/{host_id}", response_model=HostDetailResponse)
async def get_host(
    host_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("viewer"))
):
    """Get detailed information about a specific host."""
    host = db.query(Host).filter(Host.id == host_id).first()
    if not host:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Host not found"
        )
    
    # Get recent snapshots
    snapshots = db.query(HostSnapshot).filter(
        HostSnapshot.host_id == host.id
    ).order_by(desc(HostSnapshot.collected_at)).limit(10).all()
    
    # Get latest pending updates
    latest_snapshot = snapshots[0] if snapshots else None
    pending_updates = []
    if latest_snapshot:
        pending_updates = latest_snapshot.pending_updates
    
    return HostDetailResponse(
        id=host.id,
        hostname=host.hostname,
        fqdn=host.fqdn,
        ip_addresses=host.ip_addresses,
        os_name=host.os_name,
        os_version=host.os_version,
        architecture=host.architecture,
        agent_version=host.agent_version,
        status=host.status,
        created_at=host.created_at,
        updated_at=host.updated_at,
        snapshots=snapshots,
        pending_updates=pending_updates,
        alerts=host.alerts,
        tags=host.tags
    )


@router.post("/", response_model=HostResponse)
async def create_host(
    host: HostCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("operator"))
):
    """Create a new host."""
    # Check if hostname already exists
    existing_host = db.query(Host).filter(Host.hostname == host.hostname).first()
    if existing_host:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Host with this hostname already exists"
        )
    
    db_host = Host(**host.dict())
    db.add(db_host)
    db.commit()
    db.refresh(db_host)
    
    return db_host


@router.put("/{host_id}", response_model=HostResponse)
async def update_host(
    host_id: str,
    host_update: HostUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("operator"))
):
    """Update host information."""
    host = db.query(Host).filter(Host.id == host_id).first()
    if not host:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Host not found"
        )
    
    # Update fields
    update_data = host_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(host, field, value)
    
    db.commit()
    db.refresh(host)
    
    return host


@router.delete("/{host_id}")
async def delete_host(
    host_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("admin"))
):
    """Delete a host."""
    host = db.query(Host).filter(Host.id == host_id).first()
    if not host:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Host not found"
        )
    
    db.delete(host)
    db.commit()
    
    return {"message": "Host deleted successfully"}


@router.get("/dashboard/metrics", response_model=DashboardMetrics)
async def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user = Depends(require_role("viewer"))
):
    """Get dashboard metrics."""
    # Total hosts
    total_hosts = db.query(Host).count()
    
    # Hosts by status
    hosts_by_status = {}
    for status in HostStatus:
        count = db.query(Host).filter(Host.status == status).count()
        hosts_by_status[status.value] = count
    
    # Get latest snapshots for all hosts
    now = datetime.now(timezone.utc)
    latest_snapshots = db.query(HostSnapshot).join(Host).filter(
        HostSnapshot.collected_at >= now - timedelta(days=7)
    ).all()
    
    # Calculate metrics
    total_pending_security = sum(s.pending_security_count for s in latest_snapshots)
    hosts_requiring_reboot = sum(1 for s in latest_snapshots if s.needs_reboot)
    
    # Recently updated hosts (last 24 hours)
    recent_cutoff = now - timedelta(hours=24)
    recently_updated = sum(
        1 for s in latest_snapshots 
        if s.last_patch_time and s.last_patch_time >= recent_cutoff
    )
    
    # Average patch lag
    patch_times = [
        s.last_patch_time for s in latest_snapshots 
        if s.last_patch_time
    ]
    average_patch_lag = 0
    if patch_times:
        # Handle both timezone-aware and naive datetimes
        lag_days = []
        for pt in patch_times:
            if pt.tzinfo is None:
                pt = pt.replace(tzinfo=timezone.utc)
            lag_days.append((now - pt).days)
        average_patch_lag = sum(lag_days) / len(lag_days)
    
    return DashboardMetrics(
        total_hosts=total_hosts,
        hosts_by_status=hosts_by_status,
        average_patch_lag_days=round(average_patch_lag, 1),
        total_pending_security_patches=total_pending_security,
        hosts_requiring_reboot=hosts_requiring_reboot,
        recently_updated_hosts=recently_updated
    )
