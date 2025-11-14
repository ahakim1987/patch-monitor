# CLAUDE.md - AI Assistant Guide for Patch Monitor

This document provides comprehensive guidance for AI assistants (like Claude) working with the Linux Patch Management Monitoring Tool codebase.

**Last Updated**: 2025-11-14
**Version**: 1.0
**License**: MIT

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Repository Structure](#repository-structure)
4. [Development Workflows](#development-workflows)
5. [Code Conventions & Patterns](#code-conventions--patterns)
6. [Database Schema & Models](#database-schema--models)
7. [API Structure](#api-structure)
8. [Frontend Architecture](#frontend-architecture)
9. [Agent System](#agent-system)
10. [Testing Guidelines](#testing-guidelines)
11. [Common Tasks & Examples](#common-tasks--examples)
12. [Troubleshooting](#troubleshooting)

---

## Project Overview

### What is Patch Monitor?

A lightweight, **read-only** Linux patch management monitoring tool designed for SecOps teams to gain real-time visibility into patching status across their infrastructure.

### Core Capabilities

- **Multi-Distribution Support**: Ubuntu, Debian, RHEL, CentOS, Rocky Linux, AlmaLinux, Fedora
- **Real-time Dashboard**: Color-coded status indicators (Green/Yellow/Orange/Red/Gray)
- **CVE Mapping**: Cross-reference pending patches with vulnerability databases
- **Agent-based Monitoring**: Lightweight Python agents (< 50MB RAM, < 1% CPU)
- **Alerting**: Configurable alerts for critical patch gaps and system issues
- **Compliance Reporting**: Automated reports for audit and compliance needs

### Key Design Principles

1. **Read-only Monitoring**: Does NOT perform automated patch deployment
2. **Minimal Agent Footprint**: Runs with minimal privileges and resources
3. **SecOps-First**: Built for security operations teams, not general IT
4. **Multi-tenant Aware**: Supports tagging and grouping for different teams
5. **Real-time Data**: 30-second auto-refresh on dashboard

---

## Architecture & Technology Stack

### High-Level Architecture

```
┌─────────────┐
│   Browser   │ (React 18 + TypeScript + Tailwind CSS)
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────────────────────────┐
│      Web Application Server     │
│  (FastAPI + React SPA)          │
│  ┌──────────┐    ┌───────────┐ │
│  │ REST API │    │ WebSocket │ │
│  └────┬─────┘    └─────┬─────┘ │
└───────┼────────────────┼───────┘
        │                │
        ▼                ▼
┌────────────────────────────────┐
│   PostgreSQL + TimescaleDB     │
│   (Time-series optimized)      │
└────────────────────────────────┘
        ▲
        │
┌───────┴──────────┐
│  Collection      │ (Celery + Redis)
│  Scheduler       │
└────────┬─────────┘
         │
         ▼
┌─────────────────────────────────┐
│     Linux Hosts (Network)       │
│  ┌───────┐  ┌───────┐  ┌───────┐│
│  │ Agent │  │ Agent │  │ Agent ││
│  └───────┘  └───────┘  └───────┘│
└─────────────────────────────────┘
```

### Technology Stack

#### Backend
- **Language**: Python 3.11+
- **Framework**: FastAPI 0.100+
- **Database**: PostgreSQL 15 + TimescaleDB extension
- **ORM**: SQLAlchemy 2.0+ (sync and async support)
- **Task Queue**: Celery 5.3+
- **Message Broker**: Redis 7+
- **Authentication**: JWT (HS256) with PBKDF2-SHA256 password hashing
- **Validation**: Pydantic 2.0+

**Key Dependencies**: 52 packages total
- `fastapi`, `uvicorn[standard]`
- `sqlalchemy`, `asyncpg`, `psycopg2-binary`
- `celery[redis]`
- `pydantic`, `pydantic-settings`
- `python-jose[cryptography]`, `passlib`
- `python-multipart`, `python-dotenv`

#### Frontend
- **Framework**: React 18.2.0 with TypeScript 5.2.2
- **Build Tool**: Vite 4.5.0
- **UI Framework**: Tailwind CSS 3.3.5
- **Component Library**: Custom components (no shadcn/ui yet)
- **State Management**:
  - Zustand 4.4.7 (global auth state)
  - React Query 3.39.3 (server state)
- **Routing**: React Router 6.20.1
- **HTTP Client**: Axios 1.6.2
- **Charts**: Recharts 2.8.0
- **Icons**: Lucide React 0.294.0

#### Agent
- **Language**: Python 3.8+ (for broad compatibility)
- **Dependencies**: Only 3 minimal packages
  - `requests` (HTTP client)
  - `psutil` (system info)
  - `distro` (OS detection)
- **Deployment**: systemd service
- **Version**: 1.0.0

#### Deployment
- **Containerization**: Docker + Docker Compose
- **Services**: 7 containers (postgres, redis, db-init, backend, frontend, celery-worker, celery-beat)
- **Orchestration**: Docker Compose 3.8
- **Production**: Kubernetes-ready (future)

---

## Repository Structure

```
/home/user/patch-monitor/
├── agent/                          # Python agent for data collection
│   ├── install.sh                  # Multi-distro installation script (243+ lines)
│   ├── main.py                     # Agent application (632 lines)
│   └── requirements.txt            # 3 minimal dependencies
├── backend/                        # FastAPI backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── auth.py                 # Auth utilities (125 lines)
│   │   ├── celery.py               # Celery configuration
│   │   ├── celery_app.py           # Celery app instance
│   │   ├── config.py               # Settings (64 lines)
│   │   ├── database.py             # DB session management (36 lines)
│   │   ├── main.py                 # FastAPI app (161 lines)
│   │   ├── models.py               # 11 SQLAlchemy models (208 lines)
│   │   ├── schemas.py              # 30+ Pydantic schemas (303 lines)
│   │   ├── tasks.py                # Celery background tasks (183 lines)
│   │   └── routers/                # API endpoint routers
│   │       ├── __init__.py
│   │       ├── agents.py           # Agent data submission (196 lines)
│   │       ├── alerts.py           # Alert management (100 lines)
│   │       ├── auth.py             # Login/logout (57 lines)
│   │       ├── hosts.py            # Host CRUD + metrics (300 lines)
│   │       ├── reports.py          # Reporting (137 lines)
│   │       ├── settings.py         # Settings management (139 lines)
│   │       └── users.py            # User management (135 lines)
│   ├── Dockerfile                  # Backend container
│   ├── init.sql                    # TimescaleDB initialization
│   ├── init_db.py                  # Database initialization script
│   └── requirements.txt            # 52 packages
├── frontend/                       # React + TypeScript frontend
│   ├── src/
│   │   ├── api/                    # API client layer
│   │   │   ├── auth.ts
│   │   │   ├── client.ts           # Axios client with interceptors
│   │   │   ├── hosts.ts            # Host API (149 lines)
│   │   │   ├── reports.ts
│   │   │   ├── settings.ts
│   │   │   └── users.ts
│   │   ├── components/             # Reusable React components
│   │   │   ├── Header.tsx
│   │   │   ├── HostCard.tsx
│   │   │   ├── Layout.tsx          # Main layout (24 lines)
│   │   │   ├── MetricsCard.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── pages/                  # Page components
│   │   │   ├── DashboardPage.tsx   # Main dashboard (284 lines)
│   │   │   ├── HostDetailPage.tsx
│   │   │   ├── HostsPage.tsx       # Host table (290 lines)
│   │   │   ├── LoginPage.tsx
│   │   │   ├── ReportsPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   ├── stores/                 # State management
│   │   │   └── authStore.ts        # Zustand auth store (38 lines)
│   │   ├── App.tsx                 # Route configuration (34 lines)
│   │   ├── index.css               # Global styles
│   │   └── main.tsx                # React entry point (27 lines)
│   ├── Dockerfile                  # Frontend container
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js          # Tailwind configuration
│   ├── tsconfig.json               # TypeScript config
│   ├── tsconfig.node.json
│   └── vite.config.ts              # Vite build config
├── docs/                           # Documentation
│   ├── agent-deployment.md
│   ├── api.md
│   ├── installation.md
│   └── user-guide.md
├── docker-compose.yml              # Multi-service orchestration
├── env.example                     # Environment variables template
├── .gitignore                      # Git ignore rules
├── ISSUES_TRACKER.md               # Issue tracking
├── LICENSE                         # MIT License
├── PRD.md                          # Product Requirements Document
└── README.md                       # Main documentation
```

### Key Files to Know

- **`backend/app/main.py`**: FastAPI app initialization, CORS, middleware, routers
- **`backend/app/models.py`**: 11 database models with relationships
- **`backend/app/schemas.py`**: 30+ Pydantic schemas for API validation
- **`backend/app/auth.py`**: JWT tokens, password hashing, RBAC
- **`frontend/src/App.tsx`**: Route configuration with auth guard
- **`frontend/src/stores/authStore.ts`**: Global auth state with persistence
- **`agent/main.py`**: Complete agent implementation (632 lines)
- **`agent/install.sh`**: Multi-distro installation script
- **`docker-compose.yml`**: 7 services orchestration

---

## Development Workflows

### Initial Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd patch-monitor

# 2. Configure environment
cp env.example .env
# Edit .env with your configuration

# 3. Start all services
docker-compose up -d

# 4. Access dashboard
# Frontend: http://localhost:3001
# Backend API: http://localhost:8001
# API Docs: http://localhost:8001/docs
```

### Backend Development

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database initialization (one-time)
python init_db.py

# Start development server (hot-reload enabled)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run Celery worker (separate terminal)
celery -A app.celery worker --loglevel=info

# Run Celery beat scheduler (separate terminal)
celery -A app.celery beat --loglevel=info
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start development server (hot-reload enabled)
npm run dev
# Access: http://localhost:3000

# Build for production
npm run build

# Preview production build
npm run preview
```

### Agent Development

```bash
cd agent

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run agent once (test mode)
python main.py \
  --server-url http://localhost:8001 \
  --token your-agent-token \
  --once \
  --verbose

# Install as systemd service
sudo ./install.sh \
  --server-url http://your-server.com \
  --token your-agent-token
```

### Docker Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f celery-worker

# Restart service
docker-compose restart backend

# Rebuild service
docker-compose up -d --build backend

# Stop all services
docker-compose down

# Reset everything (WARNING: deletes data)
docker-compose down -v
```

### Database Management

```bash
# Access database
docker-compose exec postgres psql -U patchmonitor -d patchmonitor

# Run migrations (currently manual via init_db.py)
docker-compose exec backend python init_db.py

# Backup database
docker-compose exec postgres pg_dump -U patchmonitor patchmonitor > backup.sql

# Restore database
cat backup.sql | docker-compose exec -T postgres psql -U patchmonitor patchmonitor
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes, commit
git add .
git commit -m "Add feature: description"

# Push to remote
git push origin feature/your-feature-name

# Create pull request (via GitHub UI)
```

**Branch Naming Conventions**:
- `feature/`: New features
- `fix/`: Bug fixes
- `refactor/`: Code refactoring
- `docs/`: Documentation updates
- `test/`: Test additions or updates

**Commit Message Format**:
```
<type>: <short description>

<optional longer description>

<optional footer>
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `style`

---

## Code Conventions & Patterns

### Backend (Python) Conventions

#### Code Style
- **PEP 8** compliance (enforced)
- **Line length**: 100 characters max
- **Indentation**: 4 spaces
- **Quotes**: Double quotes for strings
- **Imports**: Organized (standard lib → third-party → local)
- **Type hints**: Used throughout (Python 3.11+ style)

#### Naming Conventions
```python
# Classes: PascalCase
class HostSnapshot:
    pass

# Functions/methods: snake_case
def get_host_by_id(host_id: str):
    pass

# Constants: UPPER_SNAKE_CASE
COLLECTION_INTERVAL_MINUTES = 60

# Private: _leading_underscore
def _internal_helper():
    pass

# Database models: PascalCase (inherit from Base)
class Host(Base):
    __tablename__ = "hosts"  # lowercase, plural

# Pydantic schemas: PascalCase + suffix
class HostCreate(BaseModel):
    pass

class HostResponse(BaseModel):
    pass
```

#### Database Model Patterns

```python
# Standard model structure
class YourModel(Base):
    """Descriptive docstring."""
    __tablename__ = "your_models"  # lowercase, plural

    # Primary key: UUID
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Fields
    field_name = Column(String(255), nullable=False)

    # Timestamps (always include)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    related = relationship("RelatedModel", back_populates="your_model")
```

**Key Patterns**:
1. **UUID primary keys** for all models
2. **Timestamps**: `created_at`, `updated_at` auto-generated
3. **Enums**: Use `str, enum.Enum` for constrained values
4. **Cascade deletes**: `cascade="all, delete-orphan"` on parent relationships
5. **Back-populates**: Always define bidirectional relationships

#### Pydantic Schema Patterns

```python
# Base schema (shared fields)
class HostBase(BaseModel):
    hostname: str
    os_name: str
    os_version: str

# Create schema (input)
class HostCreate(HostBase):
    pass

# Update schema (partial input)
class HostUpdate(BaseModel):
    hostname: Optional[str] = None
    os_name: Optional[str] = None

# Response schema (output)
class HostResponse(HostBase):
    id: UUID
    status: HostStatus
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True  # For ORM compatibility
```

#### API Route Patterns

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user, require_role
from app.models import User
from app.schemas import YourCreate, YourResponse

router = APIRouter(prefix="/api/your-resource", tags=["Your Resource"])

@router.get("/", response_model=list[YourResponse])
async def list_items(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all items."""
    items = db.query(YourModel).offset(skip).limit(limit).all()
    return items

@router.post("/", response_model=YourResponse, status_code=status.HTTP_201_CREATED)
async def create_item(
    item: YourCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("operator"))
):
    """Create new item (operator+ only)."""
    db_item = YourModel(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item
```

**API Route Conventions**:
1. **Router prefix**: `/api/resource-name` (kebab-case, plural)
2. **Tags**: Used for OpenAPI grouping
3. **Response models**: Always specify for type safety
4. **Dependencies**: Use `Depends()` for auth, DB session
5. **Error handling**: Use `HTTPException` with proper status codes
6. **Pagination**: `skip` and `limit` params (default: 0, 100)

#### Authentication & Authorization

```python
# Role hierarchy: viewer → operator → admin
ROLE_HIERARCHY = {
    "viewer": 0,
    "operator": 1,
    "admin": 2
}

# Check if user has required role
def has_role(user: User, required_role: str) -> bool:
    """Check if user has required role or higher."""
    user_level = ROLE_HIERARCHY.get(user.role.value, -1)
    required_level = ROLE_HIERARCHY.get(required_role, 999)
    return user_level >= required_level

# Dependency for role-based access
def require_role(role: str):
    """Dependency to require a specific role."""
    def role_checker(current_user: User = Depends(get_current_user)):
        if not has_role(current_user, role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker

# Usage in routes
@router.delete("/{id}")
async def delete_item(
    id: UUID,
    current_user: User = Depends(require_role("admin"))  # Admin only
):
    """Delete item (admin only)."""
    pass
```

**Permission Levels**:
- **Viewer**: Read-only access to all data
- **Operator**: Viewer + acknowledge alerts, add notes, export reports
- **Admin**: Operator + manage users, hosts, settings, delete data

#### Celery Task Patterns

```python
from app.celery import celery_app
from app.database import SessionLocal

@celery_app.task
def your_background_task(param1: str, param2: int):
    """Background task description."""
    db = SessionLocal()
    try:
        # Your task logic here
        result = process_something(param1, param2)
        db.commit()
        return result
    except Exception as e:
        db.rollback()
        raise
    finally:
        db.close()

# Schedule periodic tasks in celery.py
celery_app.conf.beat_schedule = {
    "task-name": {
        "task": "app.tasks.your_background_task",
        "schedule": crontab(hour="*/2"),  # Every 2 hours
    },
}
```

### Frontend (TypeScript/React) Conventions

#### Code Style
- **ESLint** + **Prettier** (enforced)
- **Line length**: 100 characters max
- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Required
- **Arrow functions**: Preferred

#### Naming Conventions
```typescript
// Components: PascalCase
const HostCard = () => { /* ... */ }

// Hooks: camelCase with "use" prefix
const useAuth = () => { /* ... */ }

// Functions: camelCase
const fetchHosts = async () => { /* ... */ }

// Constants: UPPER_SNAKE_CASE
const API_BASE_URL = 'http://localhost:8001'

// Types/Interfaces: PascalCase
interface Host {
  id: string
  hostname: string
}

// File names: Match component name (PascalCase.tsx) or camelCase.ts
// - HostCard.tsx (component)
// - authStore.ts (non-component)
```

#### Component Patterns

```typescript
// Functional components with TypeScript
import React from 'react'

interface HostCardProps {
  host: Host
  onClick?: (host: Host) => void
}

const HostCard: React.FC<HostCardProps> = ({ host, onClick }) => {
  const handleClick = () => {
    onClick?.(host)
  }

  return (
    <div onClick={handleClick} className="p-4 border rounded">
      <h3 className="font-bold">{host.hostname}</h3>
      <p className="text-sm text-gray-600">{host.os_name}</p>
    </div>
  )
}

export default HostCard
```

#### API Client Patterns

```typescript
// API client with TypeScript
import client from './client'

export interface Host {
  id: string
  hostname: string
  status: 'online' | 'offline' | 'error'
  // ... other fields
}

export const hostsApi = {
  list: async (params?: { status?: string; search?: string }) => {
    const { data } = await client.get<Host[]>('/api/hosts', { params })
    return data
  },

  get: async (id: string) => {
    const { data } = await client.get<Host>(`/api/hosts/${id}`)
    return data
  },

  create: async (host: Partial<Host>) => {
    const { data } = await client.post<Host>('/api/hosts', host)
    return data
  },
}
```

#### State Management Patterns

```typescript
// Zustand store
import create from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  token: string | null
  user: User | null
  setAuth: (token: string, user: User) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      clearAuth: () => set({ token: null, user: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
)
```

```typescript
// React Query usage
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { hostsApi } from '../api/hosts'

// Fetch data
const { data: hosts, isLoading, error } = useQuery(
  ['hosts', filters],  // Query key
  () => hostsApi.list(filters),  // Query function
  {
    refetchInterval: 30000,  // Auto-refresh every 30s
    staleTime: 5 * 60 * 1000,  // Consider stale after 5 minutes
  }
)

// Mutate data
const queryClient = useQueryClient()
const mutation = useMutation(
  (host: Partial<Host>) => hostsApi.create(host),
  {
    onSuccess: () => {
      queryClient.invalidateQueries(['hosts'])  // Refetch hosts
    },
  }
)
```

#### Styling Patterns

```typescript
// Tailwind CSS classes
<div className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
  <h2 className="text-xl font-bold text-gray-900">Title</h2>
  <p className="mt-2 text-sm text-gray-600">Description</p>
</div>

// Status colors (defined in tailwind.config.js)
const statusColors = {
  online: 'bg-green-500 text-white',
  offline: 'bg-red-500 text-white',
  error: 'bg-gray-500 text-white',
}

<span className={`px-2 py-1 rounded ${statusColors[host.status]}`}>
  {host.status}
</span>
```

**Status Color System**:
- 🟢 **Green** (`green-500`): Fully patched (< 7 days, no pending updates)
- 🟡 **Yellow** (`amber-500`): Minor updates pending (7-30 days, non-security)
- 🟠 **Orange** (`orange-500`): Attention needed (30-60 days or security updates)
- 🔴 **Red** (`red-500`): Critical (> 60 days or critical security patches)
- ⚫ **Gray** (`gray-500`): Unknown/offline/error

### Agent (Python) Conventions

#### Design Principles
1. **Minimal dependencies**: Only 3 packages (requests, psutil, distro)
2. **Non-root execution**: Run as `patchmonitor` user
3. **Read-only operations**: Never modify system state
4. **Error resilience**: Continue on non-critical errors
5. **Performance**: Batch operations, cache data

#### Multi-Distribution Support

```python
# Package manager detection order
def detect_package_manager():
    """Auto-detect package manager."""
    if shutil.which("apt"):
        return "apt"
    elif shutil.which("dnf"):
        return "dnf"
    elif shutil.which("yum"):
        return "yum"
    elif shutil.which("zypper"):
        return "zypper"
    elif shutil.which("pacman"):
        return "pacman"
    else:
        return None
```

**Supported Package Managers**:
- **APT**: Ubuntu, Debian, Linux Mint
- **DNF**: Fedora 22+, RHEL 8+, CentOS Stream 8+, Rocky Linux, AlmaLinux
- **YUM**: CentOS 7, RHEL 7, older Fedora
- **Zypper**: openSUSE, SUSE Linux Enterprise
- **Pacman**: Arch Linux, Manjaro

#### Data Collection Pattern

```python
def collect_data():
    """Collect all host data."""
    data = {
        "hostname": socket.gethostname(),
        "fqdn": socket.getfqdn(),
        "ip_addresses": get_ip_addresses(),
        "os_name": distro.name(),
        "os_version": distro.version(),
        "architecture": platform.machine(),
        "kernel_version": platform.release(),
        "last_boot_time": get_last_boot_time(),
        "pending_updates": get_pending_updates(),
        "agent_version": VERSION,
    }
    return data
```

---

## Database Schema & Models

### Entity Relationship Overview

```
User
  ↓ (acknowledged_by)
Alert → Host → HostSnapshot → PendingUpdate ↔ CVE
         ↓                      (many-to-many via PendingUpdateCVE)
       HostTag → Tag
```

### Core Models (11 Total)

#### 1. Host
Primary entity representing monitored Linux systems.

```python
class Host(Base):
    __tablename__ = "hosts"

    id: UUID                    # Primary key
    hostname: str               # Unique hostname
    fqdn: str                   # Fully qualified domain name
    ip_addresses: list[str]     # Array of IP addresses
    os_name: str                # OS distribution name
    os_version: str             # OS version
    architecture: str           # System architecture (x86_64, ARM)
    agent_version: str          # Agent version string
    status: HostStatus          # online | offline | error
    created_at: datetime
    updated_at: datetime

    # Relationships
    snapshots: list[HostSnapshot]
    alerts: list[Alert]
    tags: list[HostTag]
```

#### 2. HostSnapshot (TimescaleDB Hypertable)
Time-series data for host patch status. Optimized for temporal queries.

```python
class HostSnapshot(Base):
    __tablename__ = "host_snapshots"

    id: UUID
    host_id: UUID               # Foreign key to Host
    collected_at: datetime      # Timestamp (hypertable partition key)
    kernel_version: str
    last_boot_time: datetime
    last_patch_time: datetime
    pending_updates_count: int
    pending_security_count: int
    needs_reboot: bool

    # Relationships
    host: Host
    pending_updates: list[PendingUpdate]
```

**TimescaleDB Features**:
- Automatic partitioning by `collected_at`
- Efficient time-based queries
- Data retention policies (configurable)
- Continuous aggregates (future)

#### 3. PendingUpdate
Individual package updates pending on a host.

```python
class PendingUpdate(Base):
    __tablename__ = "pending_updates"

    id: UUID
    host_snapshot_id: UUID      # Foreign key to HostSnapshot
    package_name: str
    current_version: str
    available_version: str
    is_security: bool
    update_type: UpdateType     # critical | important | moderate | low

    # Relationships
    snapshot: HostSnapshot
    cves: list[CVE]             # Many-to-many
```

#### 4. CVE
Vulnerability database entries.

```python
class CVE(Base):
    __tablename__ = "cves"

    id: UUID
    cve_id: str                 # CVE-2024-1234 (unique)
    description: str
    severity: SeverityLevel     # critical | high | medium | low
    cvss_score: float
    published_date: datetime
    url: str

    # Relationships
    pending_updates: list[PendingUpdate]  # Many-to-many
```

#### 5. PendingUpdateCVE
Junction table for CVE mappings (many-to-many).

```python
class PendingUpdateCVE(Base):
    __tablename__ = "pending_update_cves"

    pending_update_id: UUID     # Foreign key
    cve_id: UUID                # Foreign key
```

#### 6. User
Authentication and authorization.

```python
class User(Base):
    __tablename__ = "users"

    id: UUID
    username: str               # Unique
    email: str
    password_hash: str          # PBKDF2-SHA256
    role: UserRole              # admin | operator | viewer
    mfa_enabled: bool
    mfa_secret: str             # TOTP secret (optional)
    last_login: datetime
    is_active: bool
    created_at: datetime
    updated_at: datetime

    # Relationships
    acknowledged_alerts: list[Alert]
```

#### 7. Alert
System alerts and notifications.

```python
class Alert(Base):
    __tablename__ = "alerts"

    id: UUID
    host_id: UUID               # Foreign key to Host
    alert_type: AlertType       # patch_lag | critical_cve | offline | reboot_needed
    severity: SeverityLevel     # critical | high | medium | low
    message: str
    triggered_at: datetime
    acknowledged: bool
    acknowledged_by: UUID       # Foreign key to User
    acknowledged_at: datetime

    # Relationships
    host: Host
    acknowledged_by_user: User
```

**Alert Types**:
- `patch_lag`: Host not patched in X days (default: 30)
- `critical_cve`: Critical security patches available
- `offline`: Host offline/unreachable > 2 hours
- `reboot_needed`: Host requires reboot for > X days

#### 8. Tag
Categorization tags for hosts.

```python
class Tag(Base):
    __tablename__ = "tags"

    id: UUID
    name: str                   # Unique
    color: str                  # Hex color code
    created_at: datetime

    # Relationships
    hosts: list[HostTag]
```

#### 9. HostTag
Junction table for host-tag relationships (many-to-many).

```python
class HostTag(Base):
    __tablename__ = "host_tags"

    host_id: UUID               # Foreign key
    tag_id: UUID                # Foreign key
```

#### 10. Settings
Key-value configuration storage.

```python
class Settings(Base):
    __tablename__ = "settings"

    id: UUID
    key: str                    # Unique setting key
    value: str                  # JSON-encoded value
    updated_at: datetime
    updated_by: UUID            # Foreign key to User
```

**Common Settings**:
- `agent_token`: Agent authentication token
- `collection_interval`: Data collection interval (minutes)
- `smtp_settings`: Email configuration (JSON)
- `slack_webhook`: Slack integration URL
- `alert_thresholds`: Alert trigger thresholds (JSON)

#### 11. Enumerations

```python
class HostStatus(str, enum.Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    ERROR = "error"

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    OPERATOR = "operator"
    VIEWER = "viewer"

class AlertType(str, enum.Enum):
    PATCH_LAG = "patch_lag"
    CRITICAL_CVE = "critical_cve"
    OFFLINE = "offline"
    REBOOT_NEEDED = "reboot_needed"

class SeverityLevel(str, enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class UpdateType(str, enum.Enum):
    CRITICAL = "critical"
    IMPORTANT = "important"
    MODERATE = "moderate"
    LOW = "low"
```

### Database Initialization

```python
# backend/init_db.py
from sqlalchemy import create_engine
from app.database import Base
from app.models import User
from app.auth import get_password_hash
from app.config import settings

def init_database():
    """Initialize database with tables and admin user."""
    engine = create_engine(settings.database_url)

    # Create all tables
    Base.metadata.create_all(bind=engine)

    # Create default admin user
    db = SessionLocal()
    admin = User(
        username="admin",
        email="admin@localhost",
        password_hash=get_password_hash("admin123"),
        role=UserRole.ADMIN,
        is_active=True
    )
    db.add(admin)
    db.commit()
```

**Default Credentials**:
- **Username**: `admin`
- **Password**: `admin123`
- **⚠️ CHANGE IN PRODUCTION!**

---

## API Structure

### API Base URL
- **Development**: `http://localhost:8001`
- **Production**: Configured via `VITE_API_URL`

### Authentication

All API requests (except `/api/auth/login`) require a JWT token in the `Authorization` header:

```
Authorization: Bearer <jwt-token>
```

**Token Lifecycle**:
1. Login: `POST /api/auth/login` → Returns JWT token
2. Include token in all subsequent requests
3. Token expires after 30 minutes (configurable)
4. Refresh by logging in again (no refresh tokens yet)

### API Endpoints

#### Authentication (`/api/auth`)

```
POST   /api/auth/login       Login with username/password
GET    /api/auth/me          Get current user info
POST   /api/auth/logout      Logout (client-side only)
```

**Login Example**:
```bash
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123"

# Response
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

#### Hosts (`/api/hosts`)

```
GET    /api/hosts                      List hosts with filters
GET    /api/hosts/{host_id}            Get host details
POST   /api/hosts                      Create host (operator+)
PUT    /api/hosts/{host_id}            Update host (operator+)
DELETE /api/hosts/{host_id}            Delete host (admin only)
GET    /api/hosts/dashboard/metrics    Dashboard metrics
GET    /api/hosts/agent-versions       Agent version statistics
```

**Query Parameters** (GET /api/hosts):
- `status`: Filter by status (online, offline, error)
- `os_name`: Filter by OS name
- `search`: Search hostname/FQDN
- `skip`: Pagination offset (default: 0)
- `limit`: Page size (default: 100)

**Example**:
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8001/api/hosts?status=offline&limit=50"
```

#### Agents (`/api/agents`)

```
POST   /api/agents/data                Submit agent data
GET    /api/agents/config              Get agent configuration
GET    /api/agents/version             Get latest agent version
GET    /api/agents/download/install.sh Download installer script
GET    /api/agents/download/main.py    Download agent script
GET    /api/agents/download/requirements.txt  Download requirements
```

**Agent Authentication**: Uses `AGENT_SECRET_KEY` from settings (Bearer token or database override).

**Submit Data Example**:
```bash
curl -X POST http://localhost:8001/api/agents/data \
  -H "Authorization: Bearer <agent-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "hostname": "web-01",
    "os_name": "Ubuntu",
    "os_version": "22.04",
    "kernel_version": "5.15.0-56-generic",
    "pending_updates": [...],
    "agent_version": "1.0.0"
  }'
```

#### Alerts (`/api/alerts`)

```
GET    /api/alerts                     List alerts
GET    /api/alerts/{alert_id}          Get specific alert
PUT    /api/alerts/{alert_id}/acknowledge  Acknowledge alert (operator+)
DELETE /api/alerts/{alert_id}          Delete alert (admin only)
```

**Query Parameters** (GET /api/alerts):
- `severity`: Filter by severity
- `acknowledged`: Filter by acknowledgment status (true/false)
- `host_id`: Filter by host ID

#### Users (`/api/users`) - Admin Only

```
GET    /api/users                      List users
POST   /api/users                      Create user
GET    /api/users/{user_id}            Get user details
PUT    /api/users/{user_id}            Update user
DELETE /api/users/{user_id}            Delete user
```

#### Reports (`/api/reports`)

```
GET    /api/reports/compliance         Compliance report
GET    /api/reports/vulnerabilities    Vulnerability report
```

**Query Parameters**:
- `format`: Response format (json, csv, pdf) - currently JSON only

#### Settings (`/api/settings`)

```
GET    /api/settings                   Get all settings (viewer+)
PUT    /api/settings                   Update settings (admin only)
GET    /api/settings/agent-token       Get agent token (admin only)
POST   /api/settings/agent-token/generate  Generate new token (admin only)
```

### API Documentation

FastAPI provides automatic interactive API documentation:

- **Swagger UI**: `http://localhost:8001/docs`
- **ReDoc**: `http://localhost:8001/redoc`
- **OpenAPI JSON**: `http://localhost:8001/openapi.json`

### Error Handling

Standard HTTP status codes:

- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error

**Error Response Format**:
```json
{
  "detail": "Error message here"
}
```

---

## Frontend Architecture

### Routing Structure

```typescript
// src/App.tsx
const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <PrivateRoute><Layout /></PrivateRoute>,
    children: [
      {
        path: '/',
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: '/dashboard',
        element: <DashboardPage />,
      },
      {
        path: '/hosts',
        element: <HostsPage />,
      },
      {
        path: '/hosts/:hostId',
        element: <HostDetailPage />,
      },
      {
        path: '/reports',
        element: <ReportsPage />,
      },
      {
        path: '/settings',
        element: <SettingsPage />,
      },
    ],
  },
])
```

**Route Protection**: `PrivateRoute` component checks authentication and redirects to `/login` if not authenticated.

### State Management

#### Global State (Zustand)

Used for authentication state only.

```typescript
// stores/authStore.ts
interface AuthState {
  token: string | null
  user: User | null
  setAuth: (token: string, user: User) => void
  clearAuth: () => void
}

// Usage
const { token, user, setAuth, clearAuth } = useAuthStore()
```

**Persistence**: Stored in `localStorage` as `auth-storage`.

#### Server State (React Query)

Used for all API data fetching.

```typescript
// Example: Fetch hosts
const { data: hosts, isLoading, error, refetch } = useQuery(
  ['hosts', filters],
  () => hostsApi.list(filters),
  {
    refetchInterval: 30000,      // Auto-refresh every 30s
    staleTime: 5 * 60 * 1000,    // 5 minutes
    retry: 3,                     // Retry failed requests 3 times
  }
)

// Example: Mutate data
const mutation = useMutation(
  (data: HostCreate) => hostsApi.create(data),
  {
    onSuccess: () => {
      queryClient.invalidateQueries(['hosts'])  // Refetch
      toast.success('Host created!')
    },
    onError: (error) => {
      toast.error('Failed to create host')
    },
  }
)
```

**Query Keys Convention**:
- `['hosts']`: All hosts
- `['hosts', filters]`: Filtered hosts
- `['hosts', hostId]`: Single host
- `['dashboard-metrics']`: Dashboard metrics
- `['alerts']`: All alerts

### Component Hierarchy

```
App
└── Layout
    ├── Sidebar (navigation)
    ├── Header (user menu)
    └── [Page Components]
        ├── DashboardPage
        │   ├── MetricsCard (x4)
        │   ├── PieChart (Recharts)
        │   ├── BarChart (Recharts)
        │   └── HostCard (grid)
        ├── HostsPage
        │   └── Table (sortable, filterable)
        ├── HostDetailPage
        │   ├── System Info Panel
        │   ├── Patch Status Panel
        │   └── Pending Updates Table
        ├── ReportsPage
        │   ├── Compliance Report
        │   └── Vulnerability Report
        └── SettingsPage
            └── Settings Form
```

### Data Flow

```
User Action
    ↓
Component (React Query mutation)
    ↓
API Client (Axios)
    ↓
Backend API
    ↓
Database
    ↓
Backend Response
    ↓
API Client (response interceptor)
    ↓
React Query (cache update)
    ↓
Component Re-render
```

### Auto-Refresh Strategy

**Dashboard**: 30-second auto-refresh
```typescript
useQuery(['hosts'], hostsApi.list, { refetchInterval: 30000 })
```

**Host Detail**: Manual refresh button
```typescript
const { refetch } = useQuery(['hosts', hostId], () => hostsApi.get(hostId))
<button onClick={() => refetch()}>Refresh</button>
```

**Agent Versions**: 5-minute refresh
```typescript
useQuery(['agent-versions'], hostsApi.getAgentVersions, {
  refetchInterval: 5 * 60 * 1000
})
```

### Styling System

**Tailwind CSS Configuration** (`tailwind.config.js`):
```javascript
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',      // Blue-500
        success: '#10B981',      // Green-500
        warning: '#F59E0B',      // Amber-500
        danger: '#EF4444',       // Red-500
      },
    },
  },
}
```

**Status Badge Component Pattern**:
```typescript
const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-red-500',
  error: 'bg-gray-500',
}

<span className={`px-3 py-1 rounded-full text-white text-sm ${statusColors[status]}`}>
  {status}
</span>
```

---

## Agent System

### Agent Architecture

```
Agent (Python)
    ↓ (Data Collection)
Package Manager (apt/dnf/yum/zypper/pacman)
    ↓ (HTTP POST)
Backend API (/api/agents/data)
    ↓ (Database Write)
PostgreSQL + TimescaleDB
    ↓ (Query)
Dashboard (Frontend)
```

### Agent Lifecycle

1. **Installation** (via `install.sh`):
   - Detect OS and package manager
   - Create `patchmonitor` user and home directory
   - Install Python dependencies in virtual environment
   - Copy agent files to `/opt/patchmonitor-agent/`
   - Create systemd service
   - Start and enable service

2. **Execution Loop**:
   - Collect system data
   - Submit to backend API
   - Check for agent updates
   - Sleep for collection interval (default: 6 hours)
   - Repeat

3. **Auto-Update**:
   - Check server for latest agent version every 6 hours
   - If newer version available, download and restart
   - Atomic update with backup

### Data Collection Process

```python
def collect_data():
    """Main data collection process."""
    return {
        # System Information
        "hostname": socket.gethostname(),
        "fqdn": socket.getfqdn(),
        "ip_addresses": get_ip_addresses(),
        "os_name": distro.name(),
        "os_version": distro.version(),
        "architecture": platform.machine(),

        # Kernel & Boot
        "kernel_version": platform.release(),
        "last_boot_time": datetime.fromtimestamp(psutil.boot_time()),

        # Package Updates
        "pending_updates": get_pending_updates(),
        "pending_security_count": count_security_updates(),
        "needs_reboot": check_reboot_required(),

        # Last Patch Time
        "last_patch_time": get_last_patch_time(),

        # Agent Metadata
        "agent_version": VERSION,
        "collected_at": datetime.now().isoformat(),
    }
```

### Package Manager Commands

| Package Manager | Check Updates | Security Updates | Last Update Time |
|----------------|---------------|------------------|------------------|
| **APT** | `apt list --upgradable` | Check `security` in origin | Parse `/var/log/apt/history.log` |
| **DNF** | `dnf check-update` | `dnf updateinfo list security` | Parse `/var/log/dnf.log` |
| **YUM** | `yum check-update` | `yum updateinfo list security` | Parse `/var/log/yum.log` |
| **Zypper** | `zypper list-updates` | `zypper list-patches --category security` | Parse `/var/log/zypp/history` |
| **Pacman** | `pacman -Qu` | Parse advisory feeds | Parse `/var/log/pacman.log` |

### Agent Configuration

**Command-line Arguments**:
```bash
python main.py \
  --server-url http://localhost:8001 \
  --token your-agent-token \
  --interval 3600 \
  --once \
  --verbose
```

**Environment Variables**:
```bash
export PATCHMONITOR_SERVER_URL="http://localhost:8001"
export PATCHMONITOR_TOKEN="your-agent-token"
export PATCHMONITOR_INTERVAL="3600"
```

**Configuration File** (`/opt/patchmonitor-agent/config.json`):
```json
{
  "server_url": "http://localhost:8001",
  "agent_token": "your-agent-token",
  "collection_interval": 3600,
  "log_level": "INFO"
}
```

**Priority**: Command-line → Environment → Config File → Defaults

### Agent Service Management

```bash
# Check status
sudo systemctl status patchmonitor-agent

# View logs
sudo journalctl -u patchmonitor-agent -f

# Restart
sudo systemctl restart patchmonitor-agent

# Stop
sudo systemctl stop patchmonitor-agent

# Disable
sudo systemctl disable patchmonitor-agent

# Uninstall
sudo /opt/patchmonitor-agent/uninstall.sh
```

### Agent Permissions

**Required Permissions**:
- Read `/etc/os-release`, `/etc/lsb-release`
- Execute package manager commands (apt, dnf, yum, etc.)
- Read package manager logs
- Read `/proc/uptime`, `/proc/sys/kernel/random/boot_id`
- Network access to backend API

**NOT Required**:
- Root/sudo (runs as `patchmonitor` user)
- Write access to system files
- Package installation permissions

**Security Notes**:
- Agent runs as non-root user
- Read-only operations only
- No shell command execution from server
- Token-based authentication
- HTTPS recommended for production

---

## Testing Guidelines

### Current Status

**⚠️ Testing infrastructure is in place but no tests are implemented yet.**

Installed packages:
- `pytest` (backend)
- `pytest-asyncio` (async tests)
- `httpx` (API testing)

### Backend Testing (To Be Implemented)

**Directory Structure**:
```
backend/
├── app/
│   └── ...
├── tests/
│   ├── __init__.py
│   ├── conftest.py          # Pytest fixtures
│   ├── test_auth.py         # Authentication tests
│   ├── test_models.py       # Model tests
│   ├── test_api/
│   │   ├── test_hosts.py
│   │   ├── test_agents.py
│   │   ├── test_alerts.py
│   │   └── ...
│   └── test_tasks.py        # Celery task tests
└── pytest.ini
```

**Example Test Structure**:
```python
# tests/conftest.py
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.main import app

@pytest.fixture
def db_session():
    """Create test database session."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()

@pytest.fixture
def client():
    """Create test client."""
    from fastapi.testclient import TestClient
    return TestClient(app)

# tests/test_api/test_hosts.py
def test_list_hosts(client, db_session):
    """Test GET /api/hosts."""
    response = client.get("/api/hosts")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
```

**Run Tests**:
```bash
cd backend
pytest                    # Run all tests
pytest -v                 # Verbose
pytest -k test_auth       # Run specific tests
pytest --cov=app          # With coverage
```

### Frontend Testing (To Be Implemented)

**Directory Structure**:
```
frontend/
├── src/
│   └── ...
├── tests/
│   ├── components/
│   │   ├── HostCard.test.tsx
│   │   └── ...
│   ├── pages/
│   │   ├── DashboardPage.test.tsx
│   │   └── ...
│   └── api/
│       └── hosts.test.ts
└── vitest.config.ts
```

**Tools to Use**:
- **Vitest**: Test runner (Vite-compatible)
- **React Testing Library**: Component testing
- **MSW**: API mocking

**Example Test**:
```typescript
// tests/components/HostCard.test.tsx
import { render, screen } from '@testing-library/react'
import HostCard from '../../src/components/HostCard'

describe('HostCard', () => {
  it('renders host information', () => {
    const host = {
      id: '123',
      hostname: 'web-01',
      status: 'online',
      os_name: 'Ubuntu',
    }

    render(<HostCard host={host} />)

    expect(screen.getByText('web-01')).toBeInTheDocument()
    expect(screen.getByText('Ubuntu')).toBeInTheDocument()
  })
})
```

**Run Tests**:
```bash
cd frontend
npm test                  # Run all tests
npm test -- --watch       # Watch mode
npm test -- --coverage    # With coverage
```

### Agent Testing (To Be Implemented)

**Directory Structure**:
```
agent/
├── main.py
├── tests/
│   ├── test_collectors.py
│   ├── test_package_managers.py
│   └── test_api_client.py
└── pytest.ini
```

**Run Tests**:
```bash
cd agent
pytest
```

### Test Coverage Goals

- **Backend**: > 70% coverage
- **Frontend**: > 60% coverage
- **Agent**: > 50% coverage

### Manual Testing Checklist

**Backend**:
- [ ] All API endpoints return correct status codes
- [ ] Authentication works (login, logout, protected routes)
- [ ] RBAC enforced (viewer, operator, admin)
- [ ] Database constraints enforced
- [ ] Error handling works

**Frontend**:
- [ ] All pages load without errors
- [ ] Authentication flow works
- [ ] Dashboard auto-refreshes
- [ ] Filters and search work
- [ ] Responsive design on mobile

**Agent**:
- [ ] Detects all supported package managers
- [ ] Collects accurate system data
- [ ] Submits data successfully
- [ ] Handles network errors gracefully
- [ ] Auto-updates work

**Integration**:
- [ ] Agent → Backend → Database → Frontend flow
- [ ] Alerts trigger correctly
- [ ] Celery tasks execute
- [ ] TimescaleDB queries perform well

---

## Common Tasks & Examples

### 1. Adding a New API Endpoint

**Backend** (`backend/app/routers/your_router.py`):
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user, require_role
from app.models import YourModel
from app.schemas import YourCreate, YourResponse

router = APIRouter(prefix="/api/your-resource", tags=["Your Resource"])

@router.get("/", response_model=list[YourResponse])
async def list_items(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List all items."""
    return db.query(YourModel).all()

@router.post("/", response_model=YourResponse)
async def create_item(
    item: YourCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("operator"))
):
    """Create new item."""
    db_item = YourModel(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item
```

**Register Router** (`backend/app/main.py`):
```python
from app.routers import your_router

app.include_router(your_router.router)
```

**Frontend** (`frontend/src/api/yourResource.ts`):
```typescript
import client from './client'

export interface YourResource {
  id: string
  name: string
}

export const yourResourceApi = {
  list: async () => {
    const { data } = await client.get<YourResource[]>('/api/your-resource')
    return data
  },

  create: async (item: Partial<YourResource>) => {
    const { data } = await client.post<YourResource>('/api/your-resource', item)
    return data
  },
}
```

### 2. Adding a New Database Model

**Model** (`backend/app/models.py`):
```python
class YourModel(Base):
    """Your model description."""
    __tablename__ = "your_models"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```

**Schema** (`backend/app/schemas.py`):
```python
class YourModelBase(BaseModel):
    name: str
    description: Optional[str] = None

class YourModelCreate(YourModelBase):
    pass

class YourModelResponse(YourModelBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
```

**Create Table** (run `init_db.py` or manual migration):
```bash
docker-compose exec backend python init_db.py
```

### 3. Adding a New React Page

**Page Component** (`frontend/src/pages/YourPage.tsx`):
```typescript
import React from 'react'
import { useQuery } from 'react-query'
import { yourResourceApi } from '../api/yourResource'

const YourPage: React.FC = () => {
  const { data, isLoading, error } = useQuery(
    ['your-resource'],
    yourResourceApi.list
  )

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error loading data</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Your Page</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map(item => (
          <div key={item.id} className="p-4 border rounded">
            <h3 className="font-bold">{item.name}</h3>
          </div>
        ))}
      </div>
    </div>
  )
}

export default YourPage
```

**Add Route** (`frontend/src/App.tsx`):
```typescript
import YourPage from './pages/YourPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <PrivateRoute><Layout /></PrivateRoute>,
    children: [
      // ... existing routes
      {
        path: '/your-page',
        element: <YourPage />,
      },
    ],
  },
])
```

**Add Navigation** (`frontend/src/components/Sidebar.tsx`):
```typescript
<Link to="/your-page" className="nav-link">
  Your Page
</Link>
```

### 4. Adding a Celery Background Task

**Task** (`backend/app/tasks.py`):
```python
from app.celery import celery_app
from app.database import SessionLocal

@celery_app.task
def your_background_task(param1: str):
    """Your task description."""
    db = SessionLocal()
    try:
        # Your logic here
        result = process_something(param1)
        db.commit()
        return result
    except Exception as e:
        db.rollback()
        raise
    finally:
        db.close()
```

**Schedule** (`backend/app/celery.py`):
```python
from celery.schedules import crontab

celery_app.conf.beat_schedule = {
    "your-task": {
        "task": "app.tasks.your_background_task",
        "schedule": crontab(hour="*/6"),  # Every 6 hours
        "args": ("param-value",),
    },
}
```

**Trigger Manually** (from API):
```python
from app.tasks import your_background_task

@router.post("/trigger-task")
async def trigger_task():
    """Trigger background task."""
    task = your_background_task.delay("param-value")
    return {"task_id": task.id}
```

### 5. Adding a Filter to the Dashboard

**Frontend** (`frontend/src/pages/DashboardPage.tsx`):
```typescript
const [filters, setFilters] = useState({
  status: '',
  osName: '',
  search: '',
})

const { data: hosts } = useQuery(
  ['hosts', filters],
  () => hostsApi.list(filters)
)

// Filter UI
<select
  value={filters.status}
  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
  className="border rounded px-3 py-2"
>
  <option value="">All Status</option>
  <option value="online">Online</option>
  <option value="offline">Offline</option>
  <option value="error">Error</option>
</select>
```

### 6. Creating a New Alert Type

**Backend** (`backend/app/models.py`):
```python
# Add to AlertType enum
class AlertType(str, enum.Enum):
    PATCH_LAG = "patch_lag"
    CRITICAL_CVE = "critical_cve"
    OFFLINE = "offline"
    REBOOT_NEEDED = "reboot_needed"
    YOUR_ALERT = "your_alert"  # New alert type
```

**Celery Task** (`backend/app/tasks.py`):
```python
@celery_app.task
def check_your_condition():
    """Check for your alert condition."""
    db = SessionLocal()
    try:
        hosts = db.query(Host).filter(your_condition).all()
        for host in hosts:
            # Create alert if not exists
            existing = db.query(Alert).filter(
                Alert.host_id == host.id,
                Alert.alert_type == AlertType.YOUR_ALERT,
                Alert.acknowledged == False
            ).first()

            if not existing:
                alert = Alert(
                    host_id=host.id,
                    alert_type=AlertType.YOUR_ALERT,
                    severity=SeverityLevel.HIGH,
                    message=f"Your condition triggered for {host.hostname}"
                )
                db.add(alert)
        db.commit()
    finally:
        db.close()
```

---

## Troubleshooting

### Common Issues

#### 1. Backend Won't Start

**Symptom**: `docker-compose up backend` fails or crashes

**Possible Causes**:
- Database not ready
- Missing environment variables
- Port already in use

**Solutions**:
```bash
# Check database health
docker-compose exec postgres pg_isready -U patchmonitor

# Check logs
docker-compose logs backend

# Check port usage
lsof -i :8001  # Linux/Mac
netstat -ano | findstr :8001  # Windows

# Reset database
docker-compose down -v
docker-compose up -d postgres
sleep 10
docker-compose up -d db-init backend
```

#### 2. Frontend Not Connecting to Backend

**Symptom**: API calls fail with CORS or network errors

**Possible Causes**:
- Incorrect `VITE_API_URL`
- CORS not configured
- Backend not running

**Solutions**:
```bash
# Check frontend env
docker-compose exec frontend env | grep VITE_API_URL

# Check CORS settings in backend/app/config.py
# Ensure frontend URL is in cors_origins list

# Test backend directly
curl http://localhost:8001/api/hosts

# Restart both services
docker-compose restart backend frontend
```

#### 3. Agent Not Submitting Data

**Symptom**: Agent runs but data doesn't appear in dashboard

**Possible Causes**:
- Incorrect token
- Network connectivity
- Backend API not accessible
- Agent errors

**Solutions**:
```bash
# Check agent logs
sudo journalctl -u patchmonitor-agent -n 100

# Test API connectivity from agent host
curl -v http://your-server:8001/api/agents/version

# Verify token
sudo cat /opt/patchmonitor-agent/config.json

# Run agent manually for debugging
sudo -u patchmonitor /opt/patchmonitor-agent/venv/bin/python \
  /opt/patchmonitor-agent/main.py \
  --server-url http://your-server:8001 \
  --token your-token \
  --once \
  --verbose
```

#### 4. Database Performance Issues

**Symptom**: Slow queries, high CPU usage

**Possible Causes**:
- Missing indexes
- Too much historical data
- Inefficient queries

**Solutions**:
```bash
# Check slow queries
docker-compose exec postgres psql -U patchmonitor -d patchmonitor
SELECT query, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

# Vacuum database
VACUUM ANALYZE;

# Implement data retention policy
DELETE FROM host_snapshots
WHERE collected_at < NOW() - INTERVAL '90 days';
```

#### 5. Celery Tasks Not Running

**Symptom**: Background tasks not executing

**Possible Causes**:
- Celery worker not running
- Redis connection issues
- Task errors

**Solutions**:
```bash
# Check Celery worker
docker-compose logs celery-worker

# Check Celery beat
docker-compose logs celery-beat

# Test Redis connection
docker-compose exec redis redis-cli ping

# Restart Celery services
docker-compose restart celery-worker celery-beat
```

### Debugging Tips

**Enable Debug Logging**:
```bash
# Backend
export LOG_LEVEL=DEBUG
docker-compose restart backend

# Agent
python main.py --verbose
```

**Check Service Health**:
```bash
# All services
docker-compose ps

# Backend health
curl http://localhost:8001/docs

# Database
docker-compose exec postgres psql -U patchmonitor -c "SELECT version();"

# Redis
docker-compose exec redis redis-cli ping
```

**Database Inspection**:
```sql
-- Check host count
SELECT COUNT(*) FROM hosts;

-- Check latest snapshots
SELECT h.hostname, hs.collected_at
FROM hosts h
JOIN host_snapshots hs ON h.id = hs.host_id
ORDER BY hs.collected_at DESC
LIMIT 10;

-- Check alerts
SELECT h.hostname, a.alert_type, a.severity, a.triggered_at
FROM alerts a
JOIN hosts h ON a.host_id = h.id
WHERE a.acknowledged = FALSE;
```

---

## Additional Resources

### Documentation Files

- **[README.md](README.md)**: Main project documentation
- **[PRD.md](PRD.md)**: Product Requirements Document (detailed specs)
- **[docs/installation.md](docs/installation.md)**: Installation guide
- **[docs/user-guide.md](docs/user-guide.md)**: User guide
- **[docs/api.md](docs/api.md)**: API documentation
- **[docs/agent-deployment.md](docs/agent-deployment.md)**: Agent deployment guide

### Key Technologies Documentation

- **FastAPI**: https://fastapi.tiangolo.com/
- **SQLAlchemy**: https://docs.sqlalchemy.org/
- **Pydantic**: https://docs.pydantic.dev/
- **React**: https://react.dev/
- **React Query**: https://tanstack.com/query/latest
- **Tailwind CSS**: https://tailwindcss.com/
- **TimescaleDB**: https://docs.timescale.com/
- **Celery**: https://docs.celeryq.dev/

### Quick Reference

**Default Ports**:
- Frontend: `3001` (external), `3000` (container)
- Backend API: `8001` (external), `8000` (container)
- PostgreSQL: `5433` (external), `5432` (container)
- Redis: `6380` (external), `6379` (container)

**Default Credentials**:
- **Admin User**: `admin` / `admin123`
- **PostgreSQL**: `patchmonitor` / `password`

**Key Commands**:
```bash
# Start everything
docker-compose up -d

# View logs
docker-compose logs -f

# Restart service
docker-compose restart <service-name>

# Access database
docker-compose exec postgres psql -U patchmonitor

# Access backend shell
docker-compose exec backend bash

# Stop everything
docker-compose down
```

---

## Document Maintenance

**When to Update This Document**:
- Adding new features or components
- Changing architecture or tech stack
- Updating conventions or patterns
- Adding new workflows or processes
- Fixing common issues

**How to Update**:
1. Make changes to CLAUDE.md
2. Update "Last Updated" date at top
3. Commit with clear message
4. Notify team of significant changes

---

**End of CLAUDE.md**

This document is maintained by the development team and updated regularly to reflect the current state of the codebase. For questions or suggestions, please open an issue or contact the team.
