# API Documentation

The Linux Patch Monitor provides a RESTful API for programmatic access to all system features.

## Base URL

```
http://localhost:8000/api
```

## Authentication

All API endpoints require authentication using Bearer tokens.

### Getting a Token

```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123"
```

Response:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

### Using the Token

Include the token in the Authorization header:

```bash
curl -H "Authorization: Bearer your-token-here" \
  "http://localhost:8000/api/hosts"
```

## Endpoints

### Authentication

#### POST /api/auth/login
Authenticate user and get access token.

**Request:**
```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123"
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

#### GET /api/auth/me
Get current user information.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "username": "admin",
  "email": "admin@patchmonitor.local",
  "role": "admin",
  "mfa_enabled": false,
  "last_login": "2024-01-15T10:30:00Z",
  "created_at": "2024-01-01T00:00:00Z",
  "is_active": true
}
```

### Hosts

#### GET /api/hosts
Get list of hosts with optional filtering.

**Query Parameters:**
- `skip` (integer): Number of records to skip (default: 0)
- `limit` (integer): Maximum number of records to return (default: 100, max: 1000)
- `status` (string): Filter by host status (online, offline, error)
- `os_name` (string): Filter by operating system
- `search` (string): Search by hostname or IP

**Example:**
```bash
curl -H "Authorization: Bearer your-token" \
  "http://localhost:8000/api/hosts?status=online&limit=50"
```

**Response:**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "hostname": "web-server-01",
    "fqdn": "web-server-01.example.com",
    "ip_addresses": ["192.168.1.100", "10.0.0.100"],
    "os_name": "Ubuntu",
    "os_version": "22.04",
    "status": "online",
    "last_patch_time": "2024-01-15T08:30:00Z",
    "pending_updates_count": 5,
    "pending_security_count": 2,
    "needs_reboot": false,
    "days_since_patch": 2
  }
]
```

#### GET /api/hosts/{host_id}
Get detailed information about a specific host.

**Example:**
```bash
curl -H "Authorization: Bearer your-token" \
  "http://localhost:8000/api/hosts/123e4567-e89b-12d3-a456-426614174000"
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "hostname": "web-server-01",
  "fqdn": "web-server-01.example.com",
  "ip_addresses": ["192.168.1.100"],
  "os_name": "Ubuntu",
  "os_version": "22.04",
  "architecture": "x86_64",
  "agent_version": "1.0.0",
  "status": "online",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "snapshots": [
    {
      "id": "456e7890-e89b-12d3-a456-426614174000",
      "host_id": "123e4567-e89b-12d3-a456-426614174000",
      "collected_at": "2024-01-15T10:30:00Z",
      "kernel_version": "5.15.0-91-generic",
      "last_boot_time": "2024-01-10T06:00:00Z",
      "last_patch_time": "2024-01-15T08:30:00Z",
      "pending_updates_count": 5,
      "pending_security_count": 2,
      "needs_reboot": false
    }
  ],
  "pending_updates": [
    {
      "id": "789e0123-e89b-12d3-a456-426614174000",
      "host_snapshot_id": "456e7890-e89b-12d3-a456-426614174000",
      "package_name": "openssl",
      "current_version": "3.0.2-0ubuntu1.12",
      "available_version": "3.0.2-0ubuntu1.13",
      "is_security": true,
      "update_type": "critical",
      "cves": [
        {
          "id": "cve-1234-5678",
          "cve_id": "CVE-2024-1234",
          "description": "OpenSSL vulnerability",
          "severity": "critical",
          "cvss_score": 9.8,
          "published_date": "2024-01-10T00:00:00Z",
          "url": "https://nvd.nist.gov/vuln/detail/CVE-2024-1234"
        }
      ]
    }
  ],
  "alerts": [],
  "tags": []
}
```

#### POST /api/hosts
Create a new host.

**Request Body:**
```json
{
  "hostname": "new-server",
  "fqdn": "new-server.example.com",
  "ip_addresses": ["192.168.1.200"],
  "os_name": "Ubuntu",
  "os_version": "22.04",
  "architecture": "x86_64"
}
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "hostname": "new-server",
  "fqdn": "new-server.example.com",
  "ip_addresses": ["192.168.1.200"],
  "os_name": "Ubuntu",
  "os_version": "22.04",
  "architecture": "x86_64",
  "status": "offline",
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### PUT /api/hosts/{host_id}
Update host information.

**Request Body:**
```json
{
  "hostname": "updated-server",
  "fqdn": "updated-server.example.com"
}
```

#### DELETE /api/hosts/{host_id}
Delete a host.

**Response:**
```json
{
  "message": "Host deleted successfully"
}
```

#### GET /api/hosts/dashboard/metrics
Get dashboard metrics.

**Response:**
```json
{
  "total_hosts": 245,
  "hosts_by_status": {
    "online": 198,
    "offline": 32,
    "error": 15
  },
  "average_patch_lag_days": 12.5,
  "total_pending_security_patches": 45,
  "hosts_requiring_reboot": 8,
  "recently_updated_hosts": 23
}
```

### Reports

#### GET /api/reports/compliance
Get compliance report.

**Response:**
```json
{
  "total_hosts": 245,
  "compliant_hosts": 198,
  "compliance_percentage": 80.8,
  "hosts_by_status": {
    "compliant": 198,
    "non_compliant": 32,
    "unknown": 15
  },
  "critical_vulnerabilities": 12,
  "high_vulnerabilities": 45,
  "medium_vulnerabilities": 78,
  "low_vulnerabilities": 23
}
```

