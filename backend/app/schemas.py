"""Pydantic schemas for API request/response models."""

from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID
from app.models import HostStatus, UserRole, AlertType, SeverityLevel, UpdateType


# Base schemas
class BaseSchema(BaseModel):
    """Base schema with common configuration."""
    class Config:
        from_attributes = True
        use_enum_values = True


# Host schemas
class HostBase(BaseSchema):
    """Base host schema."""
    hostname: str = Field(..., max_length=255)
    fqdn: Optional[str] = Field(None, max_length=255)
    ip_addresses: Optional[List[str]] = None
    os_name: str = Field(..., max_length=100)
    os_version: str = Field(..., max_length=50)
    architecture: Optional[str] = Field(None, max_length=50)


class HostCreate(HostBase):
    """Schema for creating a new host."""
    pass


class HostUpdate(BaseSchema):
    """Schema for updating a host."""
    hostname: Optional[str] = Field(None, max_length=255)
    fqdn: Optional[str] = Field(None, max_length=255)
    ip_addresses: Optional[List[str]] = None
    os_name: Optional[str] = Field(None, max_length=100)
    os_version: Optional[str] = Field(None, max_length=50)
    architecture: Optional[str] = Field(None, max_length=50)


class HostResponse(HostBase):
    """Schema for host response."""
    id: UUID
    agent_version: Optional[str] = None
    status: HostStatus
    created_at: datetime
    updated_at: Optional[datetime] = None


class HostSummary(BaseSchema):
    """Schema for host summary in dashboard."""
    id: UUID
    hostname: str
    fqdn: Optional[str]
    ip_addresses: Optional[List[str]]
    os_name: str
    os_version: str
    status: HostStatus
    agent_version: Optional[str] = None
    last_patch_time: Optional[datetime]
    pending_updates_count: int = 0
    pending_security_count: int = 0
    needs_reboot: bool = False
    days_since_patch: Optional[int] = None


# Host Snapshot schemas
class HostSnapshotBase(BaseSchema):
    """Base host snapshot schema."""
    kernel_version: Optional[str] = Field(None, max_length=100)
    last_boot_time: Optional[datetime] = None
    last_patch_time: Optional[datetime] = None
    pending_updates_count: int = 0
    pending_security_count: int = 0
    needs_reboot: bool = False


class HostSnapshotCreate(HostSnapshotBase):
    """Schema for creating a host snapshot."""
    host_id: UUID


class HostSnapshotResponse(HostSnapshotBase):
    """Schema for host snapshot response."""
    id: UUID
    host_id: UUID
    collected_at: datetime


# Pending Update schemas
class PendingUpdateBase(BaseSchema):
    """Base pending update schema."""
    package_name: str = Field(..., max_length=255)
    current_version: Optional[str] = Field(None, max_length=100)
    available_version: Optional[str] = Field(None, max_length=100)
    is_security: bool = False
    update_type: UpdateType = UpdateType.LOW


class PendingUpdateCreate(PendingUpdateBase):
    """Schema for creating a pending update."""
    host_snapshot_id: UUID


class PendingUpdateResponse(PendingUpdateBase):
    """Schema for pending update response."""
    id: UUID
    host_snapshot_id: UUID
    cves: List["CVEResponse"] = []


# CVE schemas
class CVEBase(BaseSchema):
    """Base CVE schema."""
    cve_id: str = Field(..., max_length=20)
    description: Optional[str] = None
    severity: SeverityLevel
    cvss_score: Optional[float] = None
    published_date: Optional[datetime] = None
    url: Optional[str] = Field(None, max_length=500)


class CVECreate(CVEBase):
    """Schema for creating a CVE."""
    pass


class CVEResponse(CVEBase):
    """Schema for CVE response."""
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None


# User schemas
class UserBase(BaseSchema):
    """Base user schema."""
    username: str = Field(..., max_length=50)
    email: str = Field(..., max_length=255)
    role: UserRole = UserRole.VIEWER


