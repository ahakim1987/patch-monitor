# Agent Deployment Guide

This guide explains how to deploy the Linux Patch Monitor agent on your Linux hosts.

## Overview

The agent is a lightweight Python application that:
- Collects patch status information from the host
- Sends data to the monitoring server
- Runs as a systemd service
- Supports multiple Linux distributions

## Supported Distributions

- Ubuntu 20.04, 22.04, 24.04
- Debian 11, 12
- RHEL 8, 9
- CentOS 8 Stream, 9 Stream
- Rocky Linux 8, 9
- AlmaLinux 8, 9
- Fedora 39, 40
- openSUSE Leap 15.x
- Arch Linux

## Prerequisites

- Python 3.8 or higher
- Root or sudo access
- Network connectivity to monitoring server
- Package manager access (apt, dnf, yum, zypper, pacman)

## Installation Methods

### Method 1: Automated Installation Script (Recommended)

1. **Download the installation script:**
   ```bash
   curl -O https://your-server.com/agent/install.sh
   chmod +x install.sh
   ```

2. **Run the installation:**
   ```bash
   sudo ./install.sh --server-url http://your-server.com --token your-agent-token
   ```

3. **Verify installation:**
   ```bash
   sudo systemctl status patchmonitor-agent
   sudo journalctl -u patchmonitor-agent -f
   ```

### Method 2: Manual Installation

1. **Install dependencies:**
   ```bash
   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install python3 python3-pip python3-venv curl

   # RHEL/CentOS/Rocky/AlmaLinux
   sudo dnf install python3 python3-pip curl

   # openSUSE
   sudo zypper install python3 python3-pip curl

   # Arch Linux
   sudo pacman -S python python-pip curl
   ```

2. **Create agent user:**
   ```bash
   sudo useradd --system --no-create-home --shell /bin/false patchmonitor
   ```

3. **Create installation directory:**
   ```bash
   sudo mkdir -p /opt/patchmonitor-agent
   sudo chown patchmonitor:patchmonitor /opt/patchmonitor-agent
   ```

4. **Download agent files:**
   ```bash
   sudo -u patchmonitor curl -o /opt/patchmonitor-agent/main.py \
     https://your-server.com/agent/main.py
   sudo -u patchmonitor curl -o /opt/patchmonitor-agent/requirements.txt \
     https://your-server.com/agent/requirements.txt
   ```

5. **Install Python dependencies:**
   ```bash
   sudo -u patchmonitor python3 -m venv /opt/patchmonitor-agent/venv
   sudo -u patchmonitor /opt/patchmonitor-agent/venv/bin/pip install \
     -r /opt/patchmonitor-agent/requirements.txt
   ```

6. **Create configuration:**
   ```bash
   sudo -u patchmonitor tee /opt/patchmonitor-agent/config.json > /dev/null <<EOF
   {
     "server_url": "http://your-server.com",
     "agent_token": "your-agent-token",
     "collection_interval": 3600
   }
   EOF
   ```

7. **Create systemd service:**
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
   ExecStart=/opt/patchmonitor-agent/venv/bin/python main.py \
     --server-url http://your-server.com --token your-agent-token
   Restart=always
   RestartSec=10
   StandardOutput=journal
   StandardError=journal

   [Install]
   WantedBy=multi-user.target
   EOF
   ```

8. **Start the service:**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable patchmonitor-agent
   sudo systemctl start patchmonitor-agent
   ```

### Method 3: Package Installation (Future)

Packages will be available for major distributions:

```bash
# Ubuntu/Debian
sudo apt install patchmonitor-agent

# RHEL/CentOS/Rocky/AlmaLinux
sudo dnf install patchmonitor-agent

# openSUSE
sudo zypper install patchmonitor-agent
```

## Configuration

### Environment Variables

The agent can be configured using environment variables:

```bash
export PATCHMONITOR_SERVER_URL="http://your-server.com"
export PATCHMONITOR_TOKEN="your-agent-token"
export PATCHMONITOR_INTERVAL="3600"
```

### Configuration File

Create `/opt/patchmonitor-agent/config.json`:

