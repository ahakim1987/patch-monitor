# Installation Guide

This guide will help you install and configure the Linux Patch Monitor system.

## Prerequisites

- Docker and Docker Compose
- At least 4GB RAM
- 20GB free disk space
- Network access to monitored hosts

## Quick Start

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd patch-monitor
   ```

2. **Configure environment:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Start the services:**
   ```bash
   docker-compose up -d
   ```

4. **Access the dashboard:**
   - Open http://localhost:3000 in your browser
   - Login with default credentials: `admin` / `admin123`

## Detailed Installation

### 1. Environment Configuration

Edit the `.env` file with your specific configuration:

```bash
# Database Configuration
DATABASE_URL=postgresql://patchmonitor:your_password@localhost:5432/patchmonitor
POSTGRES_PASSWORD=your_secure_password

# Application Configuration
SECRET_KEY=your-secret-key-here-change-in-production
AGENT_SECRET_KEY=your-agent-secret-key-here

# Server Configuration
HOST=0.0.0.0
PORT=8000
FRONTEND_URL=http://localhost:3000

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@yourcompany.com
```

### 2. Start Services

```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### 3. Initialize Database

The database will be automatically initialized on first startup. You can verify the setup by checking the logs:

```bash
docker-compose logs postgres
```

### 4. Deploy Agents

On each Linux host you want to monitor:

```bash
# Download the agent installation script
curl -O https://your-server.com/agent/install.sh

# Make it executable
chmod +x install.sh

# Install the agent
sudo ./install.sh --server-url http://your-server.com --token your-agent-token
```

## Manual Installation (Without Docker)

### Backend Installation

1. **Install Python dependencies:**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Set up PostgreSQL with TimescaleDB:**
   ```bash
   # Install PostgreSQL and TimescaleDB
   # Ubuntu/Debian:
   sudo apt-get install postgresql postgresql-contrib
   wget https://packagecloud.io/install/repositories/timescale/timescaledb/script.deb.sh
   sudo bash script.deb.sh
   sudo apt-get install timescaledb-2-postgresql-15

   # Initialize TimescaleDB
   sudo timescaledb-tune --conf-path=/etc/postgresql/15/main/postgresql.conf
   sudo systemctl restart postgresql
   ```

3. **Create database:**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE patchmonitor;
   CREATE USER patchmonitor WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE patchmonitor TO patchmonitor;
   \q
   ```

4. **Run the backend:**
   ```bash
   cd backend
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

### Frontend Installation

1. **Install Node.js dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Build and serve:**
   ```bash
   # Development
   npm run dev

   # Production
   npm run build
   npm run preview
   ```

## Agent Installation

### Automated Installation

Use the provided installation script:

```bash
sudo ./agent/install.sh --server-url http://your-server.com --token your-agent-token
```

### Manual Installation

1. **Install Python dependencies:**
   ```bash
   sudo apt-get install python3 python3-pip python3-venv
   pip3 install requests psutil distro
   ```

2. **Create agent directory:**
   ```bash
   sudo mkdir -p /opt/patchmonitor-agent
   sudo cp agent/main.py /opt/patchmonitor-agent/
   sudo cp agent/requirements.txt /opt/patchmonitor-agent/
   ```

3. **Create systemd service:**
   ```bash
   sudo tee /etc/systemd/system/patchmonitor-agent.service > /dev/null <<EOF
   [Unit]
   Description=Linux Patch Monitor Agent
   After=network.target

   [Service]
   Type=simple
   User=patchmonitor
   Group=patchmonitor
   WorkingDirectory=/opt/patchmonitor-agent
   ExecStart=/usr/bin/python3 /opt/patchmonitor-agent/main.py --server-url http://your-server.com --token your-agent-token
   Restart=always
   RestartSec=10

   [Install]
   WantedBy=multi-user.target
   EOF
   ```

4. **Start the service:**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable patchmonitor-agent
   sudo systemctl start patchmonitor-agent
   ```

## Configuration

### Server Configuration

Key configuration options in `.env`:

- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT signing key (change in production)
- `AGENT_SECRET_KEY`: Token for agent authentication
- `COLLECTION_INTERVAL_MINUTES`: How often agents collect data
- `CORS_ORIGINS`: Allowed frontend origins

### Agent Configuration

The agent can be configured via environment variables or command line:

- `--server-url`: Monitoring server URL
- `--token`: Agent authentication token
- `--interval`: Collection interval in seconds
- `--once`: Run once instead of daemon mode

## Troubleshooting

### Common Issues

1. **Database connection failed:**
   - Check PostgreSQL is running
   - Verify connection string in `.env`
   - Ensure TimescaleDB extension is installed

2. **Agent can't connect to server:**
   - Check network connectivity
   - Verify server URL and port
   - Check firewall rules

3. **Frontend not loading:**
   - Check if backend is running on port 8000
   - Verify CORS configuration
   - Check browser console for errors

### Logs

View logs for each service:

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Agent logs (on monitored host)
journalctl -u patchmonitor-agent -f
```

### Health Checks

Check service health:

```bash
# Backend API
curl http://localhost:8000/health

# Database
docker-compose exec postgres psql -U patchmonitor -d patchmonitor -c "SELECT 1;"

# Agent (on monitored host)
systemctl status patchmonitor-agent
```

## Security Considerations

1. **Change default passwords** in production
2. **Use HTTPS** for all communications
3. **Restrict network access** to monitoring server
4. **Regular security updates** for all components
5. **Monitor agent tokens** and rotate regularly

## Performance Tuning

### Database Optimization

1. **TimescaleDB compression:**
   ```sql
   SELECT add_compression_policy('host_snapshots', INTERVAL '7 days');
   ```

2. **Data retention:**
   ```sql
   SELECT add_retention_policy('host_snapshots', INTERVAL '90 days');
   ```

### Agent Optimization

1. **Adjust collection interval** based on needs
2. **Use resource limits** in production
3. **Monitor agent performance** on each host

## Backup and Recovery

### Database Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U patchmonitor patchmonitor > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U patchmonitor patchmonitor < backup.sql
```

### Configuration Backup

```bash
# Backup configuration
tar -czf patchmonitor-config.tar.gz .env docker-compose.yml
```

## Upgrading

1. **Backup data and configuration**
2. **Pull latest changes:**
   ```bash
   git pull origin main
   ```
3. **Update services:**
   ```bash
   docker-compose down
   docker-compose pull
   docker-compose up -d
   ```
4. **Verify upgrade:**
   ```bash
   docker-compose logs -f
   ```
