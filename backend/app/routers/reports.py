"""Reporting router."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from app.database import get_db
from app.models import Host, HostSnapshot, CVE, PendingUpdate, PendingUpdateCVE
from app.schemas import ComplianceReport, VulnerabilityReport
from app.auth import require_role

router = APIRouter()


@router.get("/compliance", response_model=ComplianceReport)
async def get_compliance_report(
    db: Session = Depends(get_db),
    current_user = Depends(require_role("viewer"))
):
    """Get compliance report."""
    # Total hosts
    total_hosts = db.query(Host).count()
    
    # Get latest snapshots for all hosts
    latest_snapshots = db.query(HostSnapshot).join(Host).filter(
        HostSnapshot.collected_at >= datetime.utcnow() - timedelta(days=7)
    ).all()
    
    # Count compliant hosts (no pending security updates, patched within 30 days)
    compliant_hosts = 0
    hosts_by_status = {"compliant": 0, "non_compliant": 0, "unknown": 0}
    
    critical_vulnerabilities = 0
    high_vulnerabilities = 0
    medium_vulnerabilities = 0
    low_vulnerabilities = 0
    
    for snapshot in latest_snapshots:
        # Check if host is compliant
        is_compliant = True
        
        # Check if patched within 30 days
        if snapshot.last_patch_time:
            days_since_patch = (datetime.utcnow() - snapshot.last_patch_time).days
            if days_since_patch > 30:
                is_compliant = False
        else:
            is_compliant = False
        
        # Check for pending security updates
        if snapshot.pending_security_count > 0:
            is_compliant = False
        
        if is_compliant:
            compliant_hosts += 1
            hosts_by_status["compliant"] += 1
        else:
            hosts_by_status["non_compliant"] += 1
        
        # Count vulnerabilities by severity
        pending_updates = db.query(PendingUpdate).filter(
            PendingUpdate.host_snapshot_id == snapshot.id
        ).all()
        
        for update in pending_updates:
            if update.is_security:
                # Get CVE information for this update
                cves = db.query(CVE).join(PendingUpdateCVE).filter(
                    PendingUpdateCVE.pending_update_id == update.id
                ).all()
                
                for cve in cves:
                    if cve.severity == "critical":
                        critical_vulnerabilities += 1
                    elif cve.severity == "high":
                        high_vulnerabilities += 1
                    elif cve.severity == "medium":
                        medium_vulnerabilities += 1
                    elif cve.severity == "low":
                        low_vulnerabilities += 1
    
    # Calculate compliance percentage
    compliance_percentage = (compliant_hosts / total_hosts * 100) if total_hosts > 0 else 0
    
    return ComplianceReport(
        total_hosts=total_hosts,
        compliant_hosts=compliant_hosts,
        compliance_percentage=round(compliance_percentage, 1),
        hosts_by_status=hosts_by_status,
        critical_vulnerabilities=critical_vulnerabilities,
        high_vulnerabilities=high_vulnerabilities,
        medium_vulnerabilities=medium_vulnerabilities,
        low_vulnerabilities=low_vulnerabilities
    )


@router.get("/vulnerabilities", response_model=VulnerabilityReport)
async def get_vulnerability_report(
    db: Session = Depends(get_db),
    current_user = Depends(require_role("viewer"))
):
    """Get vulnerability report."""
    # Get all CVEs from recent snapshots
    recent_snapshots = db.query(HostSnapshot).filter(
        HostSnapshot.collected_at >= datetime.utcnow() - timedelta(days=7)
    ).all()
    
    snapshot_ids = [s.id for s in recent_snapshots]
    
    # Get CVEs from pending updates
    cves = db.query(CVE).join(PendingUpdateCVE).join(PendingUpdate).filter(
        PendingUpdate.host_snapshot_id.in_(snapshot_ids)
    ).distinct().all()
    
    # Count by severity
    cve_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    cves_by_severity = {"critical": [], "high": [], "medium": [], "low": []}
    
    for cve in cves:
        cve_counts[cve.severity] += 1
        cves_by_severity[cve.severity].append(cve)
    
    # Count affected hosts
    affected_hosts = db.query(Host).join(HostSnapshot).join(PendingUpdate).join(PendingUpdateCVE).join(CVE).filter(
        HostSnapshot.id.in_(snapshot_ids)
    ).distinct().count()
    
    return VulnerabilityReport(
        total_cves=len(cves),
        critical_cves=cve_counts["critical"],
        high_cves=cve_counts["high"],
        medium_cves=cve_counts["medium"],
        low_cves=cve_counts["low"],
        affected_hosts=affected_hosts,
        cves_by_severity=cves_by_severity
    )