```json
{
  "server_url": "http://your-server.com",
  "agent_token": "your-agent-token",
  "collection_interval": 3600,
  "log_level": "INFO",
  "timeout": 30
}
```

### Command Line Options

```bash
python main.py --help

Options:
  --server-url URL     Monitoring server URL (required)
  --token TOKEN        Agent authentication token (required)
  --interval SECONDS   Collection interval in seconds (default: 3600)
  --once              Run once instead of daemon mode
  --verbose           Enable verbose logging
  --config FILE       Configuration file path
```

## Service Management

### Start/Stop/Restart

```bash
# Start the service
sudo systemctl start patchmonitor-agent

# Stop the service
sudo systemctl stop patchmonitor-agent

# Restart the service
sudo systemctl restart patchmonitor-agent

# Enable auto-start on boot
sudo systemctl enable patchmonitor-agent

# Disable auto-start on boot
sudo systemctl disable patchmonitor-agent
```

### Check Status

```bash
# Check service status
sudo systemctl status patchmonitor-agent

# Check if service is running
sudo systemctl is-active patchmonitor-agent

# Check if service is enabled
sudo systemctl is-enabled patchmonitor-agent
```

### View Logs

```bash
# View recent logs
sudo journalctl -u patchmonitor-agent

# Follow logs in real-time
sudo journalctl -u patchmonitor-agent -f

# View logs from today
sudo journalctl -u patchmonitor-agent --since today

# View logs with timestamps
sudo journalctl -u patchmonitor-agent -o short-iso
```

## Testing the Agent

### Run Once

Test the agent without starting the service:

```bash
sudo -u patchmonitor /opt/patchmonitor-agent/venv/bin/python \
  /opt/patchmonitor-agent/main.py \
  --server-url http://your-server.com \
  --token your-agent-token \
  --once \
  --verbose
```

### Check Data Collection

Verify that the agent can collect data:

```bash
# Test system information collection
sudo -u patchmonitor /opt/patchmonitor-agent/venv/bin/python -c "
import sys
sys.path.append('/opt/patchmonitor-agent')
from main import PatchMonitorAgent
agent = PatchMonitorAgent('http://your-server.com', 'your-token')
print(agent.collect_data())
"
```

### Test Server Connection

```bash
# Test API connectivity
curl -H "Authorization: Bearer your-agent-token" \
  http://your-server.com/api/agents/config
```

## Troubleshooting

### Common Issues

#### Agent Won't Start

1. **Check service status:**
   ```bash
   sudo systemctl status patchmonitor-agent
   ```

2. **Check logs for errors:**
   ```bash
   sudo journalctl -u patchmonitor-agent -n 50
   ```

3. **Verify Python installation:**
   ```bash
   python3 --version
   /opt/patchmonitor-agent/venv/bin/python --version
   ```

4. **Check file permissions:**
   ```bash
   ls -la /opt/patchmonitor-agent/
   sudo chown -R patchmonitor:patchmonitor /opt/patchmonitor-agent/
   ```

#### Can't Connect to Server

1. **Test network connectivity:**
   ```bash
   curl -v http://your-server.com/health
   ```

2. **Check firewall rules:**
   ```bash
   sudo ufw status
   sudo iptables -L
   ```

3. **Verify server URL and token:**
   ```bash
   cat /opt/patchmonitor-agent/config.json
   ```

4. **Test with verbose logging:**
   ```bash
   sudo -u patchmonitor /opt/patchmonitor-agent/venv/bin/python \
     /opt/patchmonitor-agent/main.py \
     --server-url http://your-server.com \
     --token your-agent-token \
     --once \
     --verbose
   ```

#### Data Collection Issues

1. **Check package manager:**
   ```bash
   # Ubuntu/Debian
   apt --version
   apt list --upgradable

   # RHEL/CentOS/Rocky/AlmaLinux
   dnf --version
   dnf check-update
   ```

2. **Verify permissions:**
   ```bash
   # Agent needs to read package manager data
   sudo -u patchmonitor apt list --upgradable
   ```

3. **Check system resources:**
   ```bash
   free -h
   df -h
   ```

