#!/bin/bash
# Linux Patch Monitor Agent Installation Script

set -e

# Default values
SERVER_URL=""
AGENT_TOKEN=""
INSTALL_DIR="/opt/patchmonitor-agent"
SERVICE_NAME="patchmonitor-agent"
USER="patchmonitor"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root"
        exit 1
    fi
}

# Function to detect OS and package manager
detect_os() {
    if command -v apt-get &> /dev/null; then
        OS="debian"
        PKG_MANAGER="apt"
    elif command -v dnf &> /dev/null; then
        OS="redhat"
        PKG_MANAGER="dnf"
    elif command -v yum &> /dev/null; then
        OS="redhat"
        PKG_MANAGER="yum"
    elif command -v zypper &> /dev/null; then
        OS="suse"
        PKG_MANAGER="zypper"
    elif command -v pacman &> /dev/null; then
        OS="arch"
        PKG_MANAGER="pacman"
    else
        print_error "Unsupported operating system"
        exit 1
    fi
    
    print_status "Detected OS: $OS with package manager: $PKG_MANAGER"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    case $PKG_MANAGER in
        apt)
            apt-get update
            apt-get install -y python3 python3-pip python3-venv curl
            ;;
        dnf|yum)
            $PKG_MANAGER install -y python3 python3-pip curl
            ;;
        zypper)
            zypper install -y python3 python3-pip curl
            ;;
        pacman)
            pacman -S --noconfirm python python-pip curl
            ;;
    esac
}

# Function to create user
create_user() {
    if ! id "$USER" &>/dev/null; then
        print_status "Creating user: $USER"
        useradd --system --no-create-home --shell /bin/false "$USER"
    else
        print_status "User $USER already exists"
    fi
}

# Function to install agent
install_agent() {
    print_status "Installing agent to $INSTALL_DIR"
    
    # Create installation directory
    mkdir -p "$INSTALL_DIR"
    
    # Download agent files from server
    print_status "Downloading agent files from $SERVER_URL"
    
    # Extract base URL (remove any /api/... path)
    BASE_URL="${SERVER_URL%/api*}"
    
    if ! curl -f -o "$INSTALL_DIR/main.py" "$BASE_URL/api/agents/download/main.py"; then
        print_error "Failed to download main.py from $BASE_URL/api/agents/download/main.py"
        exit 1
    fi
    
    if ! curl -f -o "$INSTALL_DIR/requirements.txt" "$BASE_URL/api/agents/download/requirements.txt"; then
        print_error "Failed to download requirements.txt from $BASE_URL/api/agents/download/requirements.txt"
        exit 1
    fi
    
    print_status "Agent files downloaded successfully"
    
    # Create virtual environment
    python3 -m venv "$INSTALL_DIR/venv"
    
    # Install Python dependencies
    "$INSTALL_DIR/venv/bin/pip" install -r "$INSTALL_DIR/requirements.txt"
    
    # Create configuration file
    cat > "$INSTALL_DIR/config.json" << EOF
{
    "server_url": "$SERVER_URL",
    "agent_token": "$AGENT_TOKEN",
    "collection_interval": 3600
}
EOF
    
    # Set permissions
    chown -R "$USER:$USER" "$INSTALL_DIR"
    chmod +x "$INSTALL_DIR/main.py"
}

# Function to create systemd service
create_service() {
    print_status "Creating systemd service"
    
    cat > "/etc/systemd/system/$SERVICE_NAME.service" << EOF
[Unit]
Description=Linux Patch Monitor Agent
After=network.target

[Service]
Type=simple
User=$USER
Group=$USER
WorkingDirectory=$INSTALL_DIR
ExecStart=$INSTALL_DIR/venv/bin/python $INSTALL_DIR/main.py --server-url $SERVER_URL --token $AGENT_TOKEN
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
    
    # Reload systemd and enable service
    systemctl daemon-reload
    systemctl enable "$SERVICE_NAME"
}

# Function to start service
start_service() {
    print_status "Starting $SERVICE_NAME service"
    systemctl start "$SERVICE_NAME"
    
    # Wait a moment and check status
    sleep 2
    if systemctl is-active --quiet "$SERVICE_NAME"; then
        print_status "Service started successfully"
    else
        print_error "Failed to start service"
        systemctl status "$SERVICE_NAME"
        exit 1
    fi
}

# Function to show status
show_status() {
    print_status "Service status:"
    systemctl status "$SERVICE_NAME" --no-pager
    
    print_status "Service logs (last 20 lines):"
    journalctl -u "$SERVICE_NAME" --no-pager -n 20
}

# Function to uninstall
uninstall() {
    print_status "Uninstalling $SERVICE_NAME"
    
    # Stop and disable service
    systemctl stop "$SERVICE_NAME" 2>/dev/null || true
    systemctl disable "$SERVICE_NAME" 2>/dev/null || true
    
    # Remove service file
    rm -f "/etc/systemd/system/$SERVICE_NAME.service"
    systemctl daemon-reload
    
    # Remove installation directory
    rm -rf "$INSTALL_DIR"
    
    # Remove user
    userdel "$USER" 2>/dev/null || true
    
    print_status "Uninstallation complete"
}

# Main function
main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --server-url)
                SERVER_URL="$2"
                shift 2
                ;;
            --token)
                AGENT_TOKEN="$2"
                shift 2
                ;;
            --install-dir)
                INSTALL_DIR="$2"
                shift 2
                ;;
            --uninstall)
                check_root
                uninstall
                exit 0
                ;;
            --help)
                echo "Usage: $0 --server-url URL --token TOKEN [options]"
                echo ""
                echo "Options:"
                echo "  --server-url URL     Monitoring server URL (required)"
                echo "  --token TOKEN        Agent authentication token (required)"
                echo "  --install-dir DIR    Installation directory (default: /opt/patchmonitor-agent)"
                echo "  --uninstall          Uninstall the agent"
                echo "  --help               Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Validate required arguments
    if [[ -z "$SERVER_URL" || -z "$AGENT_TOKEN" ]]; then
        print_error "Server URL and token are required"
        echo "Use --help for usage information"
        exit 1
    fi
    
    print_status "Installing Linux Patch Monitor Agent"
    print_status "Server URL: $SERVER_URL"
    print_status "Installation directory: $INSTALL_DIR"
    
    check_root
    detect_os
    install_dependencies
    create_user
    install_agent
    create_service
    start_service
    show_status
    
    print_status "Installation complete!"
    print_status "The agent is now running and will collect data every hour"
    print_status "Check status with: systemctl status $SERVICE_NAME"
    print_status "View logs with: journalctl -u $SERVICE_NAME -f"
}

# Run main function
main "$@"