#### GET /api/reports/vulnerabilities
Get vulnerability report.

**Response:**
```json
{
  "total_cves": 158,
  "critical_cves": 12,
  "high_cves": 45,
  "medium_cves": 78,
  "low_cves": 23,
  "affected_hosts": 67,
  "cves_by_severity": {
    "critical": [...],
    "high": [...],
    "medium": [...],
    "low": [...]
  }
}
```

### Alerts

#### GET /api/alerts
Get list of alerts.

**Query Parameters:**
- `skip` (integer): Number of records to skip
- `limit` (integer): Maximum number of records to return
- `acknowledged` (boolean): Filter by acknowledgment status
- `severity` (string): Filter by severity level

**Response:**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "host_id": "456e7890-e89b-12d3-a456-426614174000",
    "alert_type": "patch_lag",
    "severity": "high",
    "message": "Host has not been patched in 45 days",
    "triggered_at": "2024-01-15T10:30:00Z",
    "acknowledged": false,
    "acknowledged_by": null,
    "acknowledged_at": null
  }
]
```

#### PUT /api/alerts/{alert_id}/acknowledge
Acknowledge or unacknowledge an alert.

**Request Body:**
```json
{
  "acknowledged": true
}
```

### Agent Endpoints

#### POST /api/agents/data
Submit data from agent (requires agent token).

**Headers:**
- `Authorization: Bearer <agent-token>`

**Request Body:**
```json
{
  "hostname": "web-server-01",
  "fqdn": "web-server-01.example.com",
  "ip_addresses": ["192.168.1.100"],
  "os_name": "Ubuntu",
  "os_version": "22.04",
  "architecture": "x86_64",
  "agent_version": "1.0.0",
  "kernel_version": "5.15.0-91-generic",
  "last_boot_time": "2024-01-10T06:00:00Z",
  "last_patch_time": "2024-01-15T08:30:00Z",
  "pending_updates": [
    {
      "package_name": "openssl",
      "current_version": "3.0.2-0ubuntu1.12",
      "available_version": "3.0.2-0ubuntu1.13",
      "is_security": true,
      "update_type": "critical"
    }
  ],
  "needs_reboot": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Data submitted successfully",
  "next_collection_time": "2024-01-15T11:30:00Z"
}
```

#### GET /api/agents/config
Get agent configuration.

**Headers:**
- `Authorization: Bearer <agent-token>`

**Response:**
```json
{
  "collection_interval_minutes": 60,
  "server_url": "http://localhost:8000",
  "api_endpoint": "/api/agents/data"
}
```

## Error Responses

All endpoints return appropriate HTTP status codes and error messages.

### Common Error Codes

- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error

### Error Response Format

```json
{
  "detail": "Error message describing what went wrong"
}
```

### Example Error Response

```json
{
  "detail": "Host with this hostname already exists"
}
```

## Rate Limiting

API requests are rate limited to 100 requests per minute per API key.

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests per minute
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit resets

## Pagination

List endpoints support pagination using `skip` and `limit` parameters.

Example:
```bash
curl -H "Authorization: Bearer your-token" \
  "http://localhost:8000/api/hosts?skip=20&limit=10"
```

## Filtering and Search

Many endpoints support filtering and search:

- **Exact match**: `status=online`
- **Partial match**: `os_name=Ubuntu` (case-insensitive)
- **Search**: `search=web-server` (searches hostname and IP)

## Data Formats

### Dates
All dates are in ISO 8601 format with UTC timezone:
```
2024-01-15T10:30:00Z
```

### UUIDs
All IDs are UUIDs in standard format:
```
123e4567-e89b-12d3-a456-426614174000
```

### Enums
Common enum values:

**Host Status:**
- `online`
- `offline`
- `error`

**User Roles:**
- `admin`
- `operator`
- `viewer`

**Alert Types:**
- `patch_lag`
- `critical_cve`
- `offline`
- `reboot_needed`

**Severity Levels:**
- `critical`
- `high`
- `medium`
- `low`

## SDKs and Libraries

### Python Example

```python
import requests

# Authenticate
response = requests.post(
    "http://localhost:8000/api/auth/login",
    data={"username": "admin", "password": "admin123"}
)
token = response.json()["access_token"]

# Get hosts
headers = {"Authorization": f"Bearer {token}"}
response = requests.get(
    "http://localhost:8000/api/hosts",
    headers=headers
)
hosts = response.json()
```

### JavaScript Example

```javascript
// Authenticate
const authResponse = await fetch('http://localhost:8000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: 'username=admin&password=admin123'
});
const { access_token } = await authResponse.json();

// Get hosts
const hostsResponse = await fetch('http://localhost:8000/api/hosts', {
  headers: { 'Authorization': `Bearer ${access_token}` }
});
const hosts = await hostsResponse.json();
```

### cURL Examples

```bash
# Get all hosts
curl -H "Authorization: Bearer your-token" \
  "http://localhost:8000/api/hosts"

# Get hosts with filters
curl -H "Authorization: Bearer your-token" \
  "http://localhost:8000/api/hosts?status=online&os_name=Ubuntu"

# Create a new host
curl -X POST -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{"hostname":"new-server","os_name":"Ubuntu","os_version":"22.04"}' \
  "http://localhost:8000/api/hosts"
```
