"""Database models for the patch monitoring system."""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Float, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid
import enum


class HostStatus(str, enum.Enum):
    """Host status enumeration."""
    ONLINE = "online"
    OFFLINE = "offline"
    ERROR = "error"


class UserRole(str, enum.Enum):
    """User role enumeration."""
    ADMIN = "admin"
    OPERATOR = "operator"
    VIEWER = "viewer"


class AlertType(str, enum.Enum):
    """Alert type enumeration."""
    PATCH_LAG = "patch_lag"
    CRITICAL_CVE = "critical_cve"
    OFFLINE = "offline"
    REBOOT_NEEDED = "reboot_needed"


class SeverityLevel(str, enum.Enum):
    """Severity level enumeration."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class UpdateType(str, enum.Enum):
    """Update type enumeration."""
    CRITICAL = "critical"
    IMPORTANT = "important"
    MODERATE = "moderate"
    LOW = "low"


class Host(Base):
    """Host model representing monitored Linux systems."""
    __tablename__ = "hosts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hostname = Column(String(255), nullable=False, unique=True)
    fqdn = Column(String(255))
    ip_addresses = Column(ARRAY(String(50)))
    os_name = Column(String(100), nullable=False)
    os_version = Column(String(50), nullable=False)
    architecture = Column(String(50))
    agent_version = Column(String(20))
    status = Column(SQLEnum(HostStatus), default=HostStatus.OFFLINE)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    snapshots = relationship("HostSnapshot", back_populates="host", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="host", cascade="all, delete-orphan")
    tags = relationship("HostTag", back_populates="host", cascade="all, delete-orphan")


class HostSnapshot(Base):
    """Time-series data for host patch status."""
    __tablename__ = "host_snapshots"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    host_id = Column(UUID(as_uuid=True), ForeignKey("hosts.id"), nullable=False)
    collected_at = Column(DateTime(timezone=True), server_default=func.now())
    kernel_version = Column(String(100))
    last_boot_time = Column(DateTime(timezone=True))
    last_patch_time = Column(DateTime(timezone=True))
    pending_updates_count = Column(Integer, default=0)
    pending_security_count = Column(Integer, default=0)
    needs_reboot = Column(Boolean, default=False)
    
    # Relationships
    host = relationship("Host", back_populates="snapshots")
    pending_updates = relationship("PendingUpdate", back_populates="snapshot", cascade="all, delete-orphan")


class PendingUpdate(Base):
    """Pending package updates for a host."""
    __tablename__ = "pending_updates"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    host_snapshot_id = Column(UUID(as_uuid=True), ForeignKey("host_snapshots.id"), nullable=False)
    package_name = Column(String(255), nullable=False)
    current_version = Column(String(100))
    available_version = Column(String(100))
    is_security = Column(Boolean, default=False)
    update_type = Column(SQLEnum(UpdateType), default=UpdateType.LOW)
    
    # Relationships
    snapshot = relationship("HostSnapshot", back_populates="pending_updates")
    cves = relationship("PendingUpdateCVE", back_populates="pending_update", cascade="all, delete-orphan")


class CVE(Base):
    """Common Vulnerabilities and Exposures database."""
    __tablename__ = "cves"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cve_id = Column(String(20), unique=True, nullable=False)  # e.g., CVE-2024-1234
    description = Column(Text)
    severity = Column(SQLEnum(SeverityLevel), nullable=False)
    cvss_score = Column(Float)
    published_date = Column(DateTime(timezone=True))
    url = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    pending_updates = relationship("PendingUpdateCVE", back_populates="cve", cascade="all, delete-orphan")


class PendingUpdateCVE(Base):
    """Junction table linking pending updates to CVEs."""
    __tablename__ = "pending_update_cves"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pending_update_id = Column(UUID(as_uuid=True), ForeignKey("pending_updates.id"), nullable=False)
    cve_id = Column(UUID(as_uuid=True), ForeignKey("cves.id"), nullable=False)
    
    # Relationships
    pending_update = relationship("PendingUpdate", back_populates="cves")
    cve = relationship("CVE", back_populates="pending_updates")


class User(Base):
    """User accounts for the system."""
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.VIEWER)
    mfa_enabled = Column(Boolean, default=False)
    last_login = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)
    
    # Relationships
    alerts = relationship("Alert", back_populates="acknowledged_by_user")


class Alert(Base):
    """System alerts and notifications."""
    __tablename__ = "alerts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    host_id = Column(UUID(as_uuid=True), ForeignKey("hosts.id"), nullable=False)
    alert_type = Column(SQLEnum(AlertType), nullable=False)
    severity = Column(SQLEnum(SeverityLevel), nullable=False)
    message = Column(Text, nullable=False)
    triggered_at = Column(DateTime(timezone=True), server_default=func.now())
    acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    acknowledged_at = Column(DateTime(timezone=True))
    
    # Relationships
    host = relationship("Host", back_populates="alerts")
    acknowledged_by_user = relationship("User", back_populates="alerts")


class Tag(Base):
    """Tags for categorizing hosts."""
    __tablename__ = "tags"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    color = Column(String(7))  # Hex color code
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class HostTag(Base):
    """Junction table for host-tag relationships."""
    __tablename__ = "host_tags"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    host_id = Column(UUID(as_uuid=True), ForeignKey("hosts.id"), nullable=False)
    tag_id = Column(UUID(as_uuid=True), ForeignKey("tags.id"), nullable=False)
    
    # Relationships
    host = relationship("Host", back_populates="tags")
    tag = relationship("Tag")
