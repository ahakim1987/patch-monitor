"""Agent data collection router."""

from datetime import datetime, timedelta
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Host, HostSnapshot, PendingUpdate, HostStatus
from app.schemas import AgentData, AgentResponse
from app.config import settings

router = APIRouter()

# Path to agent files (mounted at /agent in Docker container)
AGENT_DIR = Path("/agent")


def verify_agent_token(token: str) -> bool:
    """Verify agent authentication token."""
    return token == settings.agent_secret_key


@router.post("/data", response_model=AgentResponse)
async def submit_agent_data(
    data: AgentData,
    token: str = Depends(verify_agent_token),
    db: Session = Depends(get_db)
):
    """Submit data from agent."""
    try:
        # Find or create host
        host = db.query(Host).filter(Host.hostname == data.hostname).first()
        
        if not host:
            # Create new host
            host = Host(
                hostname=data.hostname,
                fqdn=data.fqdn,
                ip_addresses=data.ip_addresses,
                os_name=data.os_name,
                os_version=data.os_version,
                architecture=data.architecture,
                agent_version=data.agent_version,
                status=HostStatus.ONLINE
            )
            db.add(host)
            db.commit()
            db.refresh(host)
        else:
            # Update existing host
            host.fqdn = data.fqdn
            host.ip_addresses = data.ip_addresses
            host.os_name = data.os_name
            host.os_version = data.os_version
            host.architecture = data.architecture
            host.agent_version = data.agent_version
            host.status = HostStatus.ONLINE
            host.updated_at = datetime.utcnow()
        
        # Create new snapshot
        snapshot = HostSnapshot(
            host_id=host.id,
            kernel_version=data.kernel_version,
            last_boot_time=data.last_boot_time,
            last_patch_time=data.last_patch_time,
            pending_updates_count=len(data.pending_updates),
            pending_security_count=sum(1 for update in data.pending_updates if update.get('is_security', False)),
            needs_reboot=data.needs_reboot
        )
        db.add(snapshot)
        db.commit()
        db.refresh(snapshot)
        
        # Add pending updates
        for update_data in data.pending_updates:
            pending_update = PendingUpdate(
                host_snapshot_id=snapshot.id,
                package_name=update_data.get('package_name', ''),
                current_version=update_data.get('current_version'),
                available_version=update_data.get('available_version'),
                is_security=update_data.get('is_security', False),
                update_type=update_data.get('update_type', 'low')
            )
            db.add(pending_update)
        
        db.commit()
        
        # Calculate next collection time
        next_collection = datetime.utcnow() + timedelta(minutes=settings.collection_interval_minutes)
        
        return AgentResponse(
            success=True,
            message="Data submitted successfully",
            next_collection_time=next_collection
        )
        
    except Exception as e:
        db.rollback()
        return AgentResponse(
            success=False,
            message=f"Failed to submit data: {str(e)}"
        )


@router.get("/config")
async def get_agent_config(
    token: str = Depends(verify_agent_token)
):
    """Get agent configuration."""
    return {
        "collection_interval_minutes": settings.collection_interval_minutes,
        "server_url": f"http://{settings.host}:{settings.port}",
        "api_endpoint": "/api/agents/data"
    }


@router.get("/download/install.sh")
async def download_install_script():
    """Download agent installation script."""
    file_path = AGENT_DIR / "install.sh"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Installation script not found")
    return FileResponse(
        path=str(file_path),
        filename="install.sh",
        media_type="application/x-sh"
    )


@router.get("/download/main.py")
async def download_agent_main():
    """Download agent main script."""
    file_path = AGENT_DIR / "main.py"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Agent script not found")
    return FileResponse(
        path=str(file_path),
        filename="main.py",
        media_type="text/x-python"
    )


@router.get("/download/requirements.txt")
async def download_requirements():
    """Download agent requirements file."""
    file_path = AGENT_DIR / "requirements.txt"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Requirements file not found")
    return FileResponse(
        path=str(file_path),
        filename="requirements.txt",
        media_type="text/plain"
    )