#### Performance Issues

1. **Check system resources:**
   ```bash
   top -p $(pgrep -f patchmonitor-agent)
   ```

2. **Adjust collection interval:**
   ```bash
   # Edit configuration
   sudo nano /opt/patchmonitor-agent/config.json
   
   # Restart service
   sudo systemctl restart patchmonitor-agent
   ```

3. **Monitor logs for errors:**
   ```bash
   sudo journalctl -u patchmonitor-agent --since "1 hour ago"
   ```

### Debug Mode

Enable debug logging for troubleshooting:

1. **Edit configuration:**
   ```bash
   sudo nano /opt/patchmonitor-agent/config.json
   ```
   
   Add:
   ```json
   {
     "log_level": "DEBUG"
   }
   ```

2. **Restart service:**
   ```bash
   sudo systemctl restart patchmonitor-agent
   ```

3. **View debug logs:**
   ```bash
   sudo journalctl -u patchmonitor-agent -f
   ```

## Security Considerations

### Agent Token Security

1. **Use strong, unique tokens** for each host
2. **Rotate tokens regularly**
3. **Store tokens securely** (not in plain text)
4. **Limit token permissions** to only necessary operations

### Network Security

1. **Use HTTPS** for server communication
2. **Restrict network access** to monitoring server only
3. **Use VPN or private networks** when possible
4. **Monitor network traffic** for anomalies

### System Security

1. **Run agent as non-root user** (patchmonitor)
2. **Limit agent permissions** to minimum required
3. **Regular security updates** for agent and dependencies
4. **Monitor agent logs** for suspicious activity

### Data Privacy

1. **Minimize data collection** to necessary information only
2. **Encrypt sensitive data** in transit and at rest
3. **Regular data cleanup** of old information
4. **Comply with privacy regulations** (GDPR, etc.)

## Monitoring and Maintenance

### Health Checks

Create a monitoring script to check agent health:

```bash
#!/bin/bash
# /opt/patchmonitor-agent/health-check.sh

# Check if service is running
if ! systemctl is-active --quiet patchmonitor-agent; then
    echo "ERROR: Agent service is not running"
    exit 1
fi

# Check if agent can collect data
if ! sudo -u patchmonitor /opt/patchmonitor-agent/venv/bin/python \
     /opt/patchmonitor-agent/main.py --once --server-url http://your-server.com --token your-token; then
    echo "ERROR: Agent cannot collect data"
    exit 1
fi

echo "OK: Agent is healthy"
exit 0
```

### Log Rotation

Configure log rotation to prevent disk space issues:

```bash
# Create logrotate configuration
sudo tee /etc/logrotate.d/patchmonitor-agent > /dev/null <<EOF
/var/log/patchmonitor-agent.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 patchmonitor patchmonitor
    postrotate
        systemctl reload patchmonitor-agent
    endscript
}
EOF
```

### Updates

Keep the agent updated:

```bash
# Download latest version
sudo -u patchmonitor curl -o /opt/patchmonitor-agent/main.py \
  https://your-server.com/agent/main.py

# Restart service
sudo systemctl restart patchmonitor-agent
```

## Uninstallation

### Remove Agent

1. **Stop and disable service:**
   ```bash
   sudo systemctl stop patchmonitor-agent
   sudo systemctl disable patchmonitor-agent
   ```

2. **Remove service file:**
   ```bash
   sudo rm /etc/systemd/system/patchmonitor-agent.service
   sudo systemctl daemon-reload
   ```

3. **Remove installation directory:**
   ```bash
   sudo rm -rf /opt/patchmonitor-agent
   ```

4. **Remove user:**
   ```bash
   sudo userdel patchmonitor
   ```

### Clean Up

1. **Remove logs:**
   ```bash
   sudo journalctl --vacuum-time=1d
   ```

2. **Remove configuration:**
   ```bash
   sudo rm -f /etc/logrotate.d/patchmonitor-agent
   ```

## Support

For additional support:

1. **Check logs** for error messages
2. **Review documentation** for common issues
3. **Contact support** with detailed error information
4. **Check project issues** on GitHub or similar platforms