class UserCreate(UserBase):
    """Schema for creating a user."""
    password: str = Field(..., min_length=8)


class UserUpdate(BaseSchema):
    """Schema for updating a user."""
    username: Optional[str] = Field(None, max_length=50)
    email: Optional[str] = Field(None, max_length=255)
    role: Optional[UserRole] = None
    password: Optional[str] = Field(None, min_length=8)
    mfa_enabled: Optional[bool] = None


class UserResponse(UserBase):
    """Schema for user response."""
    id: UUID
    mfa_enabled: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    is_active: bool


# Alert schemas
class AlertBase(BaseSchema):
    """Base alert schema."""
    alert_type: AlertType
    severity: SeverityLevel
    message: str


class AlertCreate(AlertBase):
    """Schema for creating an alert."""
    host_id: UUID


class AlertResponse(AlertBase):
    """Schema for alert response."""
    id: UUID
    host_id: UUID
    triggered_at: datetime
    acknowledged: bool
    acknowledged_by: Optional[UUID] = None
    acknowledged_at: Optional[datetime] = None


class AlertAcknowledge(BaseSchema):
    """Schema for acknowledging an alert."""
    acknowledged: bool = True


# Tag schemas
class TagBase(BaseSchema):
    """Base tag schema."""
    name: str = Field(..., max_length=100)
    color: Optional[str] = Field(None, max_length=7)


class TagCreate(TagBase):
    """Schema for creating a tag."""
    pass


class TagResponse(TagBase):
    """Schema for tag response."""
    id: UUID
    created_at: datetime


# Dashboard schemas
class DashboardMetrics(BaseSchema):
    """Schema for dashboard metrics."""
    total_hosts: int
    hosts_by_status: Dict[str, int]
    average_patch_lag_days: float
    total_pending_security_patches: int
    hosts_requiring_reboot: int
    recently_updated_hosts: int


class HostDetailResponse(HostResponse):
    """Schema for detailed host view."""
    snapshots: List[HostSnapshotResponse] = []
    pending_updates: List[PendingUpdateResponse] = []
    alerts: List[AlertResponse] = []
    tags: List[TagResponse] = []


# Agent schemas
class AgentData(BaseSchema):
    """Schema for agent data submission."""
    hostname: str
    fqdn: Optional[str] = None
    ip_addresses: Optional[List[str]] = None
    os_name: str
    os_version: str
    architecture: Optional[str] = None
    agent_version: str
    kernel_version: Optional[str] = None
    last_boot_time: Optional[datetime] = None
    last_patch_time: Optional[datetime] = None
    pending_updates: List[Dict[str, Any]] = []
    needs_reboot: bool = False


class AgentResponse(BaseSchema):
    """Schema for agent response."""
    success: bool
    message: str
    next_collection_time: Optional[datetime] = None


# Report schemas
class ComplianceReport(BaseSchema):
    """Schema for compliance report."""
    total_hosts: int
    compliant_hosts: int
    compliance_percentage: float
    hosts_by_status: Dict[str, int]
    critical_vulnerabilities: int
    high_vulnerabilities: int
    medium_vulnerabilities: int
    low_vulnerabilities: int


class VulnerabilityReport(BaseSchema):
    """Schema for vulnerability report."""
    total_cves: int
    critical_cves: int
    high_cves: int
    medium_cves: int
    low_cves: int
    affected_hosts: int
    cves_by_severity: Dict[str, List[CVEResponse]]


# Settings schemas
class SettingsUpdate(BaseSchema):
    """Schema for updating settings."""
    settings: Dict[str, str]


class SettingsResponse(BaseSchema):
    """Schema for settings response."""
    settings: Dict[str, str]


# Token schemas
class Token(BaseSchema):
    """Schema for authentication token."""
    access_token: str
    token_type: str
    expires_in: int


# Update forward references
PendingUpdateResponse.model_rebuild()
